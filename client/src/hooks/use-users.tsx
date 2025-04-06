import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { User, UserRole } from "@shared/schema";

/**
 * Hook to fetch users by role
 */
export function useUsers(role?: UserRole | 'all'): UseQueryResult<User[], Error> {
  const endpoint = role && role !== 'all' 
    ? `/api/users/role/${role}` 
    : '/api/users';
  
  return useQuery({
    queryKey: [endpoint],
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: number | null): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: [`/api/users/${id}`],
    enabled: id !== null,
  });
}