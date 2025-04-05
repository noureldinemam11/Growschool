import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, House } from '@shared/schema';
import { globalEventBus, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ManageRoster from '@/components/student/ManageRoster';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, UserPlus, Upload, Download, Users, Trash2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';

// Define schema for the bulk import form
const bulkImportSchema = z.object({
  studentNames: z.string().min(1, { message: 'Please enter at least one student name' }),
  houseId: z.string().min(1, { message: 'Please select a house' }),
  gradeLevel: z.string().min(1, { message: 'Please enter a grade' }),
});

type BulkImportFormData = z.infer<typeof bulkImportSchema>;

// Define schema for an individual student
const studentSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  houseId: z.number().min(1, { message: 'House is required' }),
  gradeLevel: z.string().min(1, { message: 'Grade is required' }),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function RosterManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);

  // Fetch houses for dropdown
  const { data: houses, isLoading: isLoadingHouses } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });

  // Fetch current students - use the `/api/users/role/student` endpoint which works correctly
  const { data: students, isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });

  // Set up form for bulk import
  const bulkImportForm = useForm<BulkImportFormData>({
    resolver: zodResolver(bulkImportSchema),
    defaultValues: {
      studentNames: '',
      houseId: '',
      gradeLevel: '',
    },
  });

  // Set up form for single student addition
  const singleStudentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      houseId: 0,
      gradeLevel: '',
    },
  });

  // Mutation for bulk importing students
  const bulkImportMutation = useMutation({
    mutationFn: async (data: BulkImportFormData) => {
      // Split on newlines or carriage returns or a combination
      const processedNames = data.studentNames
        .split(/\r?\n/)
        .filter(name => name.trim())
        .map(name => {
          // Handle different name formats (last, first or first last or full Arabic names)
          let firstName, lastName;
          
          if (name.includes(',')) {
            // Format: "Last, First"
            const [last, first] = name.split(',').map(part => part.trim());
            lastName = last;
            firstName = first;
          } else {
            // Format: "Full Name" - Handle multi-part names
            const parts = name.trim().split(' ');
            
            // For multi-part Arabic names or names with more than 2 parts
            if (parts.length > 2) {
              // Take the first part as the first name
              firstName = parts[0];
              // Take the rest as the last name
              lastName = parts.slice(1).join(' ');
            } else if (parts.length === 2) {
              // Standard "First Last" format
              firstName = parts[0];
              lastName = parts[1];
            } else {
              firstName = name.trim();
              lastName = '[Unknown]';
            }
          }
          
          // Create a sanitized username from firstName and lastName
          const sanitizedFirstName = firstName.toLowerCase().replace(/\s+/g, '');
          const sanitizedLastName = lastName.toLowerCase().replace(/\s+/g, '');
          
          return {
            firstName,
            lastName,
            houseId: parseInt(data.houseId),
            gradeLevel: data.gradeLevel,
            role: 'student',
            // Generate a placeholder email since it's required by the database
            email: `${sanitizedFirstName}.${sanitizedLastName}@school.example`,
            // This satisfies the form requirements - username and password will be set on server
            confirmPassword: 'no-login-required',
            username: `${sanitizedFirstName}${sanitizedLastName}`,
            password: 'no-login-required',
          };
        });
      
      // Send the processed student data to the API
      const response = await apiRequest('POST', '/api/users/bulk-import', {
        students: processedNames
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Students imported successfully',
        description: 'The students have been added to the roster.',
      });
      
      // Close dialog and reset form
      setIsImportDialogOpen(false);
      bulkImportForm.reset();
      
      // Refresh student data
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      refetchStudents();
      
      // Publish event to notify other components
      globalEventBus.publish('students-updated');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to import students',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for adding a single student
  const addStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      // Generate a sanitized username from firstName and lastName
      const sanitizedFirstName = data.firstName.toLowerCase().replace(/\s+/g, '');
      const sanitizedLastName = data.lastName.toLowerCase().replace(/\s+/g, '');
      
      // Generate placeholder email and username for the student (since they won't actually log in)
      const response = await apiRequest('POST', '/api/users', {
        ...data,
        email: `${sanitizedFirstName}.${sanitizedLastName}@school.example`,
        username: `${sanitizedFirstName}${sanitizedLastName}`,
        password: 'no-login-required',
        confirmPassword: 'no-login-required',
        role: 'student',
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Student added successfully',
        description: 'The student has been added to the roster.',
      });
      
      // Close dialog and reset form
      setIsAddStudentDialogOpen(false);
      singleStudentForm.reset();
      
      // Refresh student data
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      refetchStudents();
      
      // Publish event to notify other components
      globalEventBus.publish('students-updated');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add student',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting a student
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      try {
        console.log(`Deleting student with ID: ${studentId}`);
        // The apiRequest already throws if there's an error
        const response = await apiRequest('DELETE', `/api/users/${studentId}`);
        return await response.json();
      } catch (error) {
        console.error("Error in delete mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Student removed successfully',
        description: 'The student and all associated records have been removed.',
      });
      
      // Refresh student data
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      refetchStudents();
      
      // Publish event to notify other components
      globalEventBus.publish('students-updated');
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      let errorMessage = "An unknown error occurred";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }
      
      toast({
        title: 'Failed to remove student',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Handle bulk import form submission
  const onBulkImportSubmit = (data: BulkImportFormData) => {
    bulkImportMutation.mutate(data);
  };

  // Handle single student form submission
  const onSingleStudentSubmit = (data: StudentFormData) => {
    addStudentMutation.mutate(data);
  };

  // Handle student deletion
  const handleDeleteStudent = (studentId: number) => {
    if (window.confirm('Are you sure you want to remove this student? This will delete all associated behavior points and reward records. This action cannot be undone.')) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Integrate the ManageRoster component for enhanced student management */}
      <ManageRoster />
      
      {/* Original student import functionality */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bulk Student Import</CardTitle>
            <CardDescription>Import multiple students at once</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  <span>Add Student</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Add a single student to the roster.
                  </DialogDescription>
                </DialogHeader>
                <Form {...singleStudentForm}>
                  <form onSubmit={singleStudentForm.handleSubmit(onSingleStudentSubmit)} className="space-y-4">
                    <FormField
                      control={singleStudentForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={singleStudentForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={singleStudentForm.control}
                      name="gradeLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade</FormLabel>
                          <FormControl>
                            <Input placeholder="9" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={singleStudentForm.control}
                      name="houseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>House</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value ? field.value.toString() : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a house" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {houses?.map((house) => (
                                <SelectItem key={house.id} value={house.id.toString()}>
                                  {house.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddStudentDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addStudentMutation.isPending}
                      >
                        {addStudentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Student'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1.5" variant="outline">
                  <Upload className="h-4 w-4" />
                  <span>Bulk Import</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Bulk Import Students</DialogTitle>
                  <DialogDescription>
                    Add multiple students at once by pasting their names.
                  </DialogDescription>
                </DialogHeader>
                <Form {...bulkImportForm}>
                  <form onSubmit={bulkImportForm.handleSubmit(onBulkImportSubmit)} className="space-y-4">
                    <FormField
                      control={bulkImportForm.control}
                      name="studentNames"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Names</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste student names here, one per line. Examples:
ABDULRAHMAN AHMED HUSAIN AHMED ALKATHEERI
ALI BADR ALI ABDULLA ALHOSANI
MAYED AHMED MUBARAK OBIAD ALHAMELI"
                              className="min-h-[200px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter each student on a new line. For names with multiple parts like "ABDULRAHMAN AHMED HUSAIN AHMED ALKATHEERI", the first part will be used as the first name and the rest as the last name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bulkImportForm.control}
                        name="gradeLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade</FormLabel>
                            <FormControl>
                              <Input placeholder="9" {...field} />
                            </FormControl>
                            <FormDescription>
                              All imported students will be assigned to this grade.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkImportForm.control}
                        name="houseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>House</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a house" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {houses?.map((house) => (
                                  <SelectItem key={house.id} value={house.id.toString()}>
                                    {house.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              All imported students will be assigned to this house.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsImportDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={bulkImportMutation.isPending}
                      >
                        {bulkImportMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          'Import Students'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !students || students.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="mb-4">No students found in the roster.</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Add students individually or use the bulk import option to add multiple students at once.
              </p>
            </div>
          ) : (
            <Table>
              <TableCaption>A list of all students in the roster.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.gradeLevel || "N/A"}</TableCell>
                    <TableCell>
                      {houses?.find(h => h.id === student.houseId)?.name || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        title="Delete student and all associated records"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}