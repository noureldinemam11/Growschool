import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { User, UserRole } from "@shared/schema";

// Get users by role (students, teachers, parents, admins)
export function useUsers(role: UserRole): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: ['/api/users/role', role],
    enabled: !!role,
  });
}

// Get a specific user by ID
export function useUser(id: number): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: ['/api/users', id],
    enabled: !!id,
  });
}

// Get students by house ID
export function useStudentsByHouse(houseId: number): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: ['/api/users/house', houseId],
    enabled: !!houseId,
  });
}

// Get students for a parent
export function useStudentsByParent(parentId: number): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: ['/api/users/parent', parentId],
    enabled: !!parentId,
  });
}