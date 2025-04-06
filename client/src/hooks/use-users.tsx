import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { User } from "@shared/schema";

/**
 * Hook to fetch users by role
 */
export function useUsers(role: 'admin' | 'teacher' | 'student' | 'parent' | 'all' | string | undefined): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: ['/api/users/role', role],
    enabled: !!role && role.trim() !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    select: (data) => data || []
  });
}

/**
 * Hook to fetch a specific user by ID
 */
export function useUser(id: number | undefined): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: ['/api/users', id],
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
}