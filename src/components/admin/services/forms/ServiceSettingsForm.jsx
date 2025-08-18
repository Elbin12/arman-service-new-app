import React from 'react';
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';

const ServiceSettingsForm = ({ data, onUpdate }) => {
  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    // onUpdate({ [field]: value });
    onUpdate({settings:{...data.settings, [field]: value}});
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6">Final Details</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={data?.settings?.apply_area_minimum || false}
            onChange={handleChange('apply_area_minimum')}
          />
        }
        label="Apply Area Minimum"
      />
      {/* <FormControlLabel
        control={
          <Checkbox
            checked={data?.settings?.apply_house_size_minimum || false}
            onChange={handleChange('apply_house_size_minimum')}
          />
        }
        label="Apply House Size Minimum"
      /> */}
      <FormControlLabel
        control={
          <Checkbox
            checked={data?.settings?.apply_trip_charge_to_bid || false}
            onChange={handleChange('apply_trip_charge_to_bid')}
          />
        }
        label="Apply Trip Charge To Bid"
      />
      {/* <FormControlLabel
        control={
          <Checkbox
            checked={data?.settings?.enable_dollar_minimum || false}
            onChange={handleChange('enable_dollar_minimum')}
          />
        }
        label="Enable a Dollar Minimum"
      /> */}

      <TextField
        label="General Disclaimer"
        value={data?.settings?.general_disclaimer || ''}
        onChange={handleChange('general_disclaimer')}
        fullWidth
        multiline
        rows={2}
      />

      <TextField
        label="Bid in Person Disclaimer"
        value={data?.settings?.bid_in_person_disclaimer || ''}
        onChange={handleChange('bid_in_person_disclaimer')}
        fullWidth
        multiline
        rows={2}
      />
    </Box>
  );
};

export default ServiceSettingsForm;
