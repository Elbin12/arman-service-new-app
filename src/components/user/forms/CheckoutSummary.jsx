import React, { useEffect, useState, useMemo } from 'react';
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
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Button,
  Radio,
  FormControlLabel,
  RadioGroup,
  FormControl,
  TextField,
  Checkbox,
} from '@mui/material';
import {
  Person,
  BusinessCenter,
  LocalOffer,
  QuestionAnswer,
  Receipt,
  LocationOn,
  ExpandMore,
  Check,
  Close,
} from '@mui/icons-material';
import { useCalculatePriceMutation } from '../../../store/api/user/priceApi';
import { useGetQuoteDetailsQuery } from '../../../store/api/user/quoteApi';
import { Info } from 'lucide-react';

export const CheckoutSummary = ({ data, onUpdate, termsAccepted, setTermsAccepted, additionalNotes, setAdditionalNotes }) => {
  const [selectedPackages, setSelectedPackages] = useState({});

  const {
    data: response,
    isLoading,
    isError,
    error
  } = useGetQuoteDetailsQuery(data.submission_id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const quote_details = response;

  // Memoize the quote data to prevent unnecessary re-renders
  const quoteData = useMemo(() => quote_details, [quote_details]);

  // Only update parent when quote details first load or when selected packages change
  useEffect(() => {
    if (quoteData && !isLoading && !data.quoteDetails) {
      onUpdate({
        quoteDetails: quoteData,
        pricing: {
          basePrice: parseFloat(quoteData.total_base_price || 0),
          totalAdjustments: parseFloat(quoteData.total_adjustments || 0),
          totalSurcharges: parseFloat(quoteData.total_surcharges || 0),
          finalTotal: parseFloat(quoteData.final_total || 0),
        },
      });
    }
  }, [quoteData, isLoading, data.quoteDetails, onUpdate]);

  // Handle package selection
  const handlePackageSelect = (serviceSelectionId, packageQuote) => {
    const newSelectedPackages = {
      ...selectedPackages,
      [serviceSelectionId]: packageQuote.id
    };
    
    setSelectedPackages(newSelectedPackages);

    // Update parent component with selected packages
    const selectedPackagesArray = Object.entries(newSelectedPackages).map(([serviceId, packageId]) => {
      // Find the service selection and package details
      const serviceSelection = quoteData?.service_selections.find(s => s.id === serviceId);
      const packageDetails = serviceSelection?.package_quotes.find(p => p.id === packageId);
      
      if (packageDetails && serviceSelection) {
        return {
          service_selection_id: serviceId,
          package_id: packageDetails.package,
          package_name: packageDetails.package_name,
          total_price: packageDetails.total_price
        };
      }
      return null;
    }).filter(Boolean);

    onUpdate({
      selectedPackages: selectedPackagesArray
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading quote details...
        </Typography>
      </Box>
    );
  }

  if (isError || !quoteData) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Review & Submit
        </Typography>
        <Typography color="error">
          Failed to load quote details. Please try again.
        </Typography>
      </Box>
    );
  }

  const formatPrice = (price) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const renderQuestionResponse = (response) => {
    switch (response.question_type) {
      case 'yes_no':
        return response.yes_no_answer ? 'Yes' : 'No';
      case 'conditional':
        return response.yes_no_answer ? 'Yes' : 'No';
      case 'multiple_yes_no':
        return response.sub_question_responses
          .filter(sub => sub.answer)
          .map(sub => sub.sub_question_text)
          .join(', ') || 'None selected';
      case 'quantity':
        return response.option_responses
          .map(opt => `${opt.option_text}: ${opt.quantity}`)
          .join(', ');
      case 'describe':
        return response.option_responses
          .map(opt => opt.option_text)
          .join(', ');
      default:
        return 'N/A';
    }
  };

  const renderPackageFeatures = (packageQuote) => {
    return (
      <Box>
        {packageQuote.included_features_details.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" color="success.main" gutterBottom>
              ✓ Included Features:
            </Typography>
            <List dense>
              {packageQuote.included_features_details.map((feature) => (
                <ListItem key={feature.id} sx={{ py: 0.5, pl: 2 }}>
                  <Check color="success" fontSize="small" sx={{ mr: 1 }} />
                  <ListItemText 
                    primary={feature.name}
                    secondary={feature.description}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {packageQuote.excluded_features_details.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="error.main" gutterBottom>
              ✗ Excluded Features:
            </Typography>
            <List dense>
              {packageQuote.excluded_features_details.map((feature) => (
                <ListItem key={feature.id} sx={{ py: 0.5, pl: 2 }}>
                  <Close color="error" fontSize="small" sx={{ mr: 1 }} />
                  <ListItemText 
                    primary={feature.name}
                    secondary={feature.description}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  // Calculate total price of selected packages
  const calculateTotalSelectedPrice = () => {
    let total = 0;
    Object.entries(selectedPackages).forEach(([serviceId, packageId]) => {
      const serviceSelection = quoteData?.service_selections.find(s => s.id === serviceId);
      const packageDetails = serviceSelection?.package_quotes.find(p => p.id === packageId);
      if (packageDetails) {
        total += parseFloat(packageDetails.total_price || 0);
      }
    });
    return total;
  };

  const totalSelectedPrice = calculateTotalSelectedPrice();
  const FinalTotal = formatPrice(totalSelectedPrice + (quoteData.quote_surcharge_applicable ? parseFloat(quoteData.location_details.trip_surcharge || 0): 0))

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Quote Summary
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Quote ID: {quoteData.id} | Status: {quoteData.status.replace('_', ' ').toUpperCase()}
      </Typography>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr' }} gap={3}>
        {/* Left Column - Details */}
        <Box>
          {/* Customer Information */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Person color="primary" />
                <Typography variant="h6">Customer Information</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Name</Typography>
                  <Typography variant="body2">{quoteData.customer_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body2">{quoteData.customer_email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography variant="body2">{quoteData.customer_phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Address</Typography>
                  <Typography variant="body2">{quoteData.customer_address}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">House Size</Typography>
                  <Typography variant="body2">{quoteData.house_sqft} sq ft</Typography>
                </Grid>
                {/* <Grid item xs={6}>
                  <Typography variant="subtitle2">Location</Typography>
                  <Typography variant="body2">{quoteData.location_details.name}</Typography>
                </Grid> */}
              </Grid>
            </CardContent>
          </Card>

          {/* Service Selections */}
          {quoteData.service_selections.map((selection, index) => (
            <Card key={selection.id} sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <BusinessCenter color="primary" />
                  <Typography variant="h6">
                    {selection.service_details.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {selection.service_details.description}
                </Typography>

                {/* Package Options */}
                <Typography variant="subtitle1" gutterBottom>
                  Select Package ({selection.service_details.packages_count} options):
                </Typography>
                
                <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
                  <RadioGroup
                    value={selectedPackages[selection.id] || ''}
                    onChange={(e) => {
                      const packageQuote = selection.package_quotes.find(p => p.id === e.target.value);
                      if (packageQuote) {
                        handlePackageSelect(selection.id, packageQuote);
                      }
                    }}
                  >
                    {selection.package_quotes.map((packageQuote) => (
                      <Box key={packageQuote.id} sx={{ mb: 2 }}>
                        <FormControlLabel
                          value={packageQuote.id}
                          control={<Radio />}
                          label={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" sx={{ minWidth: 400 }}>
                              <Box>
                                <Typography variant="subtitle2">
                                  {packageQuote.package_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Base: ${formatPrice(packageQuote.base_price)} | Adjustments: ${formatPrice(packageQuote.question_adjustments)}
                                </Typography>
                              </Box>
                              <Typography variant="h6" color="primary">
                                ${formatPrice(packageQuote.total_price)}
                              </Typography>
                            </Box>
                          }
                          sx={{ 
                            margin: 0,
                            width: '100%',
                            '& .MuiFormControlLabel-label': { width: '100%' }
                          }}
                        />
                        
                        {selectedPackages[selection.id] === packageQuote.id && (
                          <Accordion sx={{ mt: 1, ml: 4 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="body2">View Package Details</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box>
                                <Grid container spacing={2} mb={2}>
                                  <Grid item xs={6}>
                                    <Typography variant="body2">Base Price: ${formatPrice(packageQuote.base_price)}</Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2">Sq Ft Price: ${formatPrice(packageQuote.sqft_price)}</Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2">Question Adjustments: ${formatPrice(packageQuote.question_adjustments)}</Typography>
                                  </Grid>
                                  {/* <Grid item xs={6}>
                                    <Typography variant="body2">Surcharge: ${formatPrice(packageQuote.surcharge_amount)}</Typography>
                                  </Grid> */}
                                </Grid>
                                
                                {renderPackageFeatures(packageQuote)}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </Box>
                    ))}
                  </RadioGroup>
                </FormControl>

                {/* Question Responses */}
                {selection.question_responses.length > 0 && (
                  <Box mt={3}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <QuestionAnswer color="primary" />
                      <Typography variant="h6">Question Responses</Typography>
                    </Box>
                    <List dense>
                      {selection.question_responses.map((response) => (
                        <ListItem key={response.id}>
                          <ListItemText 
                            primary={response.question_text}
                            secondary={
                              <Box>
                                <Typography variant="body2" component="span">
                                  {renderQuestionResponse(response)}
                                </Typography>
                                {/* {parseFloat(response.price_adjustment) !== 0 && (
                                  <Chip 
                                    label={`${parseFloat(response.price_adjustment) > 0 ? '+' : ''}${formatPrice(response.price_adjustment)}`}
                                    size="small"
                                    color={parseFloat(response.price_adjustment) > 0 ? 'error' : 'success'}
                                    sx={{ ml: 1 }}
                                  />
                                )} */}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                {/* Disclaimers */}
                {(selection.service_details.service_settings?.general_disclaimer ||
                  selection.service_details.service_settings?.bid_in_person_disclaimer) && (
                  <Box mt={3} p={2} sx={{ backgroundColor: 'grey.100', borderRadius: 1 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Info color="#bdbdbd" />
                      <Typography variant="h6" className=''>Disclaimers</Typography>
                    </Box>
                    {selection.service_details.service_settings.general_disclaimer && (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        <strong>General:</strong> {selection.service_details.service_settings.general_disclaimer}
                      </Typography>
                    )}
                    {selection.service_details.service_settings.bid_in_person_disclaimer && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Bid In Person:</strong> {selection.service_details.service_settings.bid_in_person_disclaimer}
                      </Typography>
                    )}
                  </Box>
                )}

              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Right Column - Pricing Summary */}
        <Box>
          <Paper sx={{ p: 3, position: 'sticky', top: 20, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Receipt color="primary" />
              <Typography variant="h6">Pricing Summary</Typography>
            </Box>

            <Box mb={3}>
              {/* <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Selected Packages Total</Typography>
                <Typography color="primary" variant="h6">
                  ${formatPrice(totalSelectedPrice)}
                </Typography>
              </Box> */}

              {Object.keys(selectedPackages).length > 0 && (
                <Box sx={{ backgroundColor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2" mb={1}>Selected Packages:</Typography>
                  {Object.entries(selectedPackages).map(([serviceId, packageId]) => {
                    const serviceSelection = quoteData?.service_selections.find(s => s.id === serviceId);
                    const packageDetails = serviceSelection?.package_quotes.find(p => p.id === packageId);
                    if (packageDetails && serviceSelection) {
                      return (
                        <Box key={serviceId} display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2">
                            {serviceSelection.service_details.name} - {packageDetails.package_name}
                          </Typography>
                          <Typography variant="body2">
                            ${formatPrice(packageDetails.total_price)}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Box>
              )}
              <Box sx={{ backgroundColor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">
                      Trip Surcharge:
                    </Typography>
                    <Typography variant="body2">
                      {quoteData.quote_surcharge_applicable ? `${formatPrice(quoteData.location_details.trip_surcharge)}` : 0}
                    </Typography>
                  </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Final Total</Typography>
                <Typography variant="h6" color="primary">
                  ${FinalTotal}
                </Typography>
              </Box>

              {quoteData.location_details && (
                <Box mt={2}>
                  {/* <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <LocationOn color="action" />
                    <Typography variant="body2">
                      Service Location: {quoteData.location_details.name}
                    </Typography>
                  </Box> */}
                  {/* <Typography variant="body2" color="text.secondary">
                    Trip Surcharge: {quoteData.quote_surcharge_applicable ? `${formatPrice(quoteData.location_details.trip_surcharge)}` : 0}
                  </Typography> */}
                  <Typography variant="body2" color="text.secondary">
                    Address: {quoteData.customer_address}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Additional Notes */}
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Additional Notes
            </Typography>
            <TextField
              placeholder="Add any extra notes or requests..."
              multiline
              rows={3}
              fullWidth
              value={additionalNotes}
              onChange={(e) => {
                setAdditionalNotes(e.target.value);
                onUpdate({
                  additionalNotes: e.target.value,
                  termsAccepted
                });
              }}
            />
          </Box>

          {/* Terms & Conditions */}
          <Box mt={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    onUpdate({
                      additionalNotes,
                      termsAccepted: e.target.checked
                    });
                  }}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I have read and agree to the{' '}
                    Terms & Conditions
                  {/* <a href="/terms" target="_blank" rel="noopener noreferrer">
                  </a> */}
                </Typography>
              }
            />
          </Box>

          {/* Optional: Disable button until terms accepted */}
          {/* Example:
          <Button
            variant="contained"
            fullWidth
            disabled={!termsAccepted}
            sx={{ mt: 2 }}
          >
            Confirm & Book
          </Button> */}

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Created: {new Date(quoteData.created_at).toLocaleDateString()}
              </Typography>
              {/* <Typography variant="body2" color="text.secondary">
                Expires: {new Date(quoteData.expires_at).toLocaleDateString()}
              </Typography> */}
            </Box>

            {Object.keys(selectedPackages).length === 0 && (
              <Box sx={{ backgroundColor: 'warning.light', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="warning.dark">
                  Please select at least one package to proceed with booking.
                </Typography>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" align="center">
              Final price will be confirmed after service completion
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default CheckoutSummary;