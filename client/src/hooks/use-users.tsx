import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { User } from "@shared/schema";

/**
 * Hook to fetch users by role
 */
export function useUsers(role: 'admin' | 'teacher' | 'student' | 'parent' | string): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: ['/api/users/role', role],
    enabled: !!role,
  });
}

/**
 * Hook to fetch a specific user by ID
 */
export function useUser(id: number): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: ['/api/users', id],
    enabled: !!id,
  });
}