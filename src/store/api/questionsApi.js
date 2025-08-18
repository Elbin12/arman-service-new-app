import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const questionsApi = createApi({
  reducerPath: 'questionsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/questions/'}),
  tagTypes: ['Question'],
  endpoints: (builder) => ({
    getQuestions: builder.query({
      query: () => '',
      providesTags: ['Question'],
    }),
    getQuestionById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),
    createQuestion: builder.mutation({
      query: (questionData) => ({
        url: '',
        method: 'POST',
        data: questionData,
      }),
      invalidatesTags: ['Question'],
    }),
    updateQuestion: builder.mutation({
      query: ({ id, ...questionData }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: questionData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Question', id }],
    }),
    updateQuestionStatus: builder.mutation({
      query: ({ id, ...questionData }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: questionData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Feature', id }],
    }),
    deleteQuestion: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Question'],
    }),
    createQuestionPricing: builder.mutation({
      query: (payload) => ({
        url: 'bulk-pricing/', 
        method: 'POST',
        data: payload,
      }),
    }),
  }),
});

export const {
  useGetQuestionsQuery,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useCreateQuestionPricingMutation,
  useUpdateQuestionStatusMutation
} = questionsApi;