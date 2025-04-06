import { useState, useEffect } from "react";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown, Loader2, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { IncidentReport, InsertIncidentReport, User, incidentTypes } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useIncidentReports } from "@/hooks/incident-report-context";
import { useUsers } from "@/hooks/use-users";
import { Badge } from "@/components/ui/badge";

interface IncidentReportFormProps {
  report?: IncidentReport;
  onSuccess?: () => void;
}

export default function IncidentReportForm({ report, onSuccess }: IncidentReportFormProps) {
  const { user } = useAuth();
  const { createReport, updateReport } = useIncidentReports();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(
    report?.studentIds || []
  );
  const [studentsPopoverOpen, setStudentsPopoverOpen] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<User[]>([]);
  
  // Directly fetch students and teachers using fetch API
  useEffect(() => {
    async function fetchUsers() {
      try {
        // Fetch students
        const studentResponse = await fetch('/api/users/role/student');
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          console.log("Successfully loaded students:", studentData.length);
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
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  // Default values for the form
  const defaultValues: Partial<FormValues> = {
    type: report?.type || "",
    description: report?.description || "",
    incidentDate: report ? new Date(report.incidentDate) : new Date(),
    studentIds: report?.studentIds || [],
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const reportData: InsertIncidentReport = {
        ...values,
        teacherId: user?.id || 0,
      };
      
      if (report) {
        // Update existing report
        await updateReport(report.id, reportData);
      } else {
        // Create new report
        await createReport(reportData);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting incident report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleStudent = (studentId: number) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
      form.setValue("studentIds", selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
      form.setValue("studentIds", [...selectedStudentIds, studentId]);
    }
  };
  
  // Helper function to format incident type for display
  const formatIncidentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{report ? "Edit Incident Report" : "New Incident Report"}</CardTitle>
        <CardDescription>
          {report 
            ? "Update the details of this incident report" 
            : "Fill out the form to report a student behavior incident"}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                      defaultValue={field.value}
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
                      <Command>
                        <CommandInput 
                          placeholder="Search students..." 
                          value={searchQuery}
                          onValueChange={handleSearch}
                        />
                        <CommandEmpty>No students found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {filteredStudents.map((student) => (
                            <CommandItem
                              key={student.id}
                              value={student.id.toString()}
                              onSelect={() => {
                                toggleStudent(student.id);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedStudentIds.includes(student.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {student.firstName} {student.lastName}
                              {student.gradeLevel && (
                                <span className="ml-2 text-muted-foreground text-xs">
                                  (Grade: {student.gradeLevel})
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Display selected students */}
                  {selectedStudentIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStudentIds.map(id => {
                        const student = students.find(s => s.id === id);
                        return (
                          <Badge 
                            key={id} 
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => toggleStudent(id)}
                          >
                            {student ? `${student.firstName} ${student.lastName}` : `Student #${id}`}
                            <AlertCircle className="ml-1 h-3 w-3" />
                          </Badge>
                        );
                      })}
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
            
            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={isSubmitting}>
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