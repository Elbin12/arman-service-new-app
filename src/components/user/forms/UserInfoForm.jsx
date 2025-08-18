import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  ListItem,
  ListItemText,
  ClickAwayListener,
  List,
  MenuItem,
} from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import axios from 'axios';
import { useGetInitialDataQuery } from '../../../store/api/user/quoteApi';

// PlacesAutocomplete in plain JSX
const PlacesAutocomplete = ({ value, onSelect, error, helperText }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const autocompleteService = useRef(null);
  const geocoder = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
      setGoogleReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
      setGoogleReady(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const fetchPredictions = (query) => {
    if (!autocompleteService.current || !googleReady) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        types: ['geocode', 'establishment'],
      },
      (preds, status) => {
        setLoading(false);
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          preds &&
          preds.length
        ) {
          setSuggestions(preds.slice(0, 5));
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    setShowSuggestions(true);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      if (v.trim() === '') {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      fetchPredictions(v);
    }, 250);
  };

  const handleSelect = (prediction) => {
    setInputValue(prediction.description);
    setShowSuggestions(false);
    setSuggestions([]);

    if (!geocoder.current) return;
    geocoder.current.geocode(
      { placeId: prediction.place_id },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const place = results[0];
          const loc = place.geometry.location;
          onSelect({
            address: place.formatted_address,
            latitude: loc.lat(),
            longitude: loc.lng(),
            placeId: prediction.place_id,
          });
        }
      }
    );
  };

  const handleClickAway = () => {
    setShowSuggestions(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative' }}>
          {/* <TextField
            fullWidth
            label="Address"
            value={inputValue}
            onChange={handleChange}
            placeholder="Search for a location..."
            error={error}
            helperText={
              helperText ||
              (googleReady
                ? 'Start typing to search for places...'
                : 'Loading Google Places...')
            }
            disabled={!googleReady}
            InputProps={{
              endAdornment: loading && <CircularProgress size={20} />,
            }}
          /> */}

        {showSuggestions && suggestions.length > 0 && (
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1400,
              mt: 1,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {suggestions.map((s) => (
              <ListItem
                key={s.place_id}
                button
                onClick={() => handleSelect(s)}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <LocationOn color="primary" sx={{ mr: 1 }} />
                  <ListItemText
                    primary={s.structured_formatting.main_text}
                    secondary={s.structured_formatting.secondary_text}
                  />
                </Box>
              </ListItem>
            ))}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export const UserInfoForm = ({ data, onUpdate }) => {
  const [locations, setLocations] = useState([]);
  const [sizeRanges, setSizeRanges] = useState([]);

  const { data: initialData, isLoading, error } = useGetInitialDataQuery();

  useEffect(() => {
    if (initialData) {
      setLocations(initialData.locations);
      setSizeRanges(initialData.size_ranges);
    }
  }, [initialData]);

  const handleChange = (field) => (event) => {
    onUpdate({
      userInfo: {
        ...data.userInfo,
        [field]: event.target.value,
      },
    });
  };

  const handlePlaceSelect = (place) => {
    onUpdate({
      userInfo: {
        ...data.userInfo,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        googlePlaceId: place.placeId,
      },
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide your contact information to proceed with the booking.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <TextField
          label="First Name"
          variant="outlined"
          fullWidth
          value={data.userInfo?.firstName || ''}
          onChange={handleChange('firstName')}
          required
        />
        <TextField
          label="Phone Number"
          variant="outlined"
          fullWidth
          type="tel"
          value={data.userInfo?.phone || ''}
          onChange={handleChange('phone')}
          placeholder="(555) 123-4567"
          required
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]{10}', // 10 digits only
            maxLength: 10
          }}
          error={
            !data.userInfo?.phone ||
            !/^\d{10}$/.test(data.userInfo?.phone)
          }
          helperText={
            !data.userInfo?.phone
              ? 'Phone number is required'
              : !/^\d{10}$/.test(data.userInfo?.phone)
              ? 'Enter a valid 10-digit phone number'
              : ''
          }
        />

        <TextField
          label="Email Address"
          variant="outlined"
          fullWidth
          type="email"
          value={data.userInfo?.email || ''}
          onChange={handleChange('email')}
          placeholder="john@example.com"
          required
          error={
            !data.userInfo?.email ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userInfo?.email)
          }
          helperText={
            !data.userInfo?.email
              ? 'Email is required'
              : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userInfo?.email)
              ? 'Enter a valid email'
              : ''
          }
        />

        {/* <PlacesAutocomplete
          value={data.userInfo?.address || ''}
          onSelect={handlePlaceSelect}
          error={false}
          helperText="Start typing to search and select your address"
        /> */}
        <TextField
          select
          fullWidth
          label="Select Location"
          value={data.userInfo?.selectedLocation || ''}
          onChange={handleChange('selectedLocation')}
        >
          <MenuItem value="">Select Location</MenuItem>
          {locations.map(loc => (
            <MenuItem key={loc.id} value={loc.id}>
              {loc.name}
            </MenuItem>
          ))}
        </TextField>  

        <TextField
  fullWidth
  label="Select House Size"
  value={data.userInfo?.selectedHouseSize || ''}
  onChange={(e) => {
    const onlyNums = e.target.value.replace(/\D/g, ""); // remove non-digits
    handleChange('selectedHouseSize')({
      target: { value: onlyNums }
    });
  }}
/>
      </Box>
    </Box>
  );
};

export default UserInfoForm;
