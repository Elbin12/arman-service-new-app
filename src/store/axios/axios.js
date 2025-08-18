import axios from 'axios';
import { logout } from '../slices/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://site.cleanonthego.com/api';

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// axiosBaseQuery.js
export const axiosBaseQuery =
  ({ baseUrl = '' } = {}) =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({
        url: baseUrl + (url || ''),
        method,
        data,
        params,
      });
      return { data: result.data };
    } catch (axiosError) {
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data || axiosError.message,
        },
      };
    }
  };


// Named export for BASE_URL
export { BASE_URL };


axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access');    

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop: skip if this is the refresh request itself
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh/')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/service/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access', newAccessToken);

        // const newRefreshToken = response.data.refresh;
        // localStorage.setItem('refresh', newRefreshToken);

        // Update the original request with new token and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        localStorage.removeItem('access');
        // store.dispatch(logout());
        // window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
