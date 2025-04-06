import { 
  useQuery, 
  useMutation, 
  UseMutationResult, 
  UseQueryResult 
} from "@tanstack/react-query";
import { IncidentReport, InsertIncidentReport } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Get all incident reports accessible to the current user
export function useIncidentReports(): UseQueryResult<IncidentReport[], Error> {
  return useQuery({
    queryKey: ['/api/incident-reports'],
  });
}

// Get a specific incident report by ID
export function useIncidentReport(id: number): UseQueryResult<IncidentReport, Error> {
  return useQuery({
    queryKey: ['/api/incident-reports', id],
    enabled: !!id,
  });
}

// Get incident reports for a specific student
export function useStudentIncidentReports(studentId: number): UseQueryResult<IncidentReport[], Error> {
  return useQuery({
    queryKey: ['/api/incident-reports/student', studentId],
    enabled: !!studentId,
  });
}

// Create a new incident report
export function useCreateIncidentReport(): UseMutationResult<IncidentReport, Error, InsertIncidentReport> {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (report: InsertIncidentReport) => {
      const res = await apiRequest("POST", "/api/incident-reports", report);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate the incident reports query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/incident-reports'] });
      toast({
        title: "Incident report created",
        description: "The incident report has been successfully submitted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create incident report",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update an existing incident report
export function useUpdateIncidentReport(id: number): UseMutationResult<IncidentReport, Error, Partial<IncidentReport>> {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (report: Partial<IncidentReport>) => {
      const res = await apiRequest("PATCH", `/api/incident-reports/${id}`, report);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate the specific incident report query
      queryClient.invalidateQueries({ queryKey: ['/api/incident-reports', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/incident-reports'] });
      toast({
        title: "Incident report updated",
        description: "The incident report has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update incident report",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete an incident report
export function useDeleteIncidentReport(): UseMutationResult<{ success: boolean }, Error, number> {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/incident-reports/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all incident reports to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/incident-reports'] });
      toast({
        title: "Incident report deleted",
        description: "The incident report has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete incident report",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}