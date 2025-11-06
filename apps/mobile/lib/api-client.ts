import { getClerkInstance } from '@clerk/clerk-expo'
import type { AppType } from '@nv-internal/api'
import { QueryClient } from '@tanstack/react-query'
import { type ClientResponse, hc } from 'hono/client'
import { toast } from '@/components/ui/toasts'
import { getApiUrl, getClerkPublishableKey } from './env'
import { tokenCache } from './token-cache'

export const clerk = getClerkInstance({
  publishableKey: getClerkPublishableKey(),
  tokenCache,
})

// Token cache to avoid repeated getToken() calls
let cachedToken: string | null = null
let tokenCacheTime = 0
const TOKEN_CACHE_DURATION = 30000 // 30 seconds

// Logout flag to suppress error toasts during logout
let isLoggingOut = false

/**
 * Clear the in-memory token cache
 * This should be called during logout to ensure no token persists in memory
 */
export const clearTokenCache = () => {
  cachedToken = null
  tokenCacheTime = 0
}

/**
 * Set the logout flag to suppress error toasts during logout process
 */
export const setLoggingOut = (value: boolean) => {
  isLoggingOut = value
}

export const getHonoClient = async () => {
  const now = Date.now()

  // Use cached token if it's still valid (within 30 seconds)
  let token: string | null | undefined = cachedToken

  if (!token || now - tokenCacheTime > TOKEN_CACHE_DURATION) {
    // Token is stale or doesn't exist, fetch new one
    token = await clerk.session?.getToken()

    // Cache the new token
    if (token) {
      cachedToken = token
      tokenCacheTime = now
    }
  }

  const headers: Record<string, string> = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return hc<AppType>(getApiUrl(), {
    headers,
  })
}

type CallHonoApiResult<T, Throw extends boolean> = Throw extends true
  ? { data: T; error: null }
  : { data: T | null; error: string | null }

export async function callHonoApi<T, Throw extends boolean = true>(
  fn: (
    client: Awaited<ReturnType<typeof getHonoClient>>,
  ) => Promise<ClientResponse<T>>,
  options?: {
    /**
     * Sets to `false` to receive error message as string in the response object
     * @default true
     */
    throwOnError?: Throw
    /**
     * Sets to `true` to show a toast notification on error
     * @default false
     */
    toastOnError?: boolean | ((error: string) => string)
  },
): Promise<CallHonoApiResult<T, Throw>> {
  const { throwOnError = true as Throw, toastOnError = false } = options || {}
  const client = await getHonoClient()
  const response = await fn(client)

  if (!response.ok) {
    const error = await response.text()
    // Only show toast if not logging out and toastOnError is enabled
    if (toastOnError && !isLoggingOut) {
      const message =
        typeof toastOnError === 'function' ? toastOnError(error) : error
      toast.error(message, {
        providerKey: 'PERSIST',
      })
    }
    if (throwOnError) {
      throw new Error(error)
    }
    return { data: null, error } as CallHonoApiResult<T, Throw>
  }

  const data = await response.json()
  return { data, error: null } as CallHonoApiResult<T, Throw>
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'online',
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
      staleTime: 1000 * 60 * 60 * 24, // 1 day
    },
  },
})
