import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from './client';
import { authStore, UserProfile } from '../store/auth.store';

export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get<any>('/users/profile');
      // Backend now returns role as string, just normalize to uppercase
      const normalizedRole = typeof data.role === 'string' ? data.role.toUpperCase() : data.role;
      const profile: UserProfile = {
        ...data,
        role: normalizedRole as 'STUDENT' | 'PROFESSOR' | 'ADMIN'
      };
      authStore.setState((state) => ({ ...state, user: profile }));
      return profile;
    }
  });

export const useLessons = () =>
  useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data } = await api.get('/lessons');
      return data as any[];
    }
  });

export const useLeaderboard = () =>
  useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/leaderboard');
      return data as any[];
    }
  });

export const useMissions = () =>
  useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const { data } = await api.get('/missions');
      return data as any[];
    }
  });

export const useLogin = () =>
  useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post('/auth/login', payload);
      const profileResponse = await api.get<any>('/users/profile', {
        headers: { Authorization: `Bearer ${data.accessToken}` }
      });
      // Backend now returns role as string, just normalize to uppercase
      const roleString = profileResponse.data.role || profileResponse.data?.data?.role;
      const normalizedRole = typeof roleString === 'string' ? roleString.toUpperCase() : roleString;
      const profile: UserProfile = {
        ...(profileResponse.data || profileResponse.data?.data || profileResponse),
        role: normalizedRole as 'STUDENT' | 'PROFESSOR' | 'ADMIN'
      };
      console.log('Login - profile response:', profileResponse, 'profile:', profile, 'role:', normalizedRole);
      authStore
        .getState()
        .setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: profile });
      return profile;
    }
  });

export const useRegister = () =>
  useMutation({
    mutationFn: async (payload: { email: string; password: string; firstName: string; lastName: string }) => {
      const { data } = await api.post('/auth/register', payload);
      const profileResponse = await api.get<any>('/users/profile', {
        headers: { Authorization: `Bearer ${data.accessToken}` }
      });
      // Backend now returns role as string, just normalize to uppercase
      const roleString = profileResponse.data.role || profileResponse.data?.data?.role;
      const normalizedRole = typeof roleString === 'string' ? roleString.toUpperCase() : roleString;
      const profile: UserProfile = {
        ...(profileResponse.data || profileResponse.data?.data || profileResponse),
        role: normalizedRole as 'STUDENT' | 'PROFESSOR' | 'ADMIN'
      };
      authStore
        .getState()
        .setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: profile });
      return profile;
    }
  });

export const useForgotPassword = () =>
  useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await api.post('/auth/forgot-password', payload);
      return data;
    }
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: async (payload: { token: string; newPassword: string }) => {
      const { data } = await api.post('/auth/reset-password', payload);
      return data;
    }
  });

export const useFriends = () =>
  useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data } = await api.get('/friends');
      return data as any[];
    }
  });

export const useAddFriend = () =>
  useMutation({
    mutationFn: async (friendId: number) => {
      const { data } = await api.post(`/friends/${friendId}`);
      return data;
    }
  });



