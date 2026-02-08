import axios from 'axios';
import { authStore } from '../store/auth.store';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const state = authStore.getState();
  if (state.accessToken) {
    config.headers.Authorization = `Bearer ${state.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const state = authStore.getState();
    if (error.response?.status === 401 && state.refreshToken) {
      try {
        const refresh = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh');
        authStore.getState().setSession({
          accessToken: refresh.data.accessToken,
          refreshToken: refresh.data.refreshToken,
          user: state.user!
        });
        error.config.headers.Authorization = `Bearer ${refresh.data.accessToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        state.logout();
      }
    }
    return Promise.reject(error);
  }
);



















