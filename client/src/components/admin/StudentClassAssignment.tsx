import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, CheckCircle2, XCircle, School, User, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Class, User as UserType } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StudentClassAssignment() {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [bulkActionVisible, setBulkActionVisible] = useState(false);

  // Load data
  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/student'],
  });

  // Filter students by search query
  const filteredStudents = students?.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Add student to class mutation
  const addStudentMutation = useMutation({
    mutationFn: async ({ classId, studentId }: { classId: number; studentId: number }) => {
      const res = await apiRequest('POST', `/api/classes/${classId}/add-student/${studentId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Student added',
        description: 'The student has been added to the class successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
    },
    onError: (error) => {
      toast({
        title: 'Error adding student',
        description: error instanceof Error ? error.message : 'Failed to add student to class',
        variant: 'destructive',
      });
    },
  });

  // Remove student from class mutation
  const removeStudentMutation = useMutation({
    mutationFn: async ({ classId, studentId }: { classId: number; studentId: number }) => {
      const res = await apiRequest('DELETE', `/api/classes/${classId}/remove-student/${studentId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Student removed',
        description: 'The student has been removed from the class successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
    },
    onError: (error) => {
      toast({
        title: 'Error removing student',
        description: error instanceof Error ? error.message : 'Failed to remove student from class',
        variant: 'destructive',
      });
    },
  });

  // Bulk add students to class mutation
  const bulkAddStudentsMutation = useMutation({
    mutationFn: async ({ classId, studentIds }: { classId: number; studentIds: number[] }) => {
      const res = await apiRequest('POST', `/api/classes/${classId}/add-students`, { studentIds });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Students added',
        description: 'The selected students have been added to the class successfully',
      });
      setSelectedStudents([]);
      setBulkActionVisible(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
    },
    onError: (error) => {
      toast({
        title: 'Error adding students',
        description: error instanceof Error ? error.message : 'Failed to add students to class',
        variant: 'destructive',
      });
    },
  });

  // Handle adding a student to a class
  const handleAddStudent = (studentId: number) => {
    if (!selectedClass) {
      toast({
        title: 'Class not selected',
        description: 'Please select a class first',
        variant: 'destructive',
      });
      return;
    }

    addStudentMutation.mutate({
      classId: parseInt(selectedClass),
      studentId,
    });
  };

  // Handle removing a student from a class
  const handleRemoveStudent = (studentId: number, classId: number) => {
    removeStudentMutation.mutate({
      classId,
      studentId,
    });
  };

  // Handle bulk student selection
  const handleStudentSelection = (studentId: number) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Handle bulk add students
  const handleBulkAddStudents = () => {
    if (!selectedClass) {
      toast({
        title: 'Class not selected',
        description: 'Please select a class first',
        variant: 'destructive',
      });
      return;
    }

    if (selectedStudents.length === 0) {
      toast({
        title: 'No students selected',
        description: 'Please select at least one student',
        variant: 'destructive',
      });
      return;
    }

    bulkAddStudentsMutation.mutate({
      classId: parseInt(selectedClass),
      studentIds: selectedStudents,
    });
  };

  // Get class name by ID
  const getClassName = (classId: number | null | undefined) => {
    if (!classId) return 'Not Assigned';
    const classItem = classes?.find((c) => c.id === classId);
    return classItem ? `${classItem.name} (Grade ${classItem.gradeLevel}-${classItem.section})` : 'Unknown Class';
  };

  const isLoading = isLoadingClasses || isLoadingStudents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="w-full md:w-1/3">
          <Label htmlFor="class-filter">Filter by Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Classes</SelectItem>
              {classes?.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id.toString()}>
                  {classItem.name} (Grade {classItem.gradeLevel}-{classItem.section})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/3 relative">
          <Label htmlFor="search">Search Students</Label>
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="w-full md:w-1/3 flex justify-end items-end">
          {selectedStudents.length > 0 && (
            <Button
              variant="default"
              onClick={() => setBulkActionVisible(true)}
              className="flex items-center gap-2"
              disabled={!selectedClass}
            >
              <Users className="h-4 w-4" />
              Assign {selectedStudents.length} Students
            </Button>
          )}
        </div>
      </div>

      {bulkActionVisible && (
        <Card className="bg-muted/30 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bulk Assignment</CardTitle>
            <CardDescription>
              You are about to assign {selectedStudents.length} students to{' '}
              {selectedClass ? getClassName(parseInt(selectedClass)) : 'the selected class'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkActionVisible(false);
                  setSelectedStudents([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleBulkAddStudents}
                disabled={bulkAddStudentsMutation.isPending}
              >
                {bulkAddStudentsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Assignment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Students</TabsTrigger>
            <TabsTrigger value="assigned">Assigned Students</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Student Class Assignments</CardTitle>
                <CardDescription>
                  Manage which students are assigned to each class.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: 50 }}>
                          <Checkbox
                            checked={
                              filteredStudents && filteredStudents.length > 0 &&
                              filteredStudents.every((student) => selectedStudents.includes(student.id))
                            }
                            onCheckedChange={(checked) => {
                              if (checked && filteredStudents) {
                                setSelectedStudents(filteredStudents.map((s) => s.id));
                              } else {
                                setSelectedStudents([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Current Class</TableHead>
                        <TableHead>House</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents && filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={() => handleStudentSelection(student.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {student.firstName} {student.lastName}
                            </TableCell>
                            <TableCell>{student.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {student.classId ? (
                                  <>
                                    <School className="h-4 w-4 text-green-600" />
                                    {getClassName(student.classId)}
                                  </>
                                ) : (
                                  <Badge variant="outline" className="bg-muted">Not Assigned</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.houseId ? (
                                <Badge
                                  className="w-fit"
                                  style={{
                                    backgroundColor: student.house?.color || undefined,
                                    color: '#fff',
                                  }}
                                >
                                  {student.house?.name || `House ${student.houseId}`}
                                </Badge>
                              ) : (
                                <Badge variant="outline">No House</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {student.classId && selectedClass && student.classId.toString() !== selectedClass ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveStudent(student.id, student.classId!)}
                                    disabled={removeStudentMutation.isPending}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Remove
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleAddStudent(student.id)}
                                    disabled={!selectedClass || addStudentMutation.isPending}
                                  >
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Reassign
                                  </Button>
                                </div>
                              ) : student.classId ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveStudent(student.id, student.classId!)}
                                  disabled={removeStudentMutation.isPending}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAddStudent(student.id)}
                                  disabled={!selectedClass || addStudentMutation.isPending}
                                >
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                  Assign
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                            {searchQuery
                              ? 'No students found matching your search criteria'
                              : 'No students available'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assigned">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Assigned Students</CardTitle>
                <CardDescription>
                  Students who are currently assigned to a class.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: 50 }}>
                          <Checkbox
                            checked={
                              filteredStudents && filteredStudents.filter(s => s.classId).length > 0 &&
                              filteredStudents.filter(s => s.classId).every((student) => selectedStudents.includes(student.id))
                            }
                            onCheckedChange={(checked) => {
                              if (checked && filteredStudents) {
                                setSelectedStudents(filteredStudents.filter(s => s.classId).map((s) => s.id));
                              } else {
                                setSelectedStudents([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Current Class</TableHead>
                        <TableHead>House</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents && filteredStudents.filter(s => s.classId).length > 0 ? (
                        filteredStudents
                          .filter(s => s.classId)
                          .map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedStudents.includes(student.id)}
                                  onCheckedChange={() => handleStudentSelection(student.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {student.firstName} {student.lastName}
                              </TableCell>
                              <TableCell>{student.id}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <School className="h-4 w-4 text-green-600" />
                                  {getClassName(student.classId)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {student.houseId ? (
                                  <Badge
                                    className="w-fit"
                                    style={{
                                      backgroundColor: student.house?.color || undefined,
                                      color: '#fff',
                                    }}
                                  >
                                    {student.house?.name || `House ${student.houseId}`}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">No House</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {selectedClass && student.classId.toString() !== selectedClass ? (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveStudent(student.id, student.classId!)}
                                      disabled={removeStudentMutation.isPending}
                                    >
                                      <XCircle className="mr-1 h-4 w-4" />
                                      Remove
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleAddStudent(student.id)}
                                      disabled={!selectedClass || addStudentMutation.isPending}
                                    >
                                      <CheckCircle2 className="mr-1 h-4 w-4" />
                                      Reassign
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveStudent(student.id, student.classId!)}
                                    disabled={removeStudentMutation.isPending}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Remove
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                            No students are currently assigned to any class
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="unassigned">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Unassigned Students</CardTitle>
                <CardDescription>
                  Students who are not yet assigned to any class.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: 50 }}>
                          <Checkbox
                            checked={
                              filteredStudents && filteredStudents.filter(s => !s.classId).length > 0 &&
                              filteredStudents.filter(s => !s.classId).every((student) => selectedStudents.includes(student.id))
                            }
                            onCheckedChange={(checked) => {
                              if (checked && filteredStudents) {
                                setSelectedStudents(filteredStudents.filter(s => !s.classId).map((s) => s.id));
                              } else {
                                setSelectedStudents([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>House</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents && filteredStudents.filter(s => !s.classId).length > 0 ? (
                        filteredStudents
                          .filter(s => !s.classId)
                          .map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedStudents.includes(student.id)}
                                  onCheckedChange={() => handleStudentSelection(student.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {student.firstName} {student.lastName}
                              </TableCell>
                              <TableCell>{student.id}</TableCell>
                              <TableCell>
                                {student.houseId ? (
                                  <Badge
                                    className="w-fit"
                                    style={{
                                      backgroundColor: student.house?.color || undefined,
                                      color: '#fff',
                                    }}
                                  >
                                    {student.house?.name || `House ${student.houseId}`}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">No House</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAddStudent(student.id)}
                                  disabled={!selectedClass || addStudentMutation.isPending}
                                >
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                  Assign
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            All students have been assigned to classes
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}