'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { api } from '@/lib/api';

/**
 * Hook to fetch data with authentication.
 */
export function useFetch<T>(key: string, endpoint: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get<T>(endpoint, token || undefined);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch data');
      }
      return response.data;
    },
    enabled,
  });
}

/**
 * Hook to fetch paginated data.
 */
export function useFetchPaginated<T>(
  key: string,
  endpoint: string,
  params?: Record<string, string>
) {
  const { getToken } = useAuth();

  const queryString = params
    ? '?' + new URLSearchParams(params).toString()
    : '';

  return useQuery({
    queryKey: [key, params],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get<{ data: T[]; pagination: any }>(
        `${endpoint}${queryString}`,
        token || undefined
      );
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch data');
      }
      return response.data;
    },
  });
}

/**
 * Hook for mutations.
 */
export function useApiMutation<TData, TVariables>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  invalidateKey?: string
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const token = await getToken();
      let response;

      switch (method) {
        case 'POST':
          response = await api.post<TData>(endpoint, variables, token || undefined);
          break;
        case 'PUT':
          response = await api.put<TData>(endpoint, variables, token || undefined);
          break;
        case 'DELETE':
          response = await api.delete<TData>(endpoint, token || undefined);
          break;
      }

      if (!response || !response.success) {
        throw new Error(response?.error?.message || 'Operation failed');
      }

      return response.data;
    },
    onSuccess: () => {
      if (invalidateKey) {
        queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      }
    },
  });
}
