import { FC, useState, useEffect } from 'react';
import { User, House } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  UsersIcon,
  UserX,
  Edit,
  Trash2,
  Check,
  X,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ManageRosterProps {
  // Optional prop
}

const ManageRoster: FC<ManageRosterProps> = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditStudent, setCurrentEditStudent] = useState<Partial<User> | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  // Get students
  const { data: students, isLoading: isLoadingStudents } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });

  // Get houses for dropdown
  const { data: houses, isLoading: isLoadingHouses } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });

  // Handle selecting all students
  useEffect(() => {
    if (selectAll && students) {
      setSelectedStudents(students.map(student => student.id));
    } else if (!selectAll) {
      setSelectedStudents([]);
    }
  }, [selectAll, students]);

  // Mutation for deleting a student
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const res = await apiRequest('DELETE', `/api/users/${studentId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting multiple students
  const bulkDeleteStudentsMutation = useMutation({
    mutationFn: async (studentIds: number[]) => {
      const res = await apiRequest('POST', `/api/users/bulk-delete`, { userIds: studentIds });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      setSelectedStudents([]);
      toast({
        title: "Success",
        description: `${selectedStudents.length} students deleted successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting students",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting all students
  const deleteAllStudentsMutation = useMutation({
    mutationFn: async () => {
      // Get all student IDs and use bulk delete
      if (!students || students.length === 0) return { success: true, deletedCount: 0 };
      const studentIds = students.map(student => student.id);
      const res = await apiRequest('POST', `/api/users/bulk-delete`, { userIds: studentIds });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      setSelectedStudents([]);
      setSelectAll(false);
      toast({
        title: "Success",
        description: "All students deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting all students",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a student
  const updateStudentMutation = useMutation({
    mutationFn: async (data: { id: number, updateData: Partial<User> }) => {
      const res = await apiRequest('PUT', `/api/users/${data.id}`, data.updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      setIsEditModalOpen(false);
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle student selection
  const toggleStudentSelection = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student to delete",
        variant: "destructive",
      });
      return;
    }
    setIsDeleteModalOpen(true);
  };

  // Handle edit button click
  const handleEditClick = (student: User) => {
    setCurrentEditStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      gradeLevel: student.gradeLevel,
      section: student.section,
      houseId: student.houseId,
    });
    setIsEditModalOpen(true);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditStudent?.id) return;

    updateStudentMutation.mutate({
      id: currentEditStudent.id,
      updateData: formData
    });
  };

  // Delete selected students
  const confirmDeleteSelected = () => {
    bulkDeleteStudentsMutation.mutate(selectedStudents);
    setIsDeleteModalOpen(false);
  };

  // Delete all students
  const confirmDeleteAll = () => {
    deleteAllStudentsMutation.mutate();
    setIsDeleteAllModalOpen(false);
  };

  // Get house color and name
  const getHouseDetails = (houseId: number | null | undefined) => {
    if (houseId === null || houseId === undefined || houseId === 0 || !houses) {
      return { color: '#cccccc', name: 'No House' };
    }
    
    const house = houses.find(h => h.id === houseId);
    if (!house) {
      return { color: '#cccccc', name: 'No House' };
    }
    
    return {
      color: house.color,
      name: house.name
    };
  };

  if (isLoadingStudents || isLoadingHouses) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Manage Student Roster</CardTitle>
            <CardDescription>Add, edit, or remove students from the system</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={() => window.location.href = '/add-student'}
            >
              <UserPlus className="h-4 w-4" />
              Add Student
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={() => setIsDeleteAllModalOpen(true)}
            >
              <Users className="h-4 w-4" />
              Delete All
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className={cn(
                "flex items-center gap-1",
                selectedStudents.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              )}
              onClick={handleDeleteClick}
              disabled={selectedStudents.length === 0}
            >
              <UserX className="h-4 w-4" />
              Delete Selected ({selectedStudents.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectAll} 
                    onCheckedChange={(checked) => {
                      setSelectAll(!!checked);
                    }}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>House</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students && students.length > 0 ? (
                students.map(student => {
                  const houseDetails = getHouseDetails(student.houseId);
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        {student.gradeLevel}
                        {student.section && <span className="ml-1">{student.section}</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: houseDetails.color }}
                          ></div>
                          <span>{houseDetails.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditClick(student)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive" 
                            onClick={() => {
                              setSelectedStudents([student.id]);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UsersIcon className="h-10 w-10 mb-2 opacity-20" />
                      <p>No students found</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => window.location.href = '/add-student'}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Total: {students?.length || 0} students
        </div>
        <div className="text-sm text-muted-foreground">
          Selected: {selectedStudents.length} students
        </div>
      </CardFooter>

      {/* Delete confirmation modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedStudents.length === 1 ? "Delete Student" : "Delete Students"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStudents.length === 1 
                ? "Are you sure you want to delete this student? This action cannot be undone."
                : `Are you sure you want to delete ${selectedStudents.length} students? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all confirmation modal */}
      <AlertDialog open={isDeleteAllModalOpen} onOpenChange={setIsDeleteAllModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Students</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL students? This action cannot be undone and will remove {students?.length || 0} students from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit student modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Make changes to the student information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Input
                    id="gradeLevel"
                    name="gradeLevel"
                    value={formData.gradeLevel || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    name="section"
                    value={formData.section || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="houseId">House</Label>
                <Select 
                  value={formData.houseId?.toString() || '0'} 
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      houseId: value && value !== '0' ? parseInt(value) : null
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a house" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No House</SelectItem>
                    {houses?.map(house => (
                      <SelectItem key={house.id} value={house.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: house.color }}
                          ></div>
                          {house.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ManageRoster;