import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string = "GET",
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

  try {
    const headers: Record<string, string> = {};
    if (data) {
      headers["Content-Type"] = "application/json";
    }

    // Add authentication token if available
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || 'test';
    headers["Authorization"] = `Bearer ${token}`;

    console.log(`Making ${method} request to:`, url);
    console.log('Headers:', headers);
    console.log('Body:', data ? JSON.stringify(data) : 'undefined');

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    
    const result = await res.json();
    console.log('Response body:', result);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Detailed fetch error:', error);
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timeout - server took too long to respond');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0, // Force fresh data for production
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
});
