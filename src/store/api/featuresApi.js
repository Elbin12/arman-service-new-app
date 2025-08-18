import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const featuresApi = createApi({
  reducerPath: 'featuresApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/features/'}),
  tagTypes: ['Feature'],
  endpoints: (builder) => ({
    getFeatures: builder.query({
      query: () => '',
      providesTags: ['Feature'],
    }),
    getFeatureById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Feature', id }],
    }),
    createFeature: builder.mutation({
      query: (featureData) => ({
        url: '',
        method: 'POST',
        data: featureData,
      }),
      invalidatesTags: ['Feature'],
    }),
    updateFeature: builder.mutation({
      query: ({ id, ...featureData }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: featureData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Feature', id }],
    }),
    updateFeatureStatus: builder.mutation({
      query: ({ id, ...featureData }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: featureData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Feature', id }],
    }),
    deleteFeature: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Feature'],
    }),
  }),
});

export const {
  useGetFeaturesQuery,
  useGetFeatureByIdQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,
  useUpdateFeatureStatusMutation,
} = featuresApi;