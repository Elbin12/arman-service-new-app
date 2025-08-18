import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const packagesApi = createApi({
  reducerPath: 'packagesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/packages/'}),
  tagTypes: ['Package'],
  endpoints: (builder) => ({
    getPackages: builder.query({
      query: () => '',
      providesTags: ['Package'],
    }),
    getPackageById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Package', id }],
    }),
    createPackage: builder.mutation({
      query: (packageData) => ({
        url: '',
        method: 'POST',
        data: packageData,
      }),
      invalidatesTags: ['Package'],
    }),
    updatePackage: builder.mutation({
      query: ({ id, ...packageData }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: packageData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Package', id }],
    }),
    deletePackage: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Package'],
    }),
  }),
});

export const {
  useGetPackagesQuery,
  useGetPackageByIdQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
} = packagesApi;