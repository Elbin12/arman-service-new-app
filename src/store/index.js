import { configureStore } from '@reduxjs/toolkit';
import { servicesApi } from './api/servicesApi';
import { locationsApi } from './api/locationsApi';
import { bookingApi } from './api/bookingApi';
import { packagesApi } from './api/packagesApi';
import { featuresApi } from './api/featuresApi';
import { questionsApi } from './api/questionsApi';
import { packageFeaturesApi } from './api/packageFeaturesApi';
import { questionOptionsApi } from './api/questionOptionsApi';
import servicesSlice from './slices/servicesSlice';
import locationsSlice from './slices/locationsSlice';
import authSlice from './slices/authSlice';
import { createOptionPricingApi } from './api/optionPricing';
import { contactsApi } from './api/user/contactsApi';
import { userServicesApi } from './api/user/userServicesApi';
import { priceApi } from './api/user/priceApi';
import { quotesApi } from './api/user/quotesApi';
import { houseSizesApi } from './api/houseSizesApi';
import { questionSubQuestionsApi } from './api/questionSubQuestionsApi';
import { quoteApi } from './api/user/quoteApi';
import persistReducer from 'redux-persist/lib/persistReducer';
import storage from 'redux-persist/lib/storage';
import persistStore from 'redux-persist/lib/persistStore';

import bookingReducer from './slices/bookingSlice';

const persistConfig = {
  key: 'booking',
  storage,
  whitelist: ['booking'] // persist only booking slice
};

const persistedBookingReducer = persistReducer(persistConfig, bookingReducer);

export const store = configureStore({
  reducer: {
    booking: persistedBookingReducer,
    services: servicesSlice,
    locations: locationsSlice,

    auth: authSlice,
    [servicesApi.reducerPath]: servicesApi.reducer,
    [locationsApi.reducerPath]: locationsApi.reducer,
    [bookingApi.reducerPath]: bookingApi.reducer,
    [packagesApi.reducerPath]: packagesApi.reducer,
    [featuresApi.reducerPath]: featuresApi.reducer,
    [questionsApi.reducerPath]: questionsApi.reducer,
    [packageFeaturesApi.reducerPath]: packageFeaturesApi.reducer,
    [questionOptionsApi.reducerPath]: questionOptionsApi.reducer,
    [createOptionPricingApi.reducerPath]: createOptionPricingApi.reducer,
    [contactsApi.reducerPath]: contactsApi.reducer,
    [userServicesApi.reducerPath]: userServicesApi.reducer,
    [priceApi.reducerPath]: priceApi.reducer,
    [quotesApi.reducerPath]: quotesApi.reducer,
    [houseSizesApi.reducerPath]: houseSizesApi.reducer,
    [questionSubQuestionsApi.reducerPath]: questionOptionsApi.reducer,
    [quoteApi.reducerPath]: quoteApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
      },
    })
      .concat(servicesApi.middleware)
      .concat(locationsApi.middleware)
      .concat(bookingApi.middleware)
      .concat(packagesApi.middleware)
      .concat(featuresApi.middleware)
      .concat(questionsApi.middleware)
      .concat(packageFeaturesApi.middleware)
      .concat(questionOptionsApi.middleware)
      .concat(createOptionPricingApi.middleware)
      .concat(contactsApi.middleware)
      .concat(userServicesApi.middleware)
      .concat(priceApi.middleware)
      .concat(quotesApi.middleware)
      .concat(houseSizesApi.middleware)
      .concat(questionSubQuestionsApi.middleware)
      .concat(quoteApi.middleware)
});

export const persistor = persistStore(store);

export default store;