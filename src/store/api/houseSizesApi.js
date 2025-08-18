import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const houseSizesApi = createApi({
  reducerPath: 'houseSizesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/global-sizes/' }),
  tagTypes: ['HouseSize'],
  endpoints: (builder) => ({
    getHouseSizes: builder.query({
      query: () => '',
      providesTags: ['HouseSize'],
    }),
    createHouseSizes: builder.mutation({
      query: (sizes) => ({
        url: '',
        method: 'POST',
        data: sizes,
      }),
      invalidatesTags: ['HouseSize'],
    }),
    updateHouseSizes: builder.mutation({
      query: ({id, sizes}) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: sizes,
      }),
      invalidatesTags: ['HouseSize'],
    }),
    deleteHouseSize: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['HouseSize'],
    }),
  }),
});

export const {
  useGetHouseSizesQuery,
  useCreateHouseSizesMutation,
  useDeleteHouseSizeMutation,
  useUpdateHouseSizesMutation
} = houseSizesApi;
