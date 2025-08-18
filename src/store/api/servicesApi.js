import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const servicesApi = createApi({
  reducerPath: 'servicesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/services/'}),
  tagTypes: ['Service'],
  endpoints: (builder) => ({
    getServices: builder.query({
      query: () => '',
      providesTags: ['Service'],
    }),
    getServiceById: builder.query({
      query: (id) => ({ url: `${id}/` }),
      providesTags: (result, error, id) => [{ type: 'Service', id }],
    }),
    createService: builder.mutation({
      query: (serviceData) => ({
        url: '',
        method: 'POST',
        data: serviceData,
      }),
      invalidatesTags: ['Service'],
    }),
    updateService: builder.mutation({
      query: ({ id, ...serviceData }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: serviceData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Service', id }],
    }),
    deleteService: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Service'],
    }),
    createServiceSettings: builder.mutation({
      query: ({ serviceId, ...settings }) => ({
        url: `${serviceId}/settings/`,
        method: 'POST',
        data: settings,
      }),
      invalidatesTags: ['Service'],
    }),
    updateServiceSettings: builder.mutation({
      query: ({ serviceId, ...settings }) => ({
        url: `${serviceId}/settings/`,
        method: 'PUT',
        data: settings,
      }),
      invalidatesTags: ['Service'],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useCreateServiceSettingsMutation,
  useUpdateServiceSettingsMutation
} = servicesApi;