import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Paper,
  Button,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Person,
  BusinessCenter,
  LocalOffer,
  QuestionAnswer,
  Receipt,
  LocationOn,
  ArrowBack,
  Mail,
  Phone,
  Home,
} from '@mui/icons-material';
import { useCreateScheduleMutation, useGetQuoteDetailsQuery } from '../../store/api/user/quoteApi';
import { Info } from 'lucide-react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Minimal, unified color palette
const colors = {
  // Primary blue - single brand color
  primary: {
    50: '#f8fafc',
    100: '#f1f5f9', 
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569', // Main primary
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Neutral grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  // Status colors - minimal set
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

const statusStyles = {
  pending: { bgcolor: colors.neutral[100], color: colors.neutral[700] },
  approved: { bgcolor: '#dcfce7', color: '#166534' },
  rejected: { bgcolor: '#fee2e2', color: '#991b1b' },
  submitted: { bgcolor: colors.neutral[100], color: colors.neutral[700] },
  draft: { bgcolor: colors.neutral[100], color: colors.neutral[700] },
  responses_completed: { bgcolor: '#dcfce7', color: '#166534' },
};

const formatYesNo = (val) => {
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  return 'N/A';
};

const QuoteDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: quote,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetQuoteDetailsQuery(id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [createSchedule] = useCreateScheduleMutation();

  const [selectedDate, setSelectedDate] = useState(null);

  if (isLoading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress sx={{ color: colors.primary[500] }} />
      </Box>
    );
  }

  if (isError || !quote) {
    return (
      <Box p={4}>
        <Button
          startIcon={<ArrowBack />}
          variant="text"
          onClick={() => navigate(-1)}
          sx={{ mb: 2, color: colors.primary[500] }}
        >
          Back
        </Button>
        <Typography variant="h5" color={colors.error} gutterBottom>
          Failed to load quote
        </Typography>
        <Typography variant="body2" color={colors.neutral[600]}>
          {error?.message || 'Quote not found or something went wrong.'}
        </Typography>
      </Box>
    );
  }

  const {
    contact,
    address,
    house_sqft,
    location_details,
    status,
    total_base_price,
    total_adjustments,
    total_surcharges,
    final_total,
    created_at,
    expires_at,
    service_selections,
    quote_surcharge_applicable,
    additional_data,
    custom_products,
    custom_service_total,
    quote_schedule
  } = quote;

  const handleSchedule = async () => {
    if (!selectedDate) return;
    // Here you can call an API or handle scheduling
    console.log("Scheduled date:", selectedDate, quote_schedule?.quoted_by);
    const payload = {
      id: quote.id,
      scheduled_date: selectedDate,
      is_submitted: true,
      quoted_by: quote_schedule?.quoted_by,  // must not be undefined
    };
    try {
      const response = await createSchedule(payload).unwrap()
      await refetch();
    } catch (err) {
      console.error("Failed.", err)
    }
  };

  return (
    <Box 
      className="min-h-screen" 
      sx={{ 
        bgcolor: colors.neutral[50],
        pb: 6 
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: `1px solid ${colors.neutral[200]}`,
          mb: 4,
          py: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
        className='fixed w-full z-20'
      >
        <Box maxWidth="1200px" mx="auto" px={{ xs: 2, md: 4 }} display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box>
                <Typography variant="h4" fontWeight="600" color={colors.neutral[900]}>
                  Quote Details
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                  <Typography variant="body2" color={colors.neutral[600]}>
                    ID: {quote.id}
                  </Typography>
                  <Chip
                    label={status?.charAt(0).toUpperCase() + status?.slice(1)}
                    size="small"
                    sx={{
                      fontWeight: 500,
                      borderRadius: 1.5,
                      ...statusStyles[status?.toLowerCase()] || statusStyles['draft'],
                    }}
                  />
                  <Typography variant="body2" color={colors.neutral[600]}>
                    Created: {new Date(created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box maxWidth="1300px" className='py-36' mx="auto" px={{ xs: 2, md: 4 }}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Left column */}
          <Box display="flex" flexDirection="column" gap={4}>
            {/* Contact Card */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `1px solid ${colors.neutral[200]}` }}>
              <Box
                sx={{
                  bgcolor: colors.primary[500],
                  color: 'white',
                  px: 3,
                  py: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Person fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Contact Information
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
                  <Box flex="1" display="flex" flexDirection="column" gap={2.5}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: colors.neutral[100], color: colors.neutral[600], width: 32, height: 32 }}>
                        <Person fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="500" color={colors.neutral[900]}>
                          {contact?.first_name || '—'} {contact?.last_name}
                        </Typography>
                        <Typography variant="caption" color={colors.neutral[500]}>
                          Full Name
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: colors.neutral[100], color: colors.neutral[600], width: 32, height: 32 }}>
                        <Phone fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="500" color={colors.neutral[900]}>
                          {contact?.phone || '—'}
                        </Typography>
                        <Typography variant="caption" color={colors.neutral[500]}>
                          Phone
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box flex="1" display="flex" flexDirection="column" gap={2.5}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: colors.neutral[100], color: colors.neutral[600], width: 32, height: 32 }}>
                        <Mail fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="500" color={colors.neutral[900]}>
                          {contact?.email || '—'}
                        </Typography>
                        <Typography variant="caption" color={colors.neutral[500]}>
                          Email
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Avatar sx={{ bgcolor: colors.neutral[100], color: colors.neutral[600], width: 32, height: 32 }}>
                        <Home fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="500" color={colors.neutral[900]}>
                          {address?.name} — {address?.street_address}, {address?.city}, {address?.state}, {address?.postal_code}
                        </Typography>
                        <Typography variant="caption" color={colors.neutral[500]}>
                          Address
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                {house_sqft && (
                  <>
                    <Divider sx={{ my: 3, borderColor: colors.neutral[200] }} />
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: colors.neutral[100], color: colors.neutral[600], width: 32, height: 32 }}>
                        <Home fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color={colors.neutral[900]} fontWeight="500">
                          {house_sqft} sq ft
                        </Typography>
                        <Typography variant="caption" color={colors.neutral[500]}>
                          House Size
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Services & Packages Card */}
            {service_selections && service_selections.length > 0 && (
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `1px solid ${colors.neutral[200]}` }}>
                <Box
                  sx={{
                    bgcolor: colors.primary[500],
                    color: 'white',
                    px: 3,
                    py: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <BusinessCenter fontSize="small" />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Services & Packages
                  </Typography>
                  <Chip
                    label={`${service_selections.length} Service${service_selections.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      ml: 'auto',
                      fontWeight: 500,
                    }}
                  />
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" flexDirection="column" gap={4}>
                    {service_selections.map((serviceSelection, index) => (
                      <Box key={serviceSelection.id}>
                        <Box display="flex" flexDirection="column" gap={3}>
                          <Box>
                            <Typography variant="h6" fontWeight="500" color={colors.neutral[900]}>
                              {serviceSelection.service_details?.name}
                            </Typography>
                            {serviceSelection.service_details?.description && (
                              <Typography variant="body2" color={colors.neutral[600]} sx={{ mt: 0.5 }}>
                                {serviceSelection.service_details.description}
                              </Typography>
                            )}
                          </Box>
                          <Box
                            sx={{
                              background: colors.neutral[50],
                              borderRadius: 2,
                              p: 3,
                              border: `1px solid ${colors.neutral[200]}`,
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <LocalOffer fontSize="small" sx={{ color: colors.neutral[600] }} />
                              <Typography variant="body2" fontWeight="500" color={colors.neutral[900]}>
                                {serviceSelection.selected_package_details?.name} - ${parseFloat(serviceSelection.selected_package_details?.base_price || 0).toFixed(2)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.neutral[700], ml: 'auto', fontWeight: 500 }}>
                                Final: ${parseFloat(serviceSelection.final_total_price || 0).toFixed(2)}
                              </Typography>
                            </Box>
                            
                            {/* Question Adjustments */}
                            {parseFloat(serviceSelection.question_adjustments || 0) !== 0 && (
                              <Typography variant="caption" sx={{ color: colors.neutral[600], display: 'block', mb: 2 }}>
                                Question Adjustments: ${parseFloat(serviceSelection.question_adjustments || 0).toFixed(2)}
                              </Typography>
                            )}
                            
                            {serviceSelection.package_quotes?.[0] && (
                              <Box>
                                <Typography variant="caption" fontWeight="500" gutterBottom color={colors.neutral[700]}>
                                  Package Features:
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
                                  {/* Included Features */}
                                  {serviceSelection.package_quotes[0].included_features_details?.map((feature) => (
                                    <Box
                                      key={feature.id}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: 2,
                                        borderRadius: 1.5,
                                        background: 'white',
                                        border: `1px solid ${colors.neutral[200]}`,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          background: colors.success,
                                        }}
                                      />
                                      <Typography variant="body2" sx={{ color: colors.neutral[800], fontSize: '0.875rem' }}>
                                        {feature.name}
                                      </Typography>
                                      <Chip
                                        label="Included"
                                        size="small"
                                        sx={{
                                          ml: 'auto',
                                          bgcolor: colors.neutral[100],
                                          color: colors.neutral[700],
                                          fontSize: '0.7rem',
                                          height: 22,
                                        }}
                                      />
                                    </Box>
                                  ))}
                                  {/* Excluded Features */}
                                  {serviceSelection.package_quotes[0].excluded_features_details?.map((feature) => (
                                    <Box
                                      key={feature.id}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: 2,
                                        borderRadius: 1.5,
                                        background: 'white',
                                        border: `1px solid ${colors.neutral[200]}`,
                                        opacity: 0.6,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          background: colors.neutral[400],
                                        }}
                                      />
                                      <Typography variant="body2" sx={{ color: colors.neutral[600], fontSize: '0.875rem' }}>
                                        {feature.name}
                                      </Typography>
                                      <Chip
                                        label="Excluded"
                                        size="small"
                                        sx={{
                                          ml: 'auto',
                                          bgcolor: colors.neutral[100],
                                          color: colors.neutral[500],
                                          fontSize: '0.7rem',
                                          height: 22,
                                        }}
                                      />
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                        {index < service_selections.length - 1 && <Divider sx={{ my: 3, borderColor: colors.neutral[200] }} />}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Custom Products Card */}
            {custom_products && custom_products.length > 0 && (
              <Card sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: `1px solid ${colors.neutral[200]}` }}>
                <Box
                  sx={{
                    bgcolor: colors.primary[500],
                    color: "white",
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <LocalOffer fontSize="small" />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Custom Services
                  </Typography>
                  <Chip
                    label={`${custom_products.length} Service${custom_products.length !== 1 ? "s" : ""}`}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: "white",
                      ml: "auto",
                      fontWeight: 500,
                    }}
                  />
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" flexDirection="column" gap={3}>
                    {custom_products.map((product) => (
                      <Box
                        key={product.id}
                        sx={{
                          background: colors.neutral[50],
                          border: `1px solid ${colors.neutral[200]}`,
                          borderRadius: 2,
                          p: 3,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="500" color={colors.neutral[900]}>
                          {product.product_name}
                        </Typography>
                        {product.description && (
                          <Typography variant="body2" color={colors.neutral[600]} sx={{ mb: 2 }}>
                            {product.description}
                          </Typography>
                        )}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color={colors.neutral[500]}>
                            Product ID: {product.id}
                          </Typography>
                          <Typography variant="subtitle2" fontWeight="500" color={colors.neutral[800]}>
                            ${parseFloat(product.price || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Question Responses */}
            {service_selections?.some(service => service.question_responses?.length > 0) && (
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `1px solid ${colors.neutral[200]}` }}>
                <Box
                  sx={{
                    bgcolor: colors.primary[500],
                    color: 'white',
                    px: 3,
                    py: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <QuestionAnswer fontSize="small" />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Question Responses
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" flexDirection="column" gap={4}>
                    {service_selections.map((service, serviceIndex) => (
                      service.question_responses?.length > 0 && (
                        <Box key={service.id}>
                          {service_selections.length > 1 && (
                            <Typography variant="h6" sx={{ mb: 3, color: colors.neutral[900], fontWeight: 500 }}>
                              {service.service_details?.name}
                            </Typography>
                          )}
                          <Box display="flex" flexDirection="column" gap={3}>
                            {service.question_responses.map((response) => {
                              const renderAnswerDisplay = () => {
                                switch (response.question_type) {
                                  case 'yes_no':
                                  case 'conditional':
                                    return formatYesNo(response.yes_no_answer);
                                  
                                  case 'describe':
                                  case 'options':
                                    if (response.option_responses?.length > 0) {
                                      return response.option_responses.map(opt => opt.option_text).join(', ');
                                    }
                                    if (response.text_answer) {
                                      return response.text_answer;
                                    }
                                    return 'Not answered';
                                  
                                  case 'quantity':
                                    if (response.option_responses?.length > 0) {
                                      return response.option_responses
                                        .map(opt => `${opt.option_text} (Qty: ${opt.quantity})`)
                                        .join(', ');
                                    }
                                    return 'Not answered';
                                  
                                  case 'multiple_yes_no':
                                    if (response.sub_question_responses?.length > 0) {
                                      return (
                                        <Box sx={{ mt: 2 }}>
                                          {response.sub_question_responses.map((subResp) => (
                                            <Box key={subResp.id} sx={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              py: 1.5,
                                              px: 2,
                                              mb: 1,
                                              borderRadius: 1,
                                              background: colors.neutral[50],
                                              border: `1px solid ${colors.neutral[200]}`
                                            }}>
                                              <Typography variant="body2" sx={{ fontSize: '0.875rem', color: colors.neutral[800] }}>
                                                {subResp.sub_question_text}
                                              </Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    fontWeight: 500,
                                                    color: subResp.answer ? colors.success : colors.neutral[600]
                                                  }}
                                                >
                                                  {formatYesNo(subResp.answer)}
                                                </Typography>
                                                {parseFloat(subResp.price_adjustment || 0) !== 0 && (
                                                  <Chip
                                                    label={`$${parseFloat(subResp.price_adjustment).toFixed(2)}`}
                                                    size="small"
                                                    sx={{
                                                      bgcolor: colors.neutral[100],
                                                      color: colors.neutral[700],
                                                      fontSize: '0.75rem',
                                                      height: 22
                                                    }}
                                                  />
                                                )}
                                              </Box>
                                            </Box>
                                          ))}
                                        </Box>
                                      );
                                    }
                                    return 'Not answered';
                                  
                                  default:
                                    if (response.text_answer) {
                                      return response.text_answer;
                                    }
                                    return 'Not answered';
                                }
                              };

                              const answerDisplay = renderAnswerDisplay();
                              
                              return (
                                <Box
                                  key={response.id}
                                  sx={{
                                    background: colors.neutral[50],
                                    borderRadius: 2,
                                    p: 3,
                                    border: `1px solid ${colors.neutral[200]}`,
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="500" sx={{ flex: 1, color: colors.neutral[900] }}>
                                      {response.question_text}
                                    </Typography>
                                    <Chip
                                      label={response.question_type.replace('_', ' ').toUpperCase()}
                                      size="small"
                                      sx={{
                                        bgcolor: colors.neutral[100],
                                        color: colors.neutral[700],
                                        fontSize: '0.7rem',
                                        height: 22,
                                        ml: 2
                                      }}
                                    />
                                  </Box>
                                  
                                  {response.question_type !== 'multiple_yes_no' ? (
                                    <Typography variant="body2" sx={{ mb: 1, color: colors.neutral[700] }}>
                                      <strong>Answer:</strong> {answerDisplay}
                                    </Typography>
                                  ) : (
                                    <Box>
                                      <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, color: colors.neutral[700] }}>
                                        Responses:
                                      </Typography>
                                      {answerDisplay}
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                          {serviceIndex < service_selections.length - 1 && <Divider sx={{ my: 3, borderColor: colors.neutral[200] }} />}
                        </Box>
                      )
                    ))}
                    
                    {/* Additional Information */}
                    {additional_data && (
                      <Card sx={{ border: `1px solid ${colors.neutral[300]}`, borderRadius: 2, mt: 2 }}>
                        <Box sx={{ p: 3, borderBottom: `1px solid ${colors.neutral[200]}` }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: colors.primary[500] }}>
                              <Info />
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Additional Information
                            </Typography>
                          </Stack>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                          <Stack spacing={3}>
                            {additional_data.signature && (
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 1 }}>
                                  Signature
                                </Typography>
                                <img
                                  src={`data:image/png;base64,${additional_data.signature}`}
                                  alt="Signature"
                                  style={{ border: "1px solid #ccc", maxWidth: "200px" }}
                                />
                              </Box>
                            )}

                            {additional_data.additional_notes && (
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 1 }}>
                                  Additional Notes
                                </Typography>
                                <Box
                                  sx={{
                                    border: "1px solid #334155",
                                    borderRadius: 1,
                                    p: 2,
                                  }}
                                >
                                  <Typography variant="body2" >
                                    {additional_data.additional_notes}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Right column - pricing */}
          <Box>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                position: 'sticky',
                top: 100,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <Box
                sx={{
                  bgcolor: colors.primary[500],
                  color: 'white',
                  px: 3,
                  py: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Receipt fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Pricing Summary
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" flexDirection="column" gap={2.5}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                      }}
                    >
                      <Typography variant="body2" color={colors.neutral[600]}>Base Price</Typography>
                      <Typography variant="body2" fontWeight="500" color={colors.neutral[900]}>
                        ${parseFloat(total_base_price || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                      }}
                    >
                      <Typography variant="body2" color={colors.neutral[600]}>Custom Services</Typography>
                      <Typography variant="body2" fontWeight="500" color={colors.neutral[900]}>
                        ${parseFloat(custom_service_total || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                      }}
                    >
                      <Typography variant="body2" color={colors.neutral[600]}>Adjustments</Typography>
                      <Typography variant="body2" fontWeight="500" color={colors.neutral[900]}>
                        ${parseFloat(total_adjustments || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ borderColor: colors.neutral[300] }} />
                  
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: colors.neutral[50],
                      p: 2.5,
                      borderRadius: 1.5,
                      border: `1px solid ${colors.neutral[200]}`,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="600" color={colors.neutral[900]}>
                      Final Total
                    </Typography>
                    <Box textAlign="right">
                      <Typography variant="h6" color={colors.neutral[900]} fontWeight="600">
                        ${parseFloat(final_total * 1.0825 || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color={colors.neutral[500]} fontWeight="500">
                        Plus Tax
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ borderColor: colors.neutral[300] }} />

                  {!quote_schedule?.is_submitted?
                    <Box>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                          label="Select Date & Time"
                          value={selectedDate}
                          onChange={(newValue) => setSelectedDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                            },
                          }}
                        />
                      </LocalizationProvider>

                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          mt: 2,
                          bgcolor: colors.primary[600],
                          "&:hover": { bgcolor: colors.primary[700] },
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 500,
                        }}
                        onClick={handleSchedule}
                        disabled={!selectedDate}
                      >
                        Schedule
                      </Button>
                    </Box>
                    :
                    <Typography variant="caption" color={colors.neutral[500]} align="center">
                      Quote Scheduled on{' '}
                      {new Date(quote_schedule?.scheduled_date).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  }
                  
                  <Box textAlign="center" pt={1}>
                    <Typography variant="caption" color={colors.neutral[500]} align="center">
                      Quote created on{' '}
                      {new Date(created_at).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default QuoteDetailsPage;