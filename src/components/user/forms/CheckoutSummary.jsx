import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Grid,
  Button,
  Radio,
  FormControlLabel,
  RadioGroup,
  FormControl,
  TextField,
  Checkbox,
  Container,
  CircularProgress,
  Chip,
  Collapse,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import {
  Check,
  Close,
  ExpandMore,
  ExpandLess,
  Add,
  Remove,
  Edit,
  Delete,
  DeleteForever,
} from '@mui/icons-material';
import { useCalculatePriceMutation } from '../../../store/api/user/priceApi';
import { useCreateCustomProductMutation, useDeleteCustomProductMutation, useGetQuoteDetailsQuery, useUpdateCustomProductMutation, useDeleteServiceMutation, useGetGlobalPriceQuery } from '../../../store/api/user/quoteApi';
import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const calculateTotalSelectedPrice = (selectedPackages, quoteData) => {
    let total = 0;
    Object.entries(selectedPackages).forEach(([serviceId, packageId]) => {
      const serviceSelection = quoteData?.service_selections.find((s) => s.id === serviceId);
      const packageDetails = serviceSelection?.package_quotes.find((p) => p.id === packageId);
      if (packageDetails) {
        total += parseFloat(packageDetails.total_price || 0);
      }
    });
    return total;
  };

  const calculateCustomProductsTotal = (customProducts) => {
    return customProducts.reduce((total, product) => {
      return total + parseFloat(product.price || 0);
    }, 0);
  };

export const CheckoutSummary = ({ data, onUpdate, termsAccepted, setTermsAccepted, additionalNotes, setAdditionalNotes, handleSignatureEnd, setSignature, isStepComplete, handleNext, setActiveStep }) => {
  const [selectedPackages, setSelectedPackages] = useState({});
  const [expandedServices, setExpandedServices] = useState({});
  const [customProducts, setCustomProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteServiceDialogOpen, setDeleteServiceDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    description: '',
    price: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetQuoteDetailsQuery(data.submission_id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [createCustomProduct, { isLoading: isCreating }] = useCreateCustomProductMutation();
  const [updateCustomProduct] = useUpdateCustomProductMutation();
  const [deleteCustomProduct] = useDeleteCustomProductMutation();
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();

  const sigCanvasRef = useRef(null);

  const quoteData = useMemo(() => response, [response]);

  const [finalTotal, setFinalTotal] = useState();
  const { data: globalPriceData } = useGetGlobalPriceQuery();

  useEffect(() => {
    if (!quoteData) return;

    const totalSelectedPrice = calculateTotalSelectedPrice(selectedPackages, quoteData);
    const customProductsTotal = calculateCustomProductsTotal(customProducts);
    const surchargeAmount = quoteData.quote_surcharge_applicable
      ? parseFloat(quoteData.location_details?.trip_surcharge || 0)
      : 0;

    const total = totalSelectedPrice + customProductsTotal + surchargeAmount;
    const globalBase = parseFloat(globalPriceData?.base_price || 0);

    // ✅ Check if all services have a package selected
    const allPackagesSelected =
      quoteData?.service_selections?.length > 0 &&
      quoteData.service_selections.every(
        (s) => selectedPackages[s.id] !== undefined
      );

    if (allPackagesSelected) {
      // if ALL packages selected → enforce base price minimum
      setFinalTotal(formatPrice(Math.max(total, globalBase)));
    } else {
      // otherwise → use whatever total is (no base price enforcement)
      setFinalTotal(formatPrice(total));
    }
  }, [selectedPackages, customProducts, quoteData, globalPriceData]);

  const surchargeAmount = quoteData
    ? (quoteData.quote_surcharge_applicable
        ? parseFloat(quoteData.location_details?.trip_surcharge || 0)
        : 0)
    : 0;


  // Expand all services by default
  useEffect(() => {
    if (quoteData?.service_selections) {
      const initialExpanded = {};
      quoteData.service_selections.forEach((service) => {
        initialExpanded[service.id] = true;
      });
      setExpandedServices(initialExpanded);
    }
  }, [quoteData]);

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

  useEffect(() => {
    if (quoteData?.custom_products) {
      setCustomProducts(quoteData.custom_products);
    }
  }, [quoteData]);

  const toggleServiceExpansion = (serviceId) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  const handlePackageSelect = (serviceSelectionId, packageQuote) => {
    const newSelected = {
      ...selectedPackages,
      [serviceSelectionId]: packageQuote.id,
    };

    setSelectedPackages(newSelected);

    const selectedPackagesArray = Object.entries(newSelected)
      .map(([serviceId, packageId]) => {
        const serviceSelection = quoteData?.service_selections.find((s) => s.id === serviceId);
        const packageDetails = serviceSelection?.package_quotes.find((p) => p.id === packageId);
        if (packageDetails && serviceSelection) {
          return {
            service_selection_id: serviceId,
            package_id: packageDetails.package,
            package_name: packageDetails.package_name,
            total_price: packageDetails.total_price,
          };
        }
        return null;
      })
      .filter(Boolean);

    onUpdate({
      selectedPackages: selectedPackagesArray,
    });
  };

  const handleDeleteServiceClick = (service) => {
    setServiceToDelete(service);
    setDeleteServiceDialogOpen(true);
  };

  const handleDeleteServiceConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService({id:data.submission_id, serviceId:serviceToDelete.service}).unwrap();
      
      // Remove the service from selectedPackages if it was selected
      const newSelectedPackages = { ...selectedPackages };
      delete newSelectedPackages[serviceToDelete.id];
      // setSelectedPackages(newSelectedPackages);

      setSelectedPackages([]);
      
      // Update the parent component
      const selectedPackagesArray = Object.entries(newSelectedPackages)
        .map(([serviceId, packageId]) => {
          const serviceSelection = quoteData?.service_selections.find((s) => s.id === serviceId);
          const packageDetails = serviceSelection?.package_quotes.find((p) => p.id === packageId);
          if (packageDetails && serviceSelection) {
            return {
              service_selection_id: serviceId,
              package_id: packageDetails.package,
              package_name: packageDetails.package_name,
              total_price: packageDetails.total_price,
            };
          }
          return null;
        })
        .filter(Boolean);

      onUpdate({
        selectedPackages: selectedPackagesArray,
      });

      // Refetch quote details to get updated data
      refetch();
      
      setDeleteServiceDialogOpen(false);
      setServiceToDelete(null);
    } catch (err) {
      console.error("Failed to delete service", err);
    }
  };

  const handleAddOrUpdateCustomProduct = async () => {
    const productPayload = {
      purchase: data.submission_id,
      product_name: newProduct.product_name,
      description: newProduct.description,
      price: parseFloat(newProduct.price || 0),
    };

    try {
      if (editMode && currentProductId) {
        const updated = await updateCustomProduct({ id: currentProductId, ...productPayload }).unwrap();
        const updatedList = customProducts.map((p) => (p.id === currentProductId ? updated : p));
        setCustomProducts(updatedList);
        onUpdate({ selectedPackages, customProducts: updatedList });
      } else {
        const created = await createCustomProduct(productPayload).unwrap();
        const updatedList = [...customProducts, created];
        setCustomProducts(updatedList);
        onUpdate({ selectedPackages, customProducts: updatedList });
      }

      setDialogOpen(false);
      setEditMode(false);
      setCurrentProductId(null);
      setNewProduct({ product_name: '', description: '', price: '' });
    } catch (err) {
      console.error("Failed to save custom product", err);
    }
  };

  const handleDeleteCustomProduct = async (id) => {
    try {
      await deleteCustomProduct(id).unwrap();
      const updatedList = customProducts.filter((p) => p.id !== id);
      setCustomProducts(updatedList);
      onUpdate({ selectedPackages, customProducts: updatedList });
    } catch (err) {
      console.error("Failed to delete custom product", err);
    }
  };

  const openEditDialog = (product) => {
    setEditMode(true);
    setCurrentProductId(product.id);
    setNewProduct({
      product_name: product.product_name,
      description: product.description,
      price: product.price,
    });
    setDialogOpen(true);
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

  if (isError || !quoteData) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load quote details
        </Typography>
        <Typography color="text.secondary">Please refresh and try again.</Typography>
      </Box>
    );
  }

  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
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
    <Box>
      <Container maxWidth="lg">
        {/* Quote Header */}
        <Box mb={4}>
          <Box display="flex" justifyContent="center">
            <img
              src="https://storage.googleapis.com/msgsndr/b8qvo7VooP3JD3dIZU42/media/683efc8fd5817643ff8194f0.jpeg"
              alt="Company Logo"
              style={{
                maxHeight: "80px",
                maxWidth: "200px",
                objectFit: "contain",
              }}
            />
          </Box>
          <Typography variant="h4" gutterBottom fontWeight={300} sx={{ color: '#023c8f', textAlign: 'center' }}>
            Quote Summary
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" justifyContent="center">
            <Typography variant="body1" color="text.secondary">
              Quote #{quoteData.id}
            </Typography>
            <Chip
              label={quoteData.status.replace("_", " ").toUpperCase()}
              size="small"
              sx={{ bgcolor: "#d9edf7", color: "#023c8f", fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary">
              {new Date(quoteData.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {/* Customer Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{quoteData.contact?.first_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{quoteData.contact?.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">{quoteData.contact?.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  House sq ft
                </Typography>
                <Typography variant="body1">{quoteData.house_sqft} sq ft</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1">
                  {quoteData.address?.street_address}, {quoteData.address?.city}, {quoteData.address?.state}, {quoteData.address?.postal_code}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Service Selections */}
        {quoteData.service_selections.map((selection) => (
          <Card key={selection.id} sx={{ mb: 1.5 }}>
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
                    {selection.service_details.name}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconButton 
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteServiceClick(selection);
                    }}
                    title="Delete Service"
                  >
                    <DeleteForever />
                  </IconButton>
                  <IconButton sx={{ color: 'white' }}>
                    {expandedServices[selection.id] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
              </Box>
            </Box>

            {/* Collapsible Content */}
            <Collapse in={expandedServices[selection.id]} timeout="auto" unmountOnExit>
              <Box sx={{ px: 3, py: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {selection.service_details.description}
                </Typography>
                
                {/* Service Disclaimers */}
                {(selection.service_details.service_settings?.general_disclaimer || 
                  selection.service_details.service_settings?.bid_in_person_disclaimer) && (
                  <Box sx={{ mb: 2 }}>
                    {selection.service_details.service_settings?.general_disclaimer && (
                      <Box 
                        sx={{ 
                          backgroundColor: '#d9edf7',
                          padding: '12px 16px',
                          borderRadius: '6px',
                          mb: 1,
                          border: '1px solid #023c8f'
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#023c8f',
                            fontWeight: 500,
                            fontSize: '13px'
                          }}
                        >
                          <strong>General:</strong> {selection.service_details.service_settings.general_disclaimer}
                        </Typography>
                      </Box>
                    )}
                    
                    {selection.service_details.service_settings?.bid_in_person_disclaimer && (
                      <Box 
                        sx={{ 
                          backgroundColor: '#d9edf7',
                          padding: '12px 16px',
                          borderRadius: '6px',
                          mb: 1,
                          border: '1px solid #023c8f'
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#023c8f',
                            fontWeight: 500,
                            fontSize: '13px'
                          }}
                        >
                          <strong>Bid in Person:</strong> {selection.service_details.service_settings.bid_in_person_disclaimer}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Package Selection */}
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                  Select Package
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={selectedPackages[selection.id] || ""}
                    onChange={(e) => {
                      const packageQuote = selection.package_quotes.find((p) => p.id === e.target.value);
                      if (packageQuote) {
                        handlePackageSelect(selection.id, packageQuote);
                      }
                    }}
                  >
                    <Grid container spacing={3}>
                      {selection.package_quotes.map((packageQuote) => (
                        <Grid item xs={12} md={6} key={packageQuote.id}>
                          <Card
                            variant="outlined"
                            sx={{
                              cursor: "pointer",
                              border:
                                selectedPackages[selection.id] === packageQuote.id
                                  ? "2px solid #42bd3f"
                                  : "1px solid #e0e0e0",
                              bgcolor: selectedPackages[selection.id] === packageQuote.id ? "#f8fff8" : "white",
                              "&:hover": { borderColor: "#42bd3f" },
                              borderRadius: 3,
                              minHeight: 220,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                            onClick={() => handlePackageSelect(selection.id, packageQuote)}
                          >
                            <CardContent sx={{ p: 4 }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight={700}>
                                  {packageQuote.package_name}
                                </Typography>
                                <FormControlLabel
                                  value={packageQuote.id}
                                  control={
                                    <Radio
                                      sx={{
                                        color: "#42bd3f",
                                        "&.Mui-checked": { color: "#42bd3f" },
                                      }}
                                    />
                                  }
                                  label=""
                                  sx={{ m: 0 }}
                                />
                              </Box>

                              <Typography variant="h4" sx={{ color: "#42bd3f", fontWeight: 700, mb: 2 }}>
                                ${formatPrice(packageQuote.total_price)}
                              </Typography>

                              {/* Features List */}
                              <Box>
                                {[
                                  ...(packageQuote.included_features_details || []).map((f) => ({
                                    ...f,
                                    included: true,
                                  })),
                                  ...(packageQuote.excluded_features_details || []).map((f) => ({
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
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </RadioGroup>
                </FormControl>

                {/* Question Responses */}
                {selection.question_responses?.length > 0 && (
                  <Box mt={4}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#023c8f' }} gutterBottom>
                      Your Responses
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

        {/* Custom Products Section */}
        {customProducts.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                Custom Products
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Additional custom services added to your quote
              </Typography>
              <Grid container spacing={2}>
                {customProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        border: "1px solid #e0e0e0",
                        bgcolor: "white",
                        borderRadius: 2,
                        height: "100%",
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={2}>
                          <Typography variant="h6" fontWeight={600}>
                            {product.product_name}
                          </Typography>
                          <Box>
                            <IconButton size="small" onClick={() => openEditDialog(product)}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteCustomProduct(product.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {product.description}
                        </Typography>
                        <Typography variant="h6" sx={{ color: "#42bd3f", fontWeight: 700 }}>
                          ${formatPrice(product.price)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Add More Services Button */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              sx={{
                color: '#023c8f',
                borderColor: '#023c8f',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#023c8f',
                },
                fontWeight: 600,
                minWidth: "200px",
              }}
              onClick={() => setActiveStep(1)}
            >
              Add More Services
            </Button>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
              Additional Notes
            </Typography>
            <TextField
              placeholder="Any special requests or notes..."
              multiline
              rows={3}
              fullWidth
              value={additionalNotes}
              onChange={(e) => {
                setAdditionalNotes(e.target.value);
                onUpdate({ additionalNotes: e.target.value, termsAccepted });
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#023c8f',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#023c8f',
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
              Order Summary
            </Typography>

            {Object.keys(selectedPackages).length > 0 ? (
              <Box mb={2}>
                {Object.entries(selectedPackages).map(([serviceId, packageId]) => {
                  const serviceSelection = quoteData?.service_selections.find((s) => s.id === serviceId);
                  const pkg = serviceSelection?.package_quotes.find((p) => p.id === packageId);
                  if (pkg && serviceSelection) {
                    return (
                      <Box key={serviceId} mb={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {pkg.package_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {serviceSelection.service_details.name}
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight={600}>
                            ${formatPrice(pkg.total_price)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }
                  return null;
                })}
              </Box>
            ) : (
              <Box mb={2} p={2} sx={{ bgcolor: "#d9edf7", borderRadius: 1, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: '#023c8f' }}>
                  Please select a package above
                </Typography>
              </Box>
            )}

            {/* Custom Products in Summary */}
            {customProducts.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#023c8f', mb: 1 }}>
                  Custom Products
                </Typography>
                {customProducts.map((product) => (
                  <Box key={product.id} mb={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {product.product_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.description}
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={600}>
                        ${formatPrice(product.price)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {surchargeAmount > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Trip Surcharge</Typography>
                <Typography variant="body2">${formatPrice(surchargeAmount)}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Total
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">
                ${finalTotal}
              </Typography>
            </Box>

            {/* Signature Section */}
            <Box sx={{ mb: 3, maxWidth: { xs: '100%', sm: '400px' } }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#023c8f', fontWeight: 600 }}>
                Signature
              </Typography>
              <Box
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  width: '100%',
                  height: { xs: 160, sm: 120 },
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'crosshair',
                  '&:hover': {
                    borderColor: '#023c8f',
                  },
                }}
              >
                <Box sx={{ width: "100%", height: "100%" }}>
                  <SignatureCanvas
                    ref={sigCanvasRef}
                    penColor="black"
                    canvasProps={{
                      className: "w-full h-full",
                    }}
                    onEnd={() => {handleSignatureEnd(sigCanvasRef)}}
                  />
                </Box>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: '#023c8f',
                    borderColor: '#023c8f',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      borderColor: '#023c8f',
                    },
                  }}
                  onClick={() => {
                    sigCanvasRef.current.clear();
                    setSignature('');
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Box>

            <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      onUpdate({ additionalNotes, termsAccepted: e.target.checked });
                    }}
                    sx={{ 
                      color: '#e1e1e1', 
                      '&.Mui-checked': { color: '#023c8f' } 
                    }}
                  />
                }
                label={<Typography variant="body2">I agree to the Terms & Conditions</Typography>}
                sx={{ flex: 1 }}
              />

              <Button
                variant="contained"
                size="large"
                disabled={Object.keys(selectedPackages).length === 0 || !termsAccepted || !isStepComplete(3)}
                sx={{
                  bgcolor: "#42bd3f",
                  "&:hover": { bgcolor: "#369932" },
                  "&:disabled": { bgcolor: "#e0e0e0" },
                  fontWeight: 600,
                  minWidth: { xs: "100%", sm: "200px" },
                }}
                onClick={handleNext}
              >
                Accept Quote
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
              Final price confirmed after service completion
            </Typography>
          </CardContent>
        </Card>
      </Container>

      {/* Custom Product Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editMode ? 'Update' : 'Add'} Custom Product</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Product Name"
            fullWidth
            value={newProduct.product_name}
            onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddOrUpdateCustomProduct}>
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Service Confirmation Dialog */}
      <Dialog open={deleteServiceDialogOpen} onClose={() => setDeleteServiceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
          <DeleteForever sx={{ color: '#d32f2f' }} />
          Delete Service
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete the service "{serviceToDelete?.service_details?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone. The service and all its associated data will be permanently removed from your quote.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDeleteServiceDialogOpen(false)}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteServiceConfirm}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
            sx={{
              bgcolor: '#d32f2f',
              '&:hover': { bgcolor: '#b71c1c' },
              '&:disabled': { bgcolor: '#ffcdd2' }
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Service'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckoutSummary;