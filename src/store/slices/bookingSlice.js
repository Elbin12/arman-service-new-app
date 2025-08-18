import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  submission_id: null,
  userInfo: {
    firstName: "",
    phone: "",
    email: "",
    address: "",
    latitude: "",
    longitude: "",
    googlePlaceId: "",
    contactId: null,
    selectedLocation: null,
    selectedHouseSize: null
  },
  selectedServices: [],
  selectedService: null,
  selectedPackage: null,
  questionAnswers: {},
  pricing: {
    basePrice: 0,
    tripSurcharge: 0,
    questionAdjustments: 0,
    totalPrice: 0,
  },
  quoteDetails: null,
  selectedPackages: [],
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setBookingData(state, action) {
      return { ...state, ...action.payload };
    },
    resetBookingData() {
      return initialState;
    }
  },
});

export const { setBookingData, resetBookingData } = bookingSlice.actions;

export default bookingSlice.reducer;