import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';


export const createOptionPricingApi = createApi({
  reducerPath: 'createOptionPricingApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/options/' }),
  tagTypes: ['OptionPricing'],
  endpoints: (builder) => ({
    createOptionPricing: builder.mutation({
      query: (bulkData) => ({
        url: 'bulk-pricing/',
        method: 'POST',
        data: bulkData,
      }),
      invalidatesTags: ['OptionPricing'],
    }),
  }),
});

export const { useCreateOptionPricingMutation } = createOptionPricingApi;
