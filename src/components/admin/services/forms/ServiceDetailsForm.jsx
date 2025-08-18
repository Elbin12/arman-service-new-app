import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
} from '@mui/material';

// ServiceDetailsFormProps: { data, onUpdate }

const ServiceDetailsForm = ({
  data,
  onUpdate,
  setSavedSteps
}) => {
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    setSavedSteps((prev) => ({ ...prev, 0: false }));
    const value = event.target.value;
    onUpdate({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 3) {
          return 'Service name must be at least 3 characters';
        }
        break;
      case 'description':
        if (!value || value.trim().length < 10) {
          return 'Description must be at least 10 characters';
        }
        break;
    }
    return '';
  };

  const handleBlur = (field) => (event) => {
    const error = validateField(field, event.target.value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Service Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the basic details for your new service.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Service Name"
          variant="outlined"
          fullWidth
          value={data?.name || ''}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          placeholder="e.g., Premium Cleaning Service"
          required
          error={!!errors.name}
          helperText={errors.name}
        />

        <TextField
          label="Description"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={data?.description || ''}
          onChange={handleChange('description')}
          onBlur={handleBlur('description')}
          placeholder="Describe what this service includes..."
          required
          error={!!errors.description}
          helperText={errors.description}
        />
      </Box>
    </Box>
  );
};

export default ServiceDetailsForm;