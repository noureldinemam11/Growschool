import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { User } from "@shared/schema";

/**
 * Hook to fetch users by role
 */
export function useUsers(role: 'admin' | 'teacher' | 'student' | 'parent' | string): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: ['/api/users/role', role],
    // Only enable the query if role is provided and is not empty
    enabled: !!role && role.trim() !== '',
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