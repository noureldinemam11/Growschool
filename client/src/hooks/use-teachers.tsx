import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { User } from "@shared/schema";

// Get all teachers
export function useTeachers(): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: ['/api/users/role/teacher'],
  });
}

// Get a specific teacher by ID
export function useTeacher(id: number): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: ['/api/users/role/teacher', id],
    enabled: !!id,
    select: (teachers: User[]) => teachers.find(teacher => teacher.id === id) as User,
  });
}