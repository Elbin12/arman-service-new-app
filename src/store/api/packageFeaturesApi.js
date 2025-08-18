import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const packageFeaturesApi = createApi({
  reducerPath: 'packageFeaturesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/package-features/'}),
  tagTypes: ['PackageFeature'],
  endpoints: (builder) => ({
    getPackageFeatures: builder.query({
      query: () => '',
      providesTags: ['PackageFeature'],
    }),
    getPackageFeatureById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'PackageFeature', id }],
    }),
    createPackageFeature: builder.mutation({
      query: (packageFeatureData) => ({
        url: '',
        method: 'POST',
        data: packageFeatureData,
      }),
      invalidatesTags: ['PackageFeature'],
    }),
    updatePackageFeature: builder.mutation({
      query: ({ id, ...packageFeatureData }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: packageFeatureData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PackageFeature', id }],
    }),
    deletePackageFeature: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PackageFeature'],
    }),
  }),
});

export const {
  useGetPackageFeaturesQuery,
  useGetPackageFeatureByIdQuery,
  useCreatePackageFeatureMutation,
  useUpdatePackageFeatureMutation,
  useDeletePackageFeatureMutation,
} = packageFeaturesApi;