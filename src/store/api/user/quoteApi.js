import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../../axios/axios';

export const quoteApi = createApi({
  reducerPath: 'quoteApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/quote/' }),
  tagTypes: ['quote'],
  endpoints: (builder) => ({
    getInitialData: builder.query({
        query: ()=>({url:'initial-data/'}),
        providesTags: ['quote'],
    }),
    getServiceQuestions: builder.query({
        query: (id)=>({url:`services/${id}/questions/`}),
        providesTags: ['quote'],
    }),
    createSubmission: builder.mutation({
      query: (contactData) => ({
        url: 'create-submission/',
        method: 'POST',
        data: contactData,
      }),
      invalidatesTags: ['Submission'],
    }), 
    updateSubmission: builder.mutation({
      query: ({ id, ...contactData }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: contactData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Submission', id }],
    }),
    createQuestionResponses: builder.mutation({
      query: ({submissionId, serviceId, payload}) => ({
        url: `${submissionId}/services/${serviceId}/responses/`,
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Quote', 'Submission'],
    }),
    createServiceToSubmission: builder.mutation({
      query: ({submissionId, payload}) => ({
        url: `${submissionId}/add-services/`,
        method: 'POST',
        data: payload,
      }),
    }),
    getQuoteDetails: builder.query({
        query: (id)=>({url:`${id}/`}),
        providesTags: ['quote', 'Details'],
    }),
    submitQuote: builder.mutation({
      query: ({ submissionId, payload }) => ({
        url: `${submissionId}/submit/`,
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Quote', 'Submission'],
    }),
  }),
});

export const { useGetInitialDataQuery, useGetServiceQuestionsQuery, useCreateSubmissionMutation, useUpdateSubmissionMutation, useCreateQuestionResponsesMutation,
  useCreateServiceToSubmissionMutation,   useGetQuoteDetailsQuery,useSubmitQuoteMutation
 } = quoteApi;
