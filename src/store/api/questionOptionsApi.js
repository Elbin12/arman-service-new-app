import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const questionOptionsApi = createApi({
  reducerPath: 'questionOptionsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/question-options/'}),
  tagTypes: ['QuestionOption'],
  endpoints: (builder) => ({
    getQuestionOptions: builder.query({
      query: () => '',
      providesTags: ['QuestionOption'],
    }),
    getQuestionOptionById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'QuestionOption', id }],
    }),
    createQuestionOption: builder.mutation({
      query: (questionOptionData) => ({
        url: '',
        method: 'POST',
        data: questionOptionData,
      }),
      invalidatesTags: ['QuestionOption'],
    }),
    updateQuestionOption: builder.mutation({
      query: ({ id, ...questionOptionData }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: questionOptionData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'QuestionOption', id }],
    }),
    deleteQuestionOption: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['QuestionOption'],
    }),
  }),
});

export const {
  useGetQuestionOptionsQuery,
  useGetQuestionOptionByIdQuery,
  useCreateQuestionOptionMutation,
  useUpdateQuestionOptionMutation,
  useDeleteQuestionOptionMutation,
} = questionOptionsApi;