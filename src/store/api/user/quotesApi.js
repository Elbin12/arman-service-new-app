import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../../axios/axios';

export const quotesApi = createApi({
  reducerPath: 'quotesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/user/' }),
  endpoints: (builder) => ({
    createQuote: builder.mutation({
      query: (payload) => ({
        url: 'quotes/',
        method: 'POST',
        data: payload,
      }),
    }),
    // optionally fetch quote by id if backend supports it:
    getQuoteById: builder.query({
      query: (id) => ({url:`quotes/${id}/`}),
    }),
  }),
});

export const { useCreateQuoteMutation, useGetQuoteByIdQuery } = quotesApi;
