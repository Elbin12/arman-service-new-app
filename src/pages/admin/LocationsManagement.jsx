"use client"

import { useState, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ClickAwayListener,
} from "@mui/material"
import { Add, Edit, Delete, LocationOn } from "@mui/icons-material"

// Your existing imports
import {
  useGetLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  locationsApi,
} from "../../store/api/locationsApi"
import { setDialogOpen, setEditingLocation, setFormData, resetFormData } from "../../store/slices/locationsSlice"

// Custom Google Places Autocomplete Component
const PlacesAutocomplete = ({ value, onChange, error, helperText }) => {
  const [inputValue, setInputValue] = useState(value || "")
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const autocompleteService = useRef(null)
  const geocoder = useRef(null)
  const debounceTimer = useRef(null)

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleLoaded(true)
        autocompleteService.current = new window.google.maps.places.AutocompleteService()
        geocoder.current = new window.google.maps.Geocoder()
        return
      }

      try {
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_API_KEY}&libraries=places`
        script.async = true
        script.defer = true

        script.onload = () => {
          setIsGoogleLoaded(true)
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
          geocoder.current = new window.google.maps.Geocoder()
        }

        script.onerror = () => {
          console.error("Failed to load Google Maps API")
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("Error loading Google Maps API:", error)
      }
    }

    loadGoogleMaps()
  }, [])

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || "")
  }, [value])

  // Debounced search function
  const searchPlaces = (query) => {
    if (!query || !isGoogleLoaded || !autocompleteService.current) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    const request = {
      input: query,
      types: ["establishment", "geocode"],
    }

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setIsLoading(false)
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions.slice(0, 5)) // Limit to 5 suggestions
      } else {
        setSuggestions([])
      }
    })
  }

  // Handle input change with debouncing
  const handleInputChange = (event) => {
    const newValue = event.target.value
    setInputValue(newValue)
    setShowSuggestions(true)

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      searchPlaces(newValue)
    }, 300)
  }

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.description)
    setShowSuggestions(false)
    setSuggestions([])

    if (!geocoder.current) return

    // Get detailed place information
    geocoder.current.geocode({ placeId: suggestion.place_id }, (results, status) => {
      if (status === "OK" && results[0]) {
        const place = results[0]
        const location = place.geometry.location

        onChange({
          address: place.formatted_address,
          latitude: location.lat(),
          longitude: location.lng(),
          placeId: suggestion.place_id,
        })
      }
    })
  }

  // Handle click away
  const handleClickAway = () => {
    setShowSuggestions(false)
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: "relative" }}>
        <TextField
          fullWidth
          label="Address"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          error={error}
          helperText={
            helperText || (isGoogleLoaded ? "Start typing to search for places..." : "Loading Google Places...")
          }
          placeholder="Search for a location..."
          disabled={!isGoogleLoaded}
          InputProps={{
            endAdornment: isLoading && <CircularProgress size={20} />,
          }}
        />

        {showSuggestions && suggestions.length > 0 && (
          <Paper
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 1300,
              maxHeight: 200,
              overflow: "auto",
              mt: 1,
            }}
          >
            <List dense>
              {suggestions.map((suggestion, index) => (
                <ListItem
                  key={suggestion.place_id}
                  button
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.structured_formatting.main_text}
                    secondary={suggestion.structured_formatting.secondary_text}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  )
}

const LocationsManagement = () => {
  const dispatch = useDispatch()
  const { dialogOpen, editingLocation, formData } = useSelector((state) => state.locations)

  // RTK Query hooks
  const { data: locations = [], isLoading, error } = useGetLocationsQuery()
  const [createLocation] = useCreateLocationMutation()
  const [updateLocation] = useUpdateLocationMutation()
  const [deleteLocation] = useDeleteLocationMutation()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const handleOpenDialog = (location = null) => {
    if (location) {
      dispatch(setEditingLocation(location))
      dispatch(
        setFormData({
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          trip_surcharge: location.trip_surcharge.toString(),
        }),
      )
    } else {
      dispatch(setEditingLocation(null))
      dispatch(resetFormData())
    }
    dispatch(setDialogOpen(true))
  }

  const handleCloseDialog = () => {
    dispatch(setDialogOpen(false))
    dispatch(setEditingLocation(null))
    dispatch(resetFormData())
    setFormErrors({})
  }

  const handleSaveLocation = async () => {
    try {
      setFormErrors({})

      // Validate required fields
      if (!formData.name || !formData.address || !formData.trip_surcharge) {
        setFormErrors({
          name: !formData.name ? ["Location name is required"] : undefined,
          address: !formData.address ? ["Address is required"] : undefined,
          trip_surcharge: !formData.trip_surcharge ? ["Trip surcharge is required"] : undefined,
        })
        return
      }

      const locationData = {
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        trip_surcharge: Number.parseFloat(formData.trip_surcharge),
      }

      if (editingLocation) {
        const updatedLocation = await updateLocation({
          id: editingLocation.id,
          ...locationData,
        }).unwrap()

        dispatch(
          locationsApi.util.updateQueryData("getLocations", undefined, (draft) => {
            const index = draft.findIndex((loc) => loc.id === updatedLocation.id)
            if (index !== -1) {
              draft[index] = updatedLocation
            }
          }),
        )
      } else {
        await createLocation(locationData).unwrap()
      }

      handleCloseDialog()
    } catch (error) {
      if (error?.status === 400 && error?.data) {
        setFormErrors(error.data)
      } else {
        console.error("Failed to save location:", error)
      }
    }
  }

  const confirmDeleteLocation = async () => {
    if (!locationToDelete) return

    try {
      await deleteLocation(locationToDelete.id).unwrap()
      setDeleteDialogOpen(false)
      setLocationToDelete(null)
    } catch (error) {
      console.error("Failed to delete location:", error)
    }
  }

  const handleFormChange = (field, value) => {
    dispatch(setFormData({ [field]: value }))
  }

  const handlePlaceSelect = (placeData) => {
    dispatch(
      setFormData({
        ...formData,
        address: placeData.address,
        latitude: placeData.latitude,
        longitude: placeData.longitude,
      }),
    )
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">Error loading locations: {error.message || "Unknown error"}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Locations Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage service locations and trip surcharges
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Location
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Location Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Coordinates</TableCell>
                  <TableCell>Trip Surcharge</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          {location.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {location.address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {typeof location?.latitude === "number" ? location?.latitude.toFixed(4) : location?.latitude},{" "}
                        {typeof location?.longitude === "number" ? location?.longitude.toFixed(4) : location?.longitude}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`$${
                          typeof location?.trip_surcharge === "number"
                            ? location?.trip_surcharge.toFixed(2)
                            : location?.trip_surcharge
                        }`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={location?.status || "active"}
                        size="small"
                        color={location?.status === "active" ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>{new Date(location?.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(location)}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setLocationToDelete(location)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{locationToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteLocation} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Location Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Location Name"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name?.[0]}
            />

            <PlacesAutocomplete
              value={formData.address}
              onChange={handlePlaceSelect}
              error={Boolean(formErrors.address)}
              helperText={formErrors.address?.[0]}
            />

            <TextField
              fullWidth
              label="Trip Surcharge ($)"
              type="number"
              value={formData.trip_surcharge}
              onChange={(e) => handleFormChange("trip_surcharge", e.target.value)}
              inputProps={{ step: "0.01", min: 0 }}
              error={Boolean(formErrors.trip_surcharge)}
              helperText={formErrors.trip_surcharge?.[0]}
            />

            {/* Display selected coordinates (read-only) */}
            {formData.latitude && formData.longitude && (
              <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected Coordinates:
                </Typography>
                <Typography variant="body2">
                  Lat: {Number(formData.latitude).toFixed(6)}, Lng: {Number(formData.longitude).toFixed(6)}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveLocation} variant="contained">
            {editingLocation ? "Update" : "Add"} Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LocationsManagement
