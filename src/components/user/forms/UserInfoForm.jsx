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
    FormControlLabel,
    Checkbox,
  } from '@mui/material';
  import { LocationOn } from '@mui/icons-material';
  import axios from 'axios';
  import { useGetAddressesByContactQuery, useGetInitialDataQuery, useSearchContactsQuery } from '../../../store/api/user/quoteApi';
  import SearchableSelect from '../SearchableSelect';

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
    const contactId = data.userInfo?.contactId;

    const { data: addresses, isFetching: isFetchingAddresses } =
      useGetAddressesByContactQuery(contactId, { skip: !contactId });

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

    const handleContactSelect = (contact) => {
      onUpdate({
        userInfo: {
          ...data.userInfo,
          contactId: contact.id,
          contactName: contact.name,
          contactPhone: contact.phone,
          addressId: "",
        },
      });
    };

    const handleAddressSelect = (addressId) => {
      const selected = addresses?.find((a) => a.id === addressId);
      if (!selected) return;

      onUpdate({
        userInfo: {
          ...data.userInfo,
          addressId: selected.id,
          selectedHouseSize: selected?.property_sqft || ""
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

        {/* <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}> */}
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography variant="h6" gutterBottom>
            Select Contact & Address
          </Typography>

          <SearchableSelect
            label="Contacts"
            useSearchHook={useSearchContactsQuery}
            onSelect={handleContactSelect}
            value={data.userInfo?.contact?.first_name + data?.userInfo?.contact?.last_name}
          />

          {contactId && (
            <Box >
              {isFetchingAddresses ? (
                <CircularProgress size={24} />
              ) : (
                <TextField
                  select
                  fullWidth
                  label="Select Address"
                  value={data.userInfo?.addressId || ""}
                  onChange={(e) => handleAddressSelect(e.target.value)}
                >
                  {addresses?.map((addr) => (
                    <MenuItem key={addr.id} value={addr.id}>
                      {addr?.name} — {addr?.street_address}, {addr?.city}, {addr?.state}, {addr?.postal_code}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
          )}

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
          <FormControlLabel
            control={
              <Checkbox
                checked={data.userInfo?.first_time || false}
                onChange={(e) =>
                  onUpdate({
                    userInfo: {
                      ...data.userInfo,
                      first_time: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Is first time"
          />

          {/* ✅ New Select for "Quoted by" */}
          <TextField
            select
            fullWidth
            label="Quoted By"
            value={data.userInfo?.quoted_by || ""}
            onChange={(e) =>
              onUpdate({
                userInfo: {
                  ...data.userInfo,
                  quoted_by: e.target.value,
                },
              })
            }
          >
            {/* Static Users */}
            <MenuItem value="Anthony Valles">Anthony Valles</MenuItem>
            <MenuItem value="Arman Khalili">Arman Khalili</MenuItem>
            <MenuItem value="Elias Hoover">Elias Hoover</MenuItem>
            <MenuItem value="Harold Garcia">Harold Garcia</MenuItem>
            <MenuItem value="Jay Dugman">Jay Dugman</MenuItem>
            <MenuItem value="Jim Suazo">Jim Suazo</MenuItem>
            <MenuItem value="Josh Fulfer">Josh Fulfer</MenuItem>
            <MenuItem value="Juan Carlos Suazo">Juan Carlos Suazo</MenuItem>
            <MenuItem value="Mandy Castaneda">Mandy Castaneda</MenuItem>
            <MenuItem value="Reza Yousefian">Reza Yousefian</MenuItem>
            <MenuItem value="Roshan Raj">Roshan Raj</MenuItem>
            <MenuItem value="Serena Gallegos">Serena Gallegos</MenuItem>
          </TextField>
        </Box>
      </Box>
    );
  };

  export default UserInfoForm;
