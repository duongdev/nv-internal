import type { AppType } from '@nv-internal/api';
import { getClerkInstance } from '@clerk/clerk-expo';
import { QueryClient } from '@tanstack/react-query';
import { hc } from 'hono/client';
import { tokenCache } from './token-cache';

export const clerk = getClerkInstance({
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  tokenCache,
});

export const getHonoClient = async () => {
  const token = await clerk.session?.getToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return hc<AppType>(process.env.EXPO_PUBLIC_API_URL!, {
    headers,
  });
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'online',
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
      staleTime: 1000 * 60 * 60 * 24, // 1 day
    },
  },
});
