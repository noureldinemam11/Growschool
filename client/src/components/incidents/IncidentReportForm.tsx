import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage, 
  FormDescription 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown, Loader2, X, AlertCircle, Search, Layers, Users, GraduationCap } from "lucide-react";
import { SelectSeparator } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { IncidentReport, InsertIncidentReport, User, incidentTypes, actionTakenOptions } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useIncidentReports } from "@/hooks/incident-report-context";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface IncidentReportFormProps {
  report?: IncidentReport;
  onSuccess?: () => void;
}

export default function IncidentReportForm({ report, onSuccess }: IncidentReportFormProps) {
  const { user } = useAuth();
  const { createReport, updateReport } = useIncidentReports();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(
    report?.studentIds || []
  );
  const [studentsPopoverOpen, setStudentsPopoverOpen] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  
  // Get unique classes from students for the filter dropdown
  const classMap = useMemo(() => {
    // First get all unique class IDs
    const uniqueClassIds = new Set<number>();
    students.forEach(student => {
      if (student.classId) {
        uniqueClassIds.add(student.classId);
      }
    });
    
    // Create a map of class ids to class names from the API response
    const classData = [
      { id: 1, name: "9M" },
      { id: 5, name: "9L" },
      { id: 8, name: "9K" },
      { id: 7, name: "10A" },
      { id: 4, name: "10B" }
    ];
    
    // Filter to only classes that have students
    return classData.filter(c => uniqueClassIds.has(c.id));
  }, [students]);
  
  // Directly fetch students and teachers using fetch API
  useEffect(() => {
    async function fetchUsers() {
      try {
        // Fetch students
        const studentResponse = await fetch('/api/users/role/student');
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          console.log("Successfully loaded students:", studentData.length);
          console.log("Sample student data:", studentData[0]);
          setStudents(studentData);
          setFilteredStudents(studentData); // Initialize filtered students with all students
        } else {
          console.error("Failed to load students:", await studentResponse.text());
        }
        
        // Fetch teachers
        const teacherResponse = await fetch('/api/users/role/teacher');
        if (teacherResponse.ok) {
          const teacherData = await teacherResponse.json();
          console.log("Successfully loaded teachers:", teacherData.length);
          setTeachers(teacherData);
        } else {
          console.error("Failed to load teachers:", await teacherResponse.text());
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }
    
    fetchUsers();
  }, []);
  
  // Filter students based on search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const normalizedQuery = query.toLowerCase();
    const filtered = students.filter(student => 
      student.firstName?.toLowerCase().includes(normalizedQuery) || 
      student.lastName?.toLowerCase().includes(normalizedQuery) ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(normalizedQuery) ||
      (student.gradeLevel && student.gradeLevel.toLowerCase().includes(normalizedQuery))
    );
    
    console.log(`Filtering students with query "${query}": Found ${filtered.length} matches`);
    setFilteredStudents(filtered);
  };
  
  // Create a form schema based on our InsertIncidentReport type
  const formSchema = z.object({
    type: z.string().min(1, "Incident type is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    incidentDate: z.date().max(new Date(), "Incident date cannot be in the future"),
    studentIds: z.array(z.number()).min(1, "At least one student must be selected"),
    actionTaken: z.string().optional(),
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  // Default values for the form
  const defaultValues: Partial<FormValues> = {
    type: report?.type || (incidentTypes.length > 0 ? incidentTypes[0] : "disruptive_behavior"), // Default to first incident type
    description: report?.description || "",
    incidentDate: report ? new Date(report.incidentDate) : new Date(),
    studentIds: report?.studentIds || [],
    actionTaken: report?.actionTaken || "No action taken", // Default to "No action taken" instead of empty string
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Get student names for the toast message
      const studentNames = values.studentIds.map(id => {
        const student = students.find(s => s.id === id);
        return student ? `${student.firstName} ${student.lastName}` : `Student #${id}`;
      });
      
      // Cast the type to the expected IncidentType using type assertion
      // since we know the form only allows valid types from the dropdown
      const reportData = {
        ...values,
        type: values.type as any, // Type assertion to handle the enum conversion
        teacherId: user?.id || 0,
        // Ensure studentIds is properly formatted as an array of numbers
        studentIds: values.studentIds.map(id => Number(id)),
      } as unknown as InsertIncidentReport; // Force type assertion to match expected type
      
      if (report) {
        // Update existing report
        await updateReport(report.id, reportData as any);
        
        // Show success toast
        toast({
          title: "Incident report updated",
          description: `The incident report has been successfully updated.`,
          variant: "default",
        });
      } else {
        // Create new report
        await createReport(reportData as any);
        
        // Show success toast with student details
        toast({
          title: "Incident report submitted",
          description: `Report created for ${studentNames.length > 1 
            ? `${studentNames.length} students` 
            : studentNames[0]}.`,
          variant: "default",
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting incident report:", error);
      
      // Show error toast
      toast({
        title: "Submission failed",
        description: "There was an error submitting the incident report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleStudent = (studentId: number) => {
    setSelectedStudentIds(prevIds => {
      if (prevIds.includes(studentId)) {
        const newIds = prevIds.filter(id => id !== studentId);
        form.setValue("studentIds", newIds);
        return newIds;
      } else {
        const newIds = [...prevIds, studentId];
        form.setValue("studentIds", newIds);
        return newIds;
      }
    });
  };
  
  // Helper function to format incident type for display
  const formatIncidentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };
  
  return (
    <Card className="max-w-4xl mx-auto shadow-lg border border-border/50">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-2xl font-bold">{report ? "Edit Incident Report" : "New Incident Report"}</CardTitle>
        <CardDescription>
          {report 
            ? "Update the details of this incident report" 
            : "Fill out the form to report a student behavior incident"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Incident Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || incidentTypes[0]}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select incident type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {incidentTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {formatIncidentType(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the category that best describes this incident
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              {/* Incident Date */}
              <FormField
                control={form.control}
                name="incidentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Incident Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When did this incident occur?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Students Involved */}
            <FormField
              control={form.control}
              name="studentIds"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Students Involved</FormLabel>
                  <Popover open={studentsPopoverOpen} onOpenChange={setStudentsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value.length && "text-muted-foreground"
                          )}
                        >
                          {field.value.length > 0
                            ? `${field.value.length} student${field.value.length > 1 ? "s" : ""} selected`
                            : "Select students"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <div className="flex flex-col">
                        <div className="flex flex-col">
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 opacity-50" />
                            <input
                              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Search students..."
                              value={searchQuery}
                              onChange={(e) => handleSearch(e.target.value)}
                            />
                          </div>
                          
                          {/* Class filter dropdown */}
                          {classMap && classMap.length > 0 && (
                            <div className="px-3 py-3 border-b bg-muted/30">
                              <div className="mb-1.5 flex items-center">
                                <Layers className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Filter by Class</span>
                              </div>
                              <Select
                                value={classFilter !== null ? classFilter.toString() : "all"}
                                onValueChange={(value) => {
                                  // Handle the "all" special value for showing all classes
                                  if (value === "all") {
                                    setClassFilter(null);
                                    // If search query exists, respect it, otherwise show all students
                                    if (searchQuery) {
                                      handleSearch(searchQuery);
                                    } else {
                                      setFilteredStudents(students);
                                    }
                                    return;
                                  }
                                  
                                  // Convert value to number for class ID
                                  const classId = parseInt(value, 10);
                                  setClassFilter(classId);
                                  
                                  // Filter students by selected class
                                  const filtered = students.filter(s => s.classId === classId);
                                  setFilteredStudents(filtered);
                                  console.log(`Filtered to ${filtered.length} students in class ${classMap.find(c => c.id === classId)?.name}`);
                                }}
                              >
                                <SelectTrigger className="h-9 text-sm font-medium bg-background border-border shadow-sm">
                                  <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all" className="text-muted-foreground">
                                    <div className="flex items-center">
                                      <Users className="h-3.5 w-3.5 mr-2 opacity-70" /> 
                                      All Classes
                                    </div>
                                  </SelectItem>
                                  <SelectSeparator />
                                  {classMap.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()} className="font-medium">
                                      <div className="flex items-center">
                                        <GraduationCap className="h-3.5 w-3.5 mr-2 text-primary/70" /> 
                                        Class {c.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        
                        {filteredStudents.length === 0 ? (
                          <div className="py-6 text-center text-sm">No students found.</div>
                        ) : (
                          <div className="max-h-64 overflow-auto p-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {filteredStudents.map((student) => (
                                <div
                                  key={student.id}
                                  className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-md p-3 text-sm outline-none",
                                    "hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
                                    selectedStudentIds.includes(student.id) 
                                      ? "bg-primary/10 border border-primary shadow-md" 
                                      : "border border-border/40 hover:border-border"
                                  )}
                                  onClick={() => toggleStudent(student.id)}
                                >
                                  <div className={cn(
                                    "absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full transition-opacity",
                                    selectedStudentIds.includes(student.id)
                                      ? "bg-primary text-primary-foreground opacity-100"
                                      : "opacity-0"
                                  )}>
                                    <Check className="h-3 w-3" />
                                  </div>
                                  
                                  <div className="flex flex-col overflow-hidden">
                                    <span className="font-medium truncate">{student.firstName} {student.lastName}</span>
                                    <div className="flex items-center text-muted-foreground text-xs mt-1">
                                      {student.gradeLevel && (
                                        <div className="bg-muted/50 rounded-md px-1.5 py-0.5 inline-flex items-center">
                                          <GraduationCap className="h-3 w-3 mr-1 opacity-70" />
                                          <span>Grade {student.gradeLevel}</span>
                                        </div>
                                      )}
                                      {student.classId && (
                                        <div className="bg-primary/10 rounded-md px-1.5 py-0.5 ml-1.5 inline-flex items-center">
                                          <Users className="h-3 w-3 mr-1 opacity-70" />
                                          <span>Class {classMap.find(c => c.id === student.classId)?.name || 'Unknown'}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Display selected students */}
                  {selectedStudentIds.length > 0 && (
                    <div className="mt-3 border rounded-md p-3 bg-muted/10">
                      <div className="flex items-center text-xs font-medium text-muted-foreground mb-2.5">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Selected Students ({selectedStudentIds.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudentIds.map(id => {
                          const student = students.find(s => s.id === id);
                          const className = student?.classId ? classMap.find(c => c.id === student.classId)?.name : '';
                          return (
                            <Badge 
                              key={id} 
                              variant="outline"
                              className="cursor-pointer pl-2.5 pr-1.5 py-1.5 hover:bg-primary/5 transition-colors border-primary/40 shadow-sm flex items-center gap-1.5"
                              onClick={() => toggleStudent(id)}
                            >
                              <div className="flex items-center">
                                {student ? (
                                  <>
                                    <span className="font-medium">{student.firstName} {student.lastName}</span>
                                    {className && (
                                      <span className="ml-1.5 bg-primary/10 text-primary-foreground/80 text-[10px] px-1.5 py-0.5 rounded-sm font-medium">
                                        {className}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span>Student #{id}</span>
                                )}
                              </div>
                              <X className="ml-1 h-3.5 w-3.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-colors" />
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <FormDescription>
                    Select all students involved in this incident
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about what happened..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include relevant context and specific behaviors observed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Action Taken by Teacher */}
            <FormField
              control={form.control}
              name="actionTaken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Taken by Teacher</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || "No action taken"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action taken (if any)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="No action taken">No action taken</SelectItem>
                      {actionTakenOptions.map(action => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    What action did you take to address this behavior before escalating?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between items-center pt-4 border-t mt-8">
              <Button 
                variant="ghost" 
                onClick={() => onSuccess && onSuccess()}
                type="button"
              >
                Cancel
              </Button>
              
              <Button type="submit" disabled={isSubmitting} className="px-8">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {report ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  report ? "Update Report" : "Submit Report"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}