import { createContext, ReactNode, useContext, useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, UseQueryResult } from "@tanstack/react-query";
import { IncidentReport, InsertIncidentReport, User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/use-users";

interface IncidentReportContextType {
  reports: IncidentReport[];
  filteredReports: IncidentReport[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  students: User[];
  teachers: User[];
  // Filtering
  filters: {
    status: string | null;
    type: string | null;
    teacherId: number | null;
    studentId: number | null;
    dateRange: { from: Date | null; to: Date | null };
  };
  setStatusFilter: (status: string | null) => void;
  setTypeFilter: (type: string | null) => void;
  setTeacherFilter: (teacherId: number | null) => void;
  setStudentFilter: (studentId: number | null) => void;
  setDateRangeFilter: (from: Date | null, to: Date | null) => void;
  clearFilters: () => void;
  // Operations
  getReportById: (id: number) => IncidentReport | undefined;
  getTeacherName: (teacherId: number) => string;
  getStudentNames: (studentIds: number[]) => string;
  // Mutations
  createReport: (report: InsertIncidentReport) => Promise<IncidentReport>;
  updateReport: (id: number, report: Partial<IncidentReport>) => Promise<IncidentReport>;
  deleteReport: (id: number) => Promise<void>;
}

const IncidentReportContext = createContext<IncidentReportContextType | null>(null);

export function IncidentReportProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // State for filters
  const [filters, setFilters] = useState({
    status: null as string | null,
    type: null as string | null,
    teacherId: null as number | null,
    studentId: null as number | null,
    dateRange: { from: null as Date | null, to: null as Date | null }
  });

  // Fetch incident reports
  const { 
    data: reports = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery<IncidentReport[], Error>({
    queryKey: ['/api/incident-reports'],
  });

  // Fetch users for reference
  const studentsQuery = useUsers('student');
  const teachersQuery = useUsers('teacher');
  
  // Ensure we always have arrays even if the API returns null/undefined
  const students = studentsQuery.data || [];
  const teachers = teachersQuery.data || [];
  
  // Log any errors with fetching data
  useEffect(() => {
    if (studentsQuery.error) {
      console.error("Error loading student data:", studentsQuery.error);
    }
    if (teachersQuery.error) {
      console.error("Error loading teacher data:", teachersQuery.error);
    }
  }, [studentsQuery.error, teachersQuery.error]);

  // Filter reports based on current filters
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Status filter
      if (filters.status && report.status !== filters.status) {
        return false;
      }
      
      // Type filter
      if (filters.type && report.type !== filters.type) {
        return false;
      }
      
      // Teacher filter
      if (filters.teacherId && report.teacherId !== filters.teacherId) {
        return false;
      }
      
      // Student filter
      if (filters.studentId && !report.studentIds.includes(filters.studentId)) {
        return false;
      }
      
      // Date range filter
      const reportDate = new Date(report.incidentDate);
      if (filters.dateRange.from && reportDate < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to) {
        const endDate = new Date(filters.dateRange.to);
        endDate.setHours(23, 59, 59, 999); // End of the day
        if (reportDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [reports, filters]);

  // Filter setters
  const setStatusFilter = (status: string | null) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const setTypeFilter = (type: string | null) => {
    setFilters(prev => ({ ...prev, type }));
  };

  const setTeacherFilter = (teacherId: number | null) => {
    setFilters(prev => ({ ...prev, teacherId }));
  };

  const setStudentFilter = (studentId: number | null) => {
    setFilters(prev => ({ ...prev, studentId }));
  };

  const setDateRangeFilter = (from: Date | null, to: Date | null) => {
    setFilters(prev => ({ ...prev, dateRange: { from, to } }));
  };

  const clearFilters = () => {
    setFilters({
      status: null,
      type: null,
      teacherId: null,
      studentId: null,
      dateRange: { from: null, to: null }
    });
  };

  // Helper functions
  const getReportById = (id: number) => {
    return reports.find(report => report.id === id);
  };

  const getTeacherName = (teacherId: number) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : `Teacher ID: ${teacherId}`;
  };

  const getStudentNames = (studentIds: number[]) => {
    if (!studentIds || studentIds.length === 0) return "No students";
    
    const involvedStudents = students.filter(s => studentIds.includes(s.id));
    if (involvedStudents.length === 0) return `${studentIds.length} students`;
    
    if (involvedStudents.length === 1) {
      return `${involvedStudents[0].firstName} ${involvedStudents[0].lastName}`;
    }
    
    return `${involvedStudents[0].firstName} ${involvedStudents[0].lastName} +${involvedStudents.length - 1} more`;
  };

  // Mutations
  const createReportMutation = useMutation({
    mutationFn: async (report: InsertIncidentReport) => {
      const processed = {
        ...report,
        studentIds: Array.isArray(report.studentIds) 
          ? report.studentIds.map(id => Number(id))
          : [Number(report.studentIds)],
      };
      
      const res = await apiRequest("POST", "/api/incident-reports", processed);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incident-reports'] });
      toast({
        title: "Success",
        description: "Incident report has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create incident report",
        variant: "destructive",
      });
    }
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, report }: { id: number, report: Partial<IncidentReport> }) => {
      const res = await apiRequest("PATCH", `/api/incident-reports/${id}`, report);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incident-reports'] });
      toast({
        title: "Success",
        description: "Incident report has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update incident report",
        variant: "destructive",
      });
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/incident-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incident-reports'] });
      toast({
        title: "Success",
        description: "Incident report has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete incident report",
        variant: "destructive",
      });
    }
  });

  // Exposed mutation handlers
  const createReport = (report: InsertIncidentReport) => {
    return createReportMutation.mutateAsync(report);
  };

  const updateReport = (id: number, report: Partial<IncidentReport>) => {
    return updateReportMutation.mutateAsync({ id, report });
  };

  const deleteReport = (id: number) => {
    return deleteReportMutation.mutateAsync(id);
  };

  const value = {
    reports,
    filteredReports,
    isLoading,
    isError,
    error,
    students,
    teachers,
    filters,
    setStatusFilter,
    setTypeFilter,
    setTeacherFilter,
    setStudentFilter,
    setDateRangeFilter,
    clearFilters,
    getReportById,
    getTeacherName,
    getStudentNames,
    createReport,
    updateReport,
    deleteReport
  };

  return (
    <IncidentReportContext.Provider value={value}>
      {children}
    </IncidentReportContext.Provider>
  );
}

export function useIncidentReports() {
  const context = useContext(IncidentReportContext);
  if (!context) {
    throw new Error("useIncidentReports must be used within an IncidentReportProvider");
  }
  return context;
}