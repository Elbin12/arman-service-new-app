import React, { useRef } from 'react';
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
import { useGetQuoteDetailsQuery } from '../../store/api/user/quoteApi';
import { Info } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const statusStyles = {
  pending: { bgcolor: 'warning.light', color: 'warning.dark' },
  approved: { bgcolor: 'success.light', color: 'success.dark' },
  rejected: { bgcolor: 'error.light', color: 'error.dark' },
  submitted: { bgcolor: 'info.light', color: 'info.dark' },
  draft: { bgcolor: 'grey.100', color: 'grey.800' },
  responses_completed: { bgcolor: 'success.light', color: 'success.dark' },
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
  } = useGetQuoteDetailsQuery(id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const sigCanvas = useRef();

  if (isLoading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
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
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" color="error" gutterBottom>
          Failed to load quote
        </Typography>
        <Typography variant="body2">
          {error?.message || 'Quote not found or something went wrong.'}
        </Typography>
      </Box>
    );
  }

  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
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
  } = quote;

  return (
    <Box className="min-h-screen" sx={{ background: 'linear-gradient(135deg,#f0f4f9 0%,#e2e8f0 70%)', pb: 6 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor:'white',
          bg: 'white',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 4,
          py: 2,
        }}
        className='fixed w-full z-20'
      >
        <Box maxWidth="1200px" mx="auto" px={{ xs: 2, md: 4 }} display="flex" flexDirection="column" gap={1} >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              {/* <Button
                variant="text"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{ textTransform: 'none' }}
              >
                Back
              </Button> */}
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Quote Details
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    ID: {quote.id}
                  </Typography>
                  <Chip
                    label={status?.charAt(0).toUpperCase() + status?.slice(1)}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 1,
                      ...statusStyles[status?.toLowerCase()] || statusStyles['draft'],
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box maxWidth="1200px" className='py-36' mx="auto" px={{ xs: 2, md: 4 }}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Left column */}
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Contact Card */}
            <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  background: 'linear-gradient(90deg,#2563eb,#7c3aed)',
                  color: 'white',
                  px: 3,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Person fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Contact Information
                </Typography>
              </Box>
              <CardContent sx={{ pt: 2 }}>
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
                  <Box flex="1" display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person color="action" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600">
                          {customer_name || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Full Name
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Phone color="action" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600">
                          {customer_phone || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Phone
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box flex="1" display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Mail color="action" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600">
                          {customer_email || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Email
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <Home color="action" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600">
                          {customer_address || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Address
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                {house_sqft && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box display="flex" alignItems="center" gap={1}>
                      <Home color="action" />
                      <Box>
                        <Typography variant="body2">
                          {house_sqft} sq ft
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
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
              <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    background: 'linear-gradient(90deg,#059669,#10b981)',
                    color: 'white',
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <BusinessCenter fontSize="small" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Services & Packages
                  </Typography>
                  <Chip
                    label={`${service_selections.length} Service${service_selections.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      ml: 'auto',
                    }}
                  />
                </Box>
                <CardContent>
                  <Box display="flex" flexDirection="column" gap={4}>
                    {service_selections.map((serviceSelection, index) => (
                      <Box key={serviceSelection.id}>
                        <Box display="flex" flexDirection="column" gap={2}>
                          <Box>
                            <Typography variant="h6" fontWeight="600" color="primary.main">
                              {serviceSelection.service_details?.name}
                            </Typography>
                            {serviceSelection.service_details?.description && (
                              <Typography variant="body2" color="text.secondary">
                                {serviceSelection.service_details.description}
                              </Typography>
                            )}
                          </Box>
                          <Box
                            sx={{
                              background: '#ecfdf5',
                              borderRadius: 1,
                              p: 2,
                              border: '1px solid',
                              borderColor: 'success.light',
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <LocalOffer fontSize="small" sx={{ color: '#047857' }} />
                              <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#065f46' }}>
                                {serviceSelection.selected_package_details?.name} - ${parseFloat(serviceSelection.selected_package_details?.base_price || 0).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#047857', ml: 'auto' }}>
                                Final: ${parseFloat(serviceSelection.final_total_price || 0).toFixed(2)}
                              </Typography>
                            </Box>
                            
                            {/* Question Adjustments */}
                            {parseFloat(serviceSelection.question_adjustments || 0) !== 0 && (
                              <Typography variant="caption" sx={{ color: '#047857', display: 'block', mb: 1 }}>
                                Question Adjustments: ${parseFloat(serviceSelection.question_adjustments || 0).toFixed(2)}
                              </Typography>
                            )}
                            
                            {serviceSelection.package_quotes?.[0] && (
                              <Box>
                                <Typography variant="caption" fontWeight="600" gutterBottom>
                                  Package Features:
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={1}>
                                  {/* Included Features */}
                                  {serviceSelection.package_quotes[0].included_features_details?.map((feature) => (
                                    <Box
                                      key={feature.id}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        p: 1,
                                        borderRadius: 1,
                                        background: 'rgba(16,185,129,0.08)',
                                        border: '1px solid',
                                        borderColor: 'success.light',
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          background: '#10b981',
                                        }}
                                      />
                                      <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
                                        {feature.name}
                                      </Typography>
                                      <Chip
                                        label="Included"
                                        size="small"
                                        sx={{
                                          ml: 'auto',
                                          bgcolor: 'success.light',
                                          fontSize: '0.7rem',
                                          height: 20,
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
                                        gap: 1,
                                        p: 1,
                                        borderRadius: 1,
                                        background: 'rgba(107,114,128,0.04)',
                                        border: '1px solid',
                                        borderColor: 'grey.200',
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          background: '#9ca3af',
                                        }}
                                      />
                                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                        {feature.name}
                                      </Typography>
                                      <Chip
                                        label="Excluded"
                                        size="small"
                                        sx={{
                                          ml: 'auto',
                                          bgcolor: 'grey.100',
                                          fontSize: '0.7rem',
                                          height: 20,
                                        }}
                                      />
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                        {index < service_selections.length - 1 && <Divider sx={{ my: 2 }} />}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Question Responses */}
            {service_selections?.some(service => service.question_responses?.length > 0) && (
              <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    background: 'linear-gradient(90deg,#9333ea,#c084fc)',
                    color: 'white',
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <QuestionAnswer fontSize="small" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Question Responses
                  </Typography>
                </Box>
                <CardContent>
                  <Box display="flex" flexDirection="column" gap={4}>
                    {service_selections.map((service, serviceIndex) => (
                      service.question_responses?.length > 0 && (
                        <Box key={service.id}>
                          {service_selections.length > 1 && (
                            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                              {service.service_details?.name}
                            </Typography>
                          )}
                          <Box display="flex" flexDirection="column" gap={2}>
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
                                        <Box sx={{ mt: 1 }}>
                                          {response.sub_question_responses.map((subResp) => (
                                            <Box key={subResp.id} sx={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              py: 0.5,
                                              borderBottom: '1px solid rgba(0,0,0,0.1)'
                                            }}>
                                              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                                {subResp.sub_question_text}
                                              </Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    fontWeight: 600,
                                                    color: subResp.answer ? 'success.main' : 'error.main'
                                                  }}
                                                >
                                                  {formatYesNo(subResp.answer)}
                                                </Typography>
                                                {parseFloat(subResp.price_adjustment || 0) !== 0 && (
                                                  <Chip
                                                    label={`$${parseFloat(subResp.price_adjustment).toFixed(2)}`}
                                                    size="small"
                                                    sx={{
                                                      bgcolor: 'info.light',
                                                      fontSize: '0.75rem',
                                                      height: 20
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
                                    background: 'rgba(243,244,246,0.8)',
                                    borderRadius: 1,
                                    p: 3,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    position: 'relative',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="600" sx={{ flex: 1 }}>
                                      {response.question_text}
                                    </Typography>
                                    <Chip
                                      label={response.question_type.replace('_', ' ').toUpperCase()}
                                      size="small"
                                      sx={{
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText',
                                        fontSize: '0.7rem',
                                        height: 20,
                                        ml: 2
                                      }}
                                    />
                                  </Box>
                                  
                                  {response.question_type !== 'multiple_yes_no' ? (
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      <strong>Answer:</strong> {answerDisplay}
                                    </Typography>
                                  ) : (
                                    <Box>
                                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Responses:
                                      </Typography>
                                      {answerDisplay}
                                    </Box>
                                  )}
                                  
                                  {parseFloat(response.price_adjustment || 0) !== 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      Price Adjustment: ${parseFloat(response.price_adjustment || 0).toFixed(2)}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                          {serviceIndex < service_selections.length - 1 && <Divider sx={{ my: 2 }} />}
                        </Box>
                      )
                    ))}
                    {/* Additional Information */}
              {additional_data && (
                <Card sx={{ border: "1px solid #334155" }}>
                  <Box sx={{ p: 3, borderBottom: "1px solid #334155" }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#3b82f6" }}>
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
              elevation={3}
              sx={{
                borderRadius: 2,
                position: 'sticky',
                top: 80,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(90deg,#4f46e5,#6366f1)',
                  color: 'white',
                  px: 3,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Receipt fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Pricing Summary
                </Typography>
              </Box>
              <CardContent>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">Base Price</Typography>
                    <Typography variant="subtitle2">
                      ${parseFloat(total_base_price || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">Surcharges</Typography>
                    <Typography variant="subtitle2">
                      ${parseFloat(total_surcharges || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">Adjustments</Typography>
                    <Typography variant="subtitle2">
                      ${parseFloat(total_adjustments || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(243,244,246,0.5)',
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="600">
                      Final Total
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${parseFloat(final_total || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  {/* Service breakdown */}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight="600" color="text.secondary">
                    Service Breakdown:
                  </Typography>
                  {service_selections?.map((service) => (
                    <Box
                      key={service.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {service.service_details?.name}
                      </Typography>
                      <Typography variant="caption">
                        ${parseFloat(service.final_total_price || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Divider />
                  <Typography variant="caption" color="text.secondary" align="center">
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
              </CardContent>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default QuoteDetailsPage;