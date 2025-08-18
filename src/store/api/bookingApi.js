import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/bookings/'}),
  tagTypes: ['Booking'],
  endpoints: (builder) => ({
    getBookings: builder.query({
      query: () => '',
      providesTags: ['Booking'],
    }),
    getBookingById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Booking', id }],
    }),
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '',
        method: 'POST',
        data: bookingData,
      }),
      invalidatesTags: ['Booking'],
    }),
    updateBooking: builder.mutation({
      query: ({ id, ...bookingData }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: bookingData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Booking', id }],
    }),
    deleteBooking: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Booking'],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
} = bookingApi;