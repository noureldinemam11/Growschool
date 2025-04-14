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
interface EventBus {
  listeners: Map<string, Set<() => void>>;
  lastEventTime: Record<string, number>;
  subscribe(event: string, callback: () => void): () => void;
  unsubscribe(event: string, callback: () => void): void;
  publish(event: string): void;
}

export const globalEventBus: EventBus = {
  listeners: new Map<string, Set<() => void>>(),
  
  // Track last event time to prevent spamming
  lastEventTime: {} as Record<string, number>,
  
  subscribe(event: string, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    
    // Return the callback for consistency
    return callback;
  },
  
  unsubscribe(event: string, callback: () => void) {
    this.listeners.get(event)?.delete(callback);
    
    // If no more listeners for this event, clean up the set
    if (this.listeners.get(event)?.size === 0) {
      this.listeners.delete(event);
    }
  },
  
  // Function to conditionally publish events with throttling
  publish(event: string) {
    const now = Date.now();
    const lastTime = this.lastEventTime[event] || 0;
    
    // Throttle events to prevent performance issues (only process if > 1s since last event)
    if (now - lastTime < 1000) {
      return; // Skip this event if we just processed one like it
    }
    
    // Update last event time
    this.lastEventTime[event] = now;
    console.log(`Publishing event: ${event}`);
    
    // Notify event subscribers
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
    
    // Handle data updates selectively based on event type
    if (event === 'house-updated') {
      // Only refresh house data
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
      
    } else if (event === 'pod-updated') {
      // Only refresh pod data
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] });
      
    } else if (event === 'class-updated') {
      // Only refresh class data
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      
    } else if (event === 'points-updated') {
      // For points updates, only refresh the most critical data
      // Use setTimeout to stagger the updates and prevent UI jank
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/behavior-points/recent'] });
      }, 0);
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/behavior-points'] });
      }, 500);
      
      // Delay less critical updates further
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/classes-top-students'] });
        queryClient.invalidateQueries({ queryKey: ['/api/pods-top-students'] });
      }, 1000);
    }
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 5000, // Increased to 5 seconds to reduce server load
      refetchOnWindowFocus: true,
      staleTime: 2000, // Add 2 seconds stale time to reduce unnecessary fetches
      retry: 1,
    },
    mutations: {
      retry: 1,
      onSuccess: () => {
        // Only invalidate queries as needed, controlled by the event bus
      },
    },
  },
});
