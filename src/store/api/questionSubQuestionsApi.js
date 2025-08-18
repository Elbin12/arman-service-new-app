import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const questionSubQuestionsApi = createApi({
  reducerPath: 'questionSubQuestionsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/'}),
  tagTypes: ['Sub-Question'],
  endpoints: (builder) => ({
    createQuestionSubQuestion: builder.mutation({
      query: (data) => ({
        url: 'sub-questions/',
        method: 'POST',
        data: data,
      }),
      invalidatesTags: ['Sub-Question'],
    }),
    updateQuestionSubQuestion: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `sub-questions/${id}/`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sub-Question', id }],
    }),
    deleteQuestionSubQuestion: builder.mutation({
      query: (id) => ({
        url: `sub-questions/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sub-Question'],
    }),
    createSubQuestionPricing: builder.mutation({
        query: (data) => ({
          url: 'sub-questions/bulk-pricing/',
          method: 'POST',
          data: data,
        }),
        invalidatesTags: ['Sub-Question-Pricing'],
      }),
  }),
});

export const {
  useCreateQuestionSubQuestionMutation,
  useUpdateQuestionSubQuestionMutation,
  useDeleteQuestionSubQuestionMutation,
  useCreateSubQuestionPricingMutation
} = questionSubQuestionsApi;