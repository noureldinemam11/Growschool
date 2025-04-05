import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, PlusCircle, Trash2, Edit, BookOpenCheck } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Class } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import TeacherAssignmentDialog from './TeacherAssignmentDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClassManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Class form state
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [section, setSection] = useState('');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');

  // Load classes
  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    onError: (error) => {
      toast({
        title: 'Error fetching classes',
        description: error instanceof Error ? error.message : 'Failed to load classes',
        variant: 'destructive',
      });
    },
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (classData: Omit<Class, 'id'>) => {
      const res = await apiRequest('POST', '/api/classes', classData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Class created',
        description: 'The class has been created successfully',
      });
      // Reset form and close dialog
      resetForm();
      setOpen(false);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error) => {
      toast({
        title: 'Error creating class',
        description: error instanceof Error ? error.message : 'Failed to create class',
        variant: 'destructive',
      });
    },
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Class> }) => {
      const res = await apiRequest('PATCH', `/api/classes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Class updated',
        description: 'The class has been updated successfully',
      });
      // Reset form and close dialog
      resetForm();
      setEditOpen(false);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating class',
        description: error instanceof Error ? error.message : 'Failed to update class',
        variant: 'destructive',
      });
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/classes/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Class deleted',
        description: 'The class has been deleted successfully',
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting class',
        description: error instanceof Error ? error.message : 'Failed to delete class',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission for creating a class
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClassMutation.mutate({
      name,
      gradeLevel,
      section,
      description,
      academicYear,
    });
  };

  // Handle form submission for updating a class
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    updateClassMutation.mutate({
      id: selectedClass.id,
      data: {
        name,
        gradeLevel,
        section,
        description,
        academicYear,
      },
    });
  };

  // Handle class deletion
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      deleteClassMutation.mutate(id);
    }
  };

  // Set up the edit form when a class is selected
  const handleEdit = (classData: Class) => {
    setSelectedClass(classData);
    setName(classData.name);
    setGradeLevel(classData.gradeLevel);
    setSection(classData.section);
    setDescription(classData.description || '');
    setAcademicYear(classData.academicYear);
    setEditOpen(true);
  };

  // Reset form fields
  const resetForm = () => {
    setName('');
    setGradeLevel('');
    setSection('');
    setDescription('');
    setAcademicYear('2024-2025');
    setSelectedClass(null);
  };

  // Get current academic year
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // If we're after August, it's the current year + next year
    // Otherwise it's the previous year + current year
    if (month >= 8) { // September or later
      setAcademicYear(`${year}-${year + 1}`);
    } else {
      setAcademicYear(`${year - 1}-${year}`);
    }
  }, []);

  // Only admin should see this component
  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to access class management.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Class Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to the system. Fill in all the required details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Class Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gradeLevel" className="text-right">Grade Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((grade) => (
                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="section" className="text-right">Section</Label>
                  <Input
                    id="section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="academicYear" className="text-right">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createClassMutation.isPending}
                >
                  {createClassMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Class
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Class Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
              <DialogDescription>
                Update the class details. Fill in all the required fields.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">Class Name</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-gradeLevel" className="text-right">Grade Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((grade) => (
                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-section" className="text-right">Section</Label>
                  <Input
                    id="edit-section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-academicYear" className="text-right">Academic Year</Label>
                  <Input
                    id="edit-academicYear"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateClassMutation.isPending}
                >
                  {updateClassMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Class
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="classes">
          <TabsList>
            <TabsTrigger value="classes">All Classes</TabsTrigger>
            <TabsTrigger value="assignments">Teacher Assignments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="classes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes && classes.length > 0 ? (
                classes.map((classItem) => (
                  <Card key={classItem.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center">
                        <span>{classItem.name}</span>
                        <span className="text-sm font-normal bg-secondary py-1 px-2 rounded">
                          Grade {classItem.gradeLevel}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Section: {classItem.section} | {classItem.academicYear}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm mt-2">
                        {classItem.description || 'No description provided'}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between bg-secondary/20 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleEdit(classItem)}
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleDelete(classItem.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle>No Classes Found</CardTitle>
                      <CardDescription>
                        There are no classes in the system yet. Click "Add Class" to create one.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="assignments">
            <TeacherAssignmentDialog />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}