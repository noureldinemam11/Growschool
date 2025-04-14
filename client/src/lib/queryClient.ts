import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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

// Create a global event bus for real-time updates
export const globalEventBus = {
  listeners: new Map<string, Set<() => void>>(),
  
  subscribe(event: string, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  },
  
  publish(event: string) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(callback => callback());
    }
    
    // Invalidate any related queries to ensure data refresh
    if (event === 'house-updated') {
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    } else if (event === 'pod-updated') {
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] });
      // Also invalidate any related class queries
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes-top-students'] });
    } else if (event === 'class-updated') {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] }); // Pods may need refresh due to class changes
      queryClient.invalidateQueries({ queryKey: ['/api/classes-top-students'] });
    } else if (event === 'points-updated') {
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] }); // Houses may need refresh due to point changes
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] }); // Pods may need refresh due to point changes
      queryClient.invalidateQueries({ queryKey: ['/api/classes/points'] }); // Update class points immediately
      queryClient.invalidateQueries({ queryKey: ['/api/classes-top-students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pods-top-students'] });
    }
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 1000, // Reduced to 1 second for more responsive updates
      refetchOnWindowFocus: true,
      staleTime: 0, // Set stale time to 0 to make data always refetch
      retry: 1,
    },
    mutations: {
      retry: 1,
      onSuccess: () => {
        // Force refresh all essential data whenever any mutation succeeds
        queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/behavior-points'] });
      },
    },
  },
});
