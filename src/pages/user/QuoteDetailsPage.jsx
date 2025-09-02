import React, { useRef, useState, useEffect } from 'react';
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
  Container,
  Grid,
  Collapse,
  IconButton,
  Alert,
  AlertTitle,
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
  ExpandMore,
  ExpandLess,
  Check,
  Close,
  Add,
  Schedule,
  CalendarToday,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material';
import { useCreateScheduleMutation, useGetQuoteDetailsQuery } from '../../store/api/user/quoteApi';
import { Info } from 'lucide-react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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
  const [expandedServices, setExpandedServices] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  
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

  // Expand all services by default
  useEffect(() => {
    if (quote?.service_selections) {
      const initialExpanded = {};
      quote.service_selections.forEach((service) => {
        initialExpanded[service.id] = true;
      });
      setExpandedServices(initialExpanded);
    }
  }, [quote]);

  const toggleServiceExpansion = (serviceId) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  const handleSchedule = async () => {
    if (!selectedDate) return;
    console.log("Scheduled date:", selectedDate, quote.quote_schedule?.quoted_by);
    const payload = {
      id: quote.id,
      scheduled_date: selectedDate,
      is_submitted: true,
      quoted_by: quote.quote_schedule?.quoted_by,
    };
    try {
      const response = await createSchedule(payload).unwrap()
      await refetch();
    } catch (err) {
      console.error("Failed.", err)
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#023c8f' }} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading quote details...
        </Typography>
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

  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  const renderQuestionResponse = (response) => {
    switch (response.question_type) {
      case "yes_no":
      case "conditional":
        return response.yes_no_answer ? "Yes" : "No";
      case "multiple_yes_no":
        return (
          response.sub_question_responses
            .filter((sub) => sub.answer)
            .map((sub) => sub.sub_question_text)
            .join(", ") || "None selected"
        );
      case "quantity":
        return response.option_responses.map((opt) => `${opt.option_text}: ${opt.quantity}`).join(", ");
      case "describe":
        return response.option_responses.map((opt) => opt.option_text).join(", ");
      default:
        return "N/A";
    }
  };

  return (
    <Box className="min-h-screen" sx={{ background: 'linear-gradient(135deg,#f0f4f9 0%,#e2e8f0 70%)', pb: 6 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 4,
          py: 2,
        }}
        className='fixed w-full z-20'
      >
        <Box maxWidth="1200px" mx="auto" px={{ xs: 2, md: 4 }} display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box>
                <Typography variant="h4" color='#023c8f' fontWeight="600">
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
      <Box maxWidth="1400px" className='py-32' mx="auto" px={{ xs: 2, md: 4 }}>
        <Container maxWidth="lg">
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '2fr 1fr' }} gap={6}>
            {/* Left column */}
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Customer Info */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                    Customer Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">{contact?.first_name} {contact?.last_name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{contact?.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{contact?.phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        House sq ft
                      </Typography>
                      <Typography variant="body1">{house_sqft} sq ft</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">{address?.name} — {address?.street_address}, {address?.city}, {address?.state}, {address?.postal_code}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Enhanced Scheduling Section */}
              {!quote_schedule?.is_submitted ? (
                <Card
                  elevation={6}
                  sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  }}
                >
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #023c8f 0%, #0056d3 100%)',
                      color: 'white',
                      px: 4,
                      py: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderRadius: '12px 12px 0 0',
                    }}
                  >
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                      <Schedule />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Schedule Quote
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Choose your preferred date and time
                      </Typography>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ p: 4 }}>
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mb: 3,
                        bgcolor: '#e3f2fd',
                        border: '1px solid #1976d2',
                        borderRadius: 2,
                      }}
                    >
                      <AlertTitle sx={{ fontWeight: 600 }}>Ready to Schedule?</AlertTitle>
                      Select your preferred date and time to book this service with our team.
                    </Alert>

                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: '#023c8f' }}>
                        <CalendarToday sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                        Select Date & Time
                      </Typography>
                      
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                          label="Choose Date & Time"
                          value={selectedDate}
                          onChange={(newValue) => setSelectedDate(newValue)}
                          minDateTime={new Date()}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "medium",
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  bgcolor: 'white',
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#023c8f',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#023c8f',
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Box>

                    {selectedDate && (
                      <Alert 
                        severity="success" 
                        sx={{ 
                          mb: 3,
                          bgcolor: '#f1f8e9',
                          border: '1px solid #4caf50',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2">
                          <strong>Selected:</strong> {selectedDate.toLocaleDateString()} at {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Alert>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      sx={{
                        py: 2,
                        bgcolor: selectedDate ? '#42bd3f' : '#023c8f',
                        "&:hover": { 
                          bgcolor: selectedDate ? '#369932' : '#012a6b',
                          transform: 'translateY(-1px)',
                        },
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        boxShadow: selectedDate ? '0 4px 20px rgba(66, 189, 63, 0.3)' : '0 4px 20px rgba(2, 60, 143, 0.3)',
                      }}
                      onClick={handleSchedule}
                      disabled={!selectedDate}
                      startIcon={<AccessTime />}
                    >
                      {selectedDate ? 'Confirm Schedule' : 'Select Date to Schedule'}
                    </Button>

                    <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 2 }}>
                      Our team will confirm your appointment shortly after scheduling
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 3,
                    // border: '2px solid #42bd3f',
                    background: 'linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%)',
                  }}
                >
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #42bd3f 0%, #369932 100%)',
                      color: 'white',
                      px: 4,
                      py: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderRadius: '12px 12px 0 0',
                    }}
                  >
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                      <CheckCircle />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Scheduled
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Your service is confirmed
                      </Typography>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ p: 4 }}>
                    <Alert 
                      severity="success" 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.8)',
                        border: 'none',
                        borderRadius: 2,
                      }}
                    >
                      <AlertTitle sx={{ fontWeight: 600 }}>Service Scheduled!</AlertTitle>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Date & Time:</strong><br />
                        {new Date(quote_schedule?.scheduled_date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}<br />
                        <AccessTime sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                        {new Date(quote_schedule?.scheduled_date).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Alert>
                    
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
                      Our team will contact you before the scheduled date to confirm details
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Service Selections */}
              {service_selections?.map((selection) => (
                <Card key={selection.id}>
                  {/* Service Header */}
                  <Box
                    sx={{
                      px: 3,
                      py: 0.5,
                      backgroundColor: '#023c8f',
                      color: 'white',
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#012a6b" },
                    }}
                    onClick={() => toggleServiceExpansion(selection.id)}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" fontWeight={600} sx={{ color: 'white' }}>
                          {selection.service_details?.name}
                        </Typography>
                      </Box>
                      <IconButton sx={{ color: 'white' }}>
                        {expandedServices[selection.id] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Collapsible Content */}
                  <Collapse in={expandedServices[selection.id]} timeout="auto" unmountOnExit>
                    <Box sx={{ px: 3, py: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{mb:1}}>
                        {selection.service_details?.description}
                      </Typography>

                      {/* Selected Package Display */}
                      {selection.selected_package_details && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                            Selected Package
                          </Typography>
                          <Card
                            variant="outlined"
                            sx={{
                              border: "2px solid #42bd3f",
                              bgcolor: "#f8fff8",
                              borderRadius: 3,
                              minHeight: 220,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <CardContent sx={{ p: 4 }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight={700}>
                                  {selection.selected_package_details.name}
                                </Typography>
                                <Chip
                                  label="Selected"
                                  sx={{
                                    bgcolor: "#42bd3f",
                                    color: "white",
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>

                              <Typography variant="h4" sx={{ color: "#42bd3f", fontWeight: 700, mb: 2 }}>
                                ${formatPrice(selection.final_total_price)}
                              </Typography>

                              {/* Features List */}
                              <Box>
                                {selection.package_quotes?.[0] && (
                                  <>
                                    {[
                                      ...(selection.package_quotes[0].included_features_details || []).map((f) => ({
                                        ...f,
                                        included: true,
                                      })),
                                      ...(selection.package_quotes[0].excluded_features_details || []).map((f) => ({
                                        ...f,
                                        included: false,
                                      })),
                                    ].map((feature) => (
                                      <Box key={feature.id} display="flex" alignItems="center" mb={0.8}>
                                        {feature.included ? (
                                          <Check sx={{ fontSize: 18, color: "#42bd3f", mr: 1 }} />
                                        ) : (
                                          <Close sx={{ fontSize: 18, color: "#9e9e9e", mr: 1 }} />
                                        )}
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: feature.included ? "text.primary" : "text.disabled",
                                            fontWeight: feature.included ? 500 : 400,
                                          }}
                                        >
                                          {feature.name}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      )}

                      {/* Question Responses */}
                      {selection.question_responses?.length > 0 && (
                        <Box mt={4}>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#023c8f' }} gutterBottom>
                            Question Responses
                          </Typography>
                          <Grid container spacing={2}>
                            {selection.question_responses.map((response) => (
                              <Grid item xs={12} sm={6} key={response.id}>
                                <Box p={2} sx={{ bgcolor: "#d9edf7", borderRadius: 1, border: "1px solid #023c8f" }}>
                                  <Typography variant="body2" fontWeight={600} gutterBottom sx={{ color: '#023c8f' }}>
                                    {response.question_text}
                                  </Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {renderQuestionResponse(response)}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Card>
              ))}

              {/* Custom Products/Services */}
              {custom_products && custom_products.length > 0 && (
                <Card>
                  <Box sx={{ p: 3, py: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#023c8f" }}>
                        <Add />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#023c8f' }}>
                          Custom Services
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {custom_products.length} custom service{custom_products.length > 1 ? 's' : ''} added
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Divider />
                  <Box sx={{ overflow: 'hidden' }}>
                    {custom_products.map((product, index) => (
                      <Box
                        key={product.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 3,
                          borderBottom: index < custom_products.length - 1 ? '1px solid #f0f0f0' : 'none',
                          '&:hover': {
                            bgcolor: '#f8f9fa',
                          },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight={600}
                            sx={{ color: '#023c8f', mb: 0.5 }}
                          >
                            {product.product_name}
                          </Typography>
                          {product.description && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {product.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight={700}
                            sx={{ color: '#42bd3f' }}
                          >
                            ${formatPrice(product.price)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Card>
              )}

              {/* Additional Information */}
              {additional_data && (additional_data?.signature || additional_data?.additional_notes) && (
                <Card>
                  <Box sx={{ p: 3, py: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#023c8f" }}>
                        <Info />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#023c8f' }}>
                        Additional Information
                      </Typography>
                    </Stack>
                  </Box>
                  <Divider />
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
                            <Typography variant="body2">
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
                    background: '#023c8f',
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
                        ${formatPrice(total_base_price || 0)}
                      </Typography>
                    </Box>
                    
                    {/* Custom Services Price */}
                    {custom_service_total && parseFloat(custom_service_total) > 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2">Custom Services</Typography>
                        <Typography variant="subtitle2">
                          ${formatPrice(custom_service_total)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2">Adjustments</Typography>
                      <Typography variant="subtitle2">
                        ${formatPrice(total_adjustments || 0)}
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
                      <div className='flex flex-col'>
                        <Typography variant="h5" fontWeight="500" color="#42bd3f">
                          ${formatPrice(final_total * 1.0825 || 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" align="center">
                          Plus Tax
                        </Typography>
                      </div>
                    </Box>
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
        </Container>
      </Box>
    </Box>
  );
};

export default QuoteDetailsPage;