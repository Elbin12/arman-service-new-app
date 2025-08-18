import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const locationsApi = createApi({
  reducerPath: 'locationsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/locations/'}),
  tagTypes: ['Location'],
  endpoints: (builder) => ({
    getLocations: builder.query({
      query: () => '',
      providesTags: ['Location'],
    }),
    getLocationById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Location', id }],
    }),
    createLocation: builder.mutation({
      query: (locationData) => ({
        url: '',
        method: 'POST',
        data: locationData,
      }),
      invalidatesTags: ['Location'],
    }),
    updateLocation: builder.mutation({
      query: ({ id, ...locationData }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: locationData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Location', id }],
    }),
    deleteLocation: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Location'],
    }),
  }),
});

export const {
  useGetLocationsQuery,
  useGetLocationByIdQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = locationsApi;