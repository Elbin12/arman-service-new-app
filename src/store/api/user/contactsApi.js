import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../../axios/axios';

export const contactsApi = createApi({
  reducerPath: 'contactsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/user/contacts/' }),
  tagTypes: ['Contact'],
  endpoints: (builder) => ({
    createContact: builder.mutation({
      query: (contactData) => ({
        url: '',
        method: 'POST',
        data: contactData,
      }),
      invalidatesTags: ['Contact'],
    }),
    updateContact: builder.mutation({
      query: ({ id, ...contactData }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: contactData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Contact', id }],
    }),
    getContactById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Contact', id }],
    }),
  }),
});

export const {
  useCreateContactMutation,
  useUpdateContactMutation,
  useGetContactByIdQuery,
} = contactsApi;
