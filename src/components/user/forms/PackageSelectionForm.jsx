import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Radio,
  FormControlLabel,
  RadioGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, LocalOffer } from '@mui/icons-material';
import { useGetServiceByIdQuery } from '../../../store/api/user/userServicesApi';

export const PackageSelectionForm = ({ data, onUpdate }) => {
  if (!data.selectedService || !data.selectedService.id) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Choose Your Package
        </Typography>
        <Typography color="text.secondary">Please select a service first.</Typography>
      </Box>
    );
  }

  const {
    data: serviceDetail,
    isLoading,
    isError,
    error,
  } = useGetServiceByIdQuery(data.selectedService.id);

  useEffect(() => {
    if (serviceDetail) {
      onUpdate({
        selectedService: {
          ...data.selectedService,
          nickname: serviceDetail.name,
          description: serviceDetail.description,
          packages: (serviceDetail.packages || []).map((p) => ({
            id: p.id,
            name: p.name,
            basePrice: p.base_price,
            features: p.features || [],
          })),
          questions: data.selectedService.questions || [],
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceDetail]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <Typography color="error">Failed to load service details: {error?.message || 'Unknown error'}</Typography>
      </Box>
    );
  }

  const packages = data.selectedService?.packages || [];

  const handlePackageSelect = (packageItem) => {
    onUpdate({
      selectedPackage: packageItem,
      questionAnswers: {},
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Your Package
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Select a package for <strong>{data.selectedService.nickname}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Each package includes different features and pricing options.
      </Typography>

      <RadioGroup
        value={data.selectedPackage?.id || ''}
        onChange={(e) => {
          const packageItem = packages.find((p) => p.id === e.target.value);
          if (packageItem) handlePackageSelect(packageItem);
        }}
      >
        <Box sx={{ display: 'grid', gap: 3 }}>
          {packages.map((packageItem) => {
            const includedFeatures = (packageItem.features || [])
              .filter((f) => f.is_included)
              .map((f) => ({
                id: f.feature.id,
                name: f.feature.name,
                description: f.feature.description,
              }));

            return (
              <Card
                key={packageItem.id}
                sx={{
                  border: data.selectedPackage?.id === packageItem.id ? 2 : 1,
                  borderColor: data.selectedPackage?.id === packageItem.id ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    background: data.selectedPackage?.id === packageItem.id
                      ? 'linear-gradient(90deg,#059669,#10b981)'
                      : 'linear-gradient(90deg,#f0f5f9,#e2e8f0)',
                    color: data.selectedPackage?.id === packageItem.id ? 'white' : 'text.primary',
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LocalOffer fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {packageItem.name}
                  </Typography>
                  {/* <Chip
                    label={`$${packageItem.basePrice}`}
                    size="small"
                    sx={{ ml: 'auto', fontWeight: 'bold' }}
                  /> */}
                </Box>

                <CardActionArea onClick={() => handlePackageSelect(packageItem)}>
                  <CardContent>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <FormControlLabel
                        value={packageItem.id}
                        control={<Radio />}
                        label=""
                        sx={{ m: 0 }}
                      />

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Base price: ${packageItem.basePrice} (additional charges may apply based on your answers)
                        </Typography>

                        {includedFeatures.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Included Features:
                            </Typography>
                            <List dense sx={{ p: 0 }}>
                              {includedFeatures.map((feature) => (
                                <ListItem key={feature.id} sx={{ px: 0, py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle color="success" sx={{ fontSize: 20 }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={feature.name}
                                    secondary={feature.description}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
          {packages.length === 0 && (
            <Typography color="text.secondary">No packages available for this service.</Typography>
          )}
        </Box>
      </RadioGroup>
    </Box>
  );
};

export default PackageSelectionForm;
