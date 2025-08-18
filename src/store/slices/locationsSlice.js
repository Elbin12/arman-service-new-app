import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  locations: [],
  selectedLocation: null,
  dialogOpen: false,
  editingLocation: null,
  formData: {
    name: '',
    address: '',
    lat: '',
    lng: '',
    tripSurcharge: '',
  },
};

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    setLocations: (state, action) => {
      state.locations = action.payload;
    },
    setSelectedLocation: (state, action) => {
      state.selectedLocation = action.payload;
    },
    setDialogOpen: (state, action) => {
      state.dialogOpen = action.payload;
    },
    setEditingLocation: (state, action) => {
      state.editingLocation = action.payload;
    },
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    resetFormData: (state) => {
      state.formData = {
        name: '',
        address: '',
        lat: '',
        lng: '',
        tripSurcharge: '',
      };
    },
    addLocation: (state, action) => {
      state.locations.push(action.payload);
    },
    updateLocation: (state, action) => {
      const index = state.locations.findIndex(location => location.id === action.payload.id);
      if (index !== -1) {
        state.locations[index] = action.payload;
      }
    },
    removeLocation: (state, action) => {
      state.locations = state.locations.filter(location => location.id !== action.payload);
    },
  },
});

export const {
  setLocations,
  setSelectedLocation,
  setDialogOpen,
  setEditingLocation,
  setFormData,
  resetFormData,
  addLocation,
  updateLocation,
  removeLocation,
} = locationsSlice.actions;

export default locationsSlice.reducer;