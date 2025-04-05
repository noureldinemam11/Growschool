import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, PlusCircle, Trash2, Edit, BookOpenCheck, UserCheck, User, School } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Class, TeacherClassAssignment, User as UserType } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeacherAssignmentDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherClassAssignment | null>(null);

  // Form state
  const [teacherId, setTeacherId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [subjectTaught, setSubjectTaught] = useState('');
  const [isMainTeacher, setIsMainTeacher] = useState(false);

  // Fetch data
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery<TeacherClassAssignment[]>({
    queryKey: ['/api/teacher-assignments'],
    onError: (error) => {
      toast({
        title: 'Error fetching teacher assignments',
        description: error instanceof Error ? error.message : 'Failed to load assignments',
        variant: 'destructive',
      });
    },
  });

  const { data: teachers, isLoading: isLoadingTeachers } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/teacher'],
    onError: (error) => {
      toast({
        title: 'Error fetching teachers',
        description: error instanceof Error ? error.message : 'Failed to load teachers',
        variant: 'destructive',
      });
    },
  });

  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    onError: (error) => {
      toast({
        title: 'Error fetching classes',
        description: error instanceof Error ? error.message : 'Failed to load classes',
        variant: 'destructive',
      });
    },
  });

  // Mutations
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: Omit<TeacherClassAssignment, 'id' | 'assignedDate'>) => {
      const res = await apiRequest('POST', '/api/teacher-assignments', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assignment created',
        description: 'The teacher has been assigned to the class successfully',
      });
      resetForm();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-assignments'] });
    },
    onError: (error) => {
      toast({
        title: 'Error creating assignment',
        description: error instanceof Error ? error.message : 'Failed to assign teacher',
        variant: 'destructive',
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TeacherClassAssignment> }) => {
      const res = await apiRequest('PATCH', `/api/teacher-assignments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assignment updated',
        description: 'The teacher assignment has been updated successfully',
      });
      resetForm();
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-assignments'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating assignment',
        description: error instanceof Error ? error.message : 'Failed to update assignment',
        variant: 'destructive',
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/teacher-assignments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assignment deleted',
        description: 'The teacher assignment has been removed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-assignments'] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting assignment',
        description: error instanceof Error ? error.message : 'Failed to delete assignment',
        variant: 'destructive',
      });
    },
  });

  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAssignmentMutation.mutate({
      teacherId: parseInt(teacherId),
      classId: parseInt(classId),
      subjectTaught,
      isMainTeacher,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    updateAssignmentMutation.mutate({
      id: selectedAssignment.id,
      data: {
        subjectTaught,
        isMainTeacher,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to remove this teacher assignment?')) {
      deleteAssignmentMutation.mutate(id);
    }
  };

  const handleEdit = (assignment: TeacherClassAssignment) => {
    setSelectedAssignment(assignment);
    setTeacherId(assignment.teacherId.toString());
    setClassId(assignment.classId.toString());
    setSubjectTaught(assignment.subjectTaught || '');
    setIsMainTeacher(assignment.isMainTeacher);
    setEditOpen(true);
  };

  const resetForm = () => {
    setTeacherId('');
    setClassId('');
    setSubjectTaught('');
    setIsMainTeacher(false);
    setSelectedAssignment(null);
  };

  // Helper function to find entity by ID
  const getTeacherName = (id: number) => {
    const teacher = teachers?.find((t) => t.id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher';
  };

  const getClassName = (id: number) => {
    const classItem = classes?.find((c) => c.id === id);
    return classItem ? `${classItem.name} (Grade ${classItem.gradeLevel}-${classItem.section})` : 'Unknown Class';
  };

  const isLoading = isLoadingAssignments || isLoadingTeachers || isLoadingClasses;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Teacher Class Assignments</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Assign Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Teacher to Class</DialogTitle>
              <DialogDescription>
                Assign a teacher to a class and specify their role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teacher" className="text-right">
                    Teacher
                  </Label>
                  <Select value={teacherId} onValueChange={setTeacherId} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="class" className="text-right">
                    Class
                  </Label>
                  <Select value={classId} onValueChange={setClassId} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id.toString()}>
                          {classItem.name} (Grade {classItem.gradeLevel}-{classItem.section})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    value={subjectTaught}
                    onChange={(e) => setSubjectTaught(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Mathematics, Science, English"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="main-teacher" className="text-right">
                    Main Teacher
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="main-teacher"
                      checked={isMainTeacher}
                      onCheckedChange={setIsMainTeacher}
                    />
                    <Label htmlFor="main-teacher">
                      {isMainTeacher ? 'Yes' : 'No'}
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createAssignmentMutation.isPending}
                >
                  {createAssignmentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Assign Teacher
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Teacher Assignment</DialogTitle>
              <DialogDescription>
                Update the details of this teacher's class assignment.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Teacher</Label>
                  <div className="col-span-3">
                    <p className="font-medium">
                      {selectedAssignment ? getTeacherName(selectedAssignment.teacherId) : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Class</Label>
                  <div className="col-span-3">
                    <p className="font-medium">
                      {selectedAssignment ? getClassName(selectedAssignment.classId) : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-subject" className="text-right">
                    Subject
                  </Label>
                  <Input
                    id="edit-subject"
                    value={subjectTaught}
                    onChange={(e) => setSubjectTaught(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Mathematics, Science, English"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-main-teacher" className="text-right">
                    Main Teacher
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="edit-main-teacher"
                      checked={isMainTeacher}
                      onCheckedChange={setIsMainTeacher}
                    />
                    <Label htmlFor="edit-main-teacher">
                      {isMainTeacher ? 'Yes' : 'No'}
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateAssignmentMutation.isPending}
                >
                  {updateAssignmentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Assignment
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
      ) : assignments && assignments.length > 0 ? (
        <ScrollArea className="h-[500px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {getTeacherName(assignment.teacherId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4" />
                      {getClassName(assignment.classId)}
                    </div>
                  </TableCell>
                  <TableCell>{assignment.subjectTaught || '-'}</TableCell>
                  <TableCell>
                    {assignment.isMainTeacher ? (
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <UserCheck className="h-3 w-3" /> Main Teacher
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-fit">
                        Assistant
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.assignedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(assignment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      ) : (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>No Teacher Assignments</CardTitle>
            <CardDescription>
              There are no teacher-class assignments in the system yet. Click "Assign Teacher" to create one.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}