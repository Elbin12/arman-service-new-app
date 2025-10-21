import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const servicesApi = createApi({
  reducerPath: 'servicesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/services/'}),
  tagTypes: ['Service'],
  endpoints: (builder) => ({
    getServices: builder.query({
      query: (page = 1) => ({
        url:'',
        params:{page:page},
      }),
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
        method: 'PATCH',
        data: serviceData,
      }),
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled, getState }) {
        // Get all cached queries for getServices
        const state = getState();
        const patches = [];
        
        // Update all pages in cache
        Object.keys(state.servicesApi.queries).forEach((key) => {
          if (key.startsWith('getServices')) {
            // Extract page number from the cache key
            const match = key.match(/getServices\((\d+)\)/);
            const page = match ? parseInt(match[1]) : 1;
            
            const patchResult = dispatch(
              servicesApi.util.updateQueryData('getServices', page, (draft) => {
                const service = draft.results?.find((s) => s.id === id);
                if (service) {
                  Object.assign(service, patch);
                }
              })
            );
            patches.push(patchResult);
          }
        });
        
        try {
          await queryFulfilled;
        } catch {
          // Revert all optimistic updates on error
          patches.forEach((patchResult) => patchResult.undo());
        }
      },
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