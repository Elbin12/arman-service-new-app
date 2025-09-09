// src/store/api/servicesApi.js (or in your existing slice file)
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const globalPriceApi = createApi({
  reducerPath: 'globalPriceApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/' }),
  tagTypes: ['Service', 'GlobalBasePrice'],
  endpoints: (builder) => ({
    // === Global Base Price APIs ===
    getGlobalBasePrice: builder.query({
      query: () => ({
        url: 'global-base-price/',
        method: 'GET',
      }),
      providesTags: ['GlobalBasePrice'],
    }),
    createGlobalBasePrice: builder.mutation({
      query: (data) => ({
        url: 'global-base-price/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['GlobalBasePrice'],
    }),
    updateGlobalBasePrice: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `global-base-price/`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['GlobalBasePrice'],
    }),
  }),
});

export const {
  useGetGlobalBasePriceQuery,
  useCreateGlobalBasePriceMutation,
  useUpdateGlobalBasePriceMutation,
} = globalPriceApi;