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
    enabled: !!id && id > 0, // Only run query if ID is valid
    retry: 1, // Limit retries to avoid excessive API calls
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to reduce API calls
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
      // Log what we're sending for debugging
      console.log("Submitting incident report:", report);
      
      // Make sure teacherId is a number
      const processedReport = {
        ...report,
        teacherId: Number(report.teacherId),
        // Make sure studentIds is an array of numbers
        studentIds: Array.isArray(report.studentIds) 
          ? report.studentIds.map(id => Number(id)) 
          : [Number(report.studentIds)],
        // Set default attachment URL if not provided
        attachmentUrl: report.attachmentUrl || ""
      };
      
      console.log("Processed report:", processedReport);
      
      const res = await apiRequest("POST", "/api/incident-reports", processedReport);
      const data = await res.json();
      console.log("Response data:", data);
      return data;
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
      console.error("Mutation error:", error);
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