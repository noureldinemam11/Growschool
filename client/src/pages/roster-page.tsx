import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, UserPlus, UsersRound, School, Home, Edit, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ImportStudentsButton } from '@/components/roster/ImportStudentsButton';

// Type definitions
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  gradeLevel: string | null;
  section: string | null;
  podId: number | null;
  classId: number | null;
}

interface Pod {
  id: number;
  name: string;
  color: string;
  description: string | null;
  logoUrl: string | null;
  points: number;
}

interface Class {
  id: number;
  name: string;
  podId: number | null;
  gradeLevel: string | null;
}

export default function RosterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ['/api/users/role/student'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch pods
  const { data: pods, isLoading: isLoadingPods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch classes
  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Group students by grade
  const studentsByGrade = students
    ? students.reduce<Record<string, Student[]>>((acc, student) => {
        const grade = student.gradeLevel || 'Unassigned';
        if (!acc[grade]) {
          acc[grade] = [];
        }
        acc[grade].push(student);
        return acc;
      }, {})
    : {};

  // Group students by section
  const studentsBySection = students
    ? students.reduce<Record<string, Student[]>>((acc, student) => {
        const section = student.section || 'Unassigned';
        if (!acc[section]) {
          acc[section] = [];
        }
        acc[section].push(student);
        return acc;
      }, {})
    : {};

  // Group students by pod
  const studentsByPod = students
    ? students.reduce<Record<string, Student[]>>((acc, student) => {
        const pod = student.podId
          ? pods?.find(p => p.id === student.podId)?.name || 'Unknown'
          : 'Unassigned';
        if (!acc[pod]) {
          acc[pod] = [];
        }
        acc[pod].push(student);
        return acc;
      }, {})
    : {};
    
  // Group students by class
  const studentsByClass = students
    ? students.reduce<Record<string, Student[]>>((acc, student) => {
        const className = student.classId
          ? classes?.find(c => c.id === student.classId)?.name || 'Unknown'
          : 'Unassigned';
        if (!acc[className]) {
          acc[className] = [];
        }
        acc[className].push(student);
        return acc;
      }, {})
    : {};

  // Update student roster mutation
  const updateStudentRoster = useMutation({
    mutationFn: async (values: { 
      studentId: number; 
      gradeLevel?: string; 
      section?: string; 
      podId?: number | null;
      classId?: number | null;
    }) => {
      const { studentId, ...data } = values;
      const res = await apiRequest('PATCH', `/api/users/students/${studentId}/roster`, data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      toast({
        title: 'Roster Updated',
        description: 'Student roster information has been updated successfully.',
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (!editingStudent) return;

    updateStudentRoster.mutate({
      studentId: editingStudent.id,
      gradeLevel: editingStudent.gradeLevel || undefined,
      section: editingStudent.section || undefined,
      podId: editingStudent.podId,
      classId: editingStudent.classId,
    });
  };

  // Filter and search students
  const filteredStudents = students
    ? students.filter(student => {
        const matchesSearch = searchTerm === '' ||
          student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (student.gradeLevel && student.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (student.section && student.section.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSearch;
      })
    : [];

  // Only show this page to teachers and admins
  if (user?.role !== 'admin' && user?.role !== 'teacher') {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center h-[80vh]">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p className="mt-2">You don't have permission to view the roster management page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Student Roster Management</h1>
          <p className="text-muted-foreground">Manage student assignments to grades, sections, pods, and classes</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <ImportStudentsButton />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2 mr-4">
            <UsersRound className="h-4 w-4" />
            <span>All Students</span>
          </TabsTrigger>
          <TabsTrigger value="grades" className="flex items-center gap-2 mr-4">
            <School className="h-4 w-4" />
            <span>By Grade</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2 mr-4">
            <UserPlus className="h-4 w-4" />
            <span>By Section</span>
          </TabsTrigger>
          <TabsTrigger value="pods" className="flex items-center gap-2 mr-4">
            <Home className="h-4 w-4" />
            <span>By Pod</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>By Class</span>
          </TabsTrigger>
        </TabsList>

        {/* All Students Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>View and manage all students in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStudents ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No students found. Try adjusting your search or add new students.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Pod</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.username}</TableCell>
                        <TableCell>{student.gradeLevel || 'Not assigned'}</TableCell>
                        <TableCell>{student.section || 'Not assigned'}</TableCell>
                        <TableCell>
                          {student.podId ? (
                            <div className="flex items-center">
                              <div 
                                className="h-3 w-3 rounded-full mr-2" 
                                style={{ backgroundColor: pods?.find(p => p.id === student.podId)?.color || '#ccc' }}
                              />
                              <span>{pods?.find(p => p.id === student.podId)?.name || 'Unknown'}</span>
                            </div>
                          ) : (
                            'Not assigned'
                          )}
                        </TableCell>
                        <TableCell>
                          {student.classId ? (
                            <span>{classes?.find(c => c.id === student.classId)?.name || 'Unknown'}</span>
                          ) : (
                            'Not assigned'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditStudent(student)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Grade Tab */}
        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Students by Grade</CardTitle>
              <CardDescription>View students organized by grade level</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStudents ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : Object.keys(studentsByGrade).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No students found. Try adjusting your search or add new students.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(studentsByGrade)
                    .sort(([gradeA], [gradeB]) => {
                      if (gradeA === 'Unassigned') return 1;
                      if (gradeB === 'Unassigned') return -1;
                      return gradeA.localeCompare(gradeB);
                    })
                    .map(([grade, studentsInGrade]) => (
                      <div key={grade} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center">
                            <School className="h-5 w-5 mr-2 text-primary" />
                            Grade {grade}
                            <Badge className="ml-2">{studentsInGrade.length} students</Badge>
                          </h3>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Section</TableHead>
                              <TableHead>Pod</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentsInGrade
                              .filter(student => 
                                searchTerm === '' ||
                                student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                student.username.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map(student => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">
                                    {student.firstName} {student.lastName}
                                  </TableCell>
                                  <TableCell>{student.section || 'Not assigned'}</TableCell>
                                  <TableCell>
                                    {student.podId ? (
                                      <div className="flex items-center">
                                        <div 
                                          className="h-3 w-3 rounded-full mr-2" 
                                          style={{ backgroundColor: pods?.find(p => p.id === student.podId)?.color || '#ccc' }}
                                        />
                                        <span>{pods?.find(p => p.id === student.podId)?.name || 'Unknown'}</span>
                                      </div>
                                    ) : (
                                      'Not assigned'
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {student.classId ? (
                                      <span>{classes?.find(c => c.id === student.classId)?.name || 'Unknown'}</span>
                                    ) : (
                                      'Not assigned'
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleEditStudent(student)}
                                      className="flex items-center gap-1"
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit</span>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Section Tab */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Students by Section</CardTitle>
              <CardDescription>View students organized by classroom section</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStudents ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : Object.keys(studentsBySection).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No students found. Try adjusting your search or add new students.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(studentsBySection)
                    .sort(([sectionA], [sectionB]) => {
                      if (sectionA === 'Unassigned') return 1;
                      if (sectionB === 'Unassigned') return -1;
                      return sectionA.localeCompare(sectionB);
                    })
                    .map(([section, studentsInSection]) => (
                      <div key={section} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center">
                            <UserPlus className="h-5 w-5 mr-2 text-primary" />
                            Section {section}
                            <Badge className="ml-2">{studentsInSection.length} students</Badge>
                          </h3>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead>Pod</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentsInSection
                              .filter(student => 
                                searchTerm === '' ||
                                student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                student.username.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map(student => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">
                                    {student.firstName} {student.lastName}
                                  </TableCell>
                                  <TableCell>{student.gradeLevel || 'Not assigned'}</TableCell>
                                  <TableCell>
                                    {student.podId ? (
                                      <div className="flex items-center">
                                        <div 
                                          className="h-3 w-3 rounded-full mr-2" 
                                          style={{ backgroundColor: pods?.find(p => p.id === student.podId)?.color || '#ccc' }}
                                        />
                                        <span>{pods?.find(p => p.id === student.podId)?.name || 'Unknown'}</span>
                                      </div>
                                    ) : (
                                      'Not assigned'
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {student.classId ? (
                                      <span>{classes?.find(c => c.id === student.classId)?.name || 'Unknown'}</span>
                                    ) : (
                                      'Not assigned'
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleEditStudent(student)}
                                      className="flex items-center gap-1"
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit</span>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Pod Tab */}
        <TabsContent value="pods">
          <Card>
            <CardHeader>
              <CardTitle>Students by Pod</CardTitle>
              <CardDescription>View students organized by assigned pod</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStudents || isLoadingPods ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : Object.keys(studentsByPod).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No students found. Try adjusting your search or add new students.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(studentsByPod)
                    .sort(([podA], [podB]) => {
                      if (podA === 'Unassigned') return 1;
                      if (podB === 'Unassigned') return -1;
                      return podA.localeCompare(podB);
                    })
                    .map(([podName, studentsInPod]) => {
                      const pod = pods?.find(p => p.name === podName);
                      return (
                        <div key={podName} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                              {pod ? (
                                <div className="h-5 w-5 rounded-full mr-2" style={{ backgroundColor: pod.color }} />
                              ) : (
                                <Home className="h-5 w-5 mr-2 text-primary" />
                              )}
                              {podName}
                              <Badge className="ml-2">{studentsInPod.length} students</Badge>
                            </h3>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Section</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentsInPod
                                .filter(student => 
                                  searchTerm === '' ||
                                  student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.username.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(student => (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                      {student.firstName} {student.lastName}
                                    </TableCell>
                                    <TableCell>{student.gradeLevel || 'Not assigned'}</TableCell>
                                    <TableCell>{student.section || 'Not assigned'}</TableCell>
                                    <TableCell>
                                      {student.classId 
                                        ? classes?.find(c => c.id === student.classId)?.name || 'Unknown' 
                                        : 'Not assigned'}
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleEditStudent(student)}
                                        className="flex items-center gap-1"
                                      >
                                        <Edit className="h-4 w-4" />
                                        <span>Edit</span>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* By Class Tab */}
        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Students by Class</CardTitle>
              <CardDescription>View students organized by assigned class</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStudents || isLoadingClasses ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : Object.keys(studentsByClass).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No students found. Try adjusting your search or add new students.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(studentsByClass)
                    .sort(([classA], [classB]) => {
                      if (classA === 'Unassigned') return 1;
                      if (classB === 'Unassigned') return -1;
                      return classA.localeCompare(classB);
                    })
                    .map(([className, studentsInClass]) => {
                      const classObj = classes?.find(c => c.name === className);
                      const pod = classObj?.podId ? pods?.find(p => p.id === classObj.podId) : null;
                      
                      return (
                        <div key={className} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                              <FolderOpen className="h-5 w-5 mr-2 text-primary" />
                              {className}
                              <Badge className="ml-2">{studentsInClass.length} students</Badge>
                              
                              {pod && (
                                <div className="ml-3 flex items-center text-sm text-muted-foreground">
                                  <span>Pod:</span>
                                  <div 
                                    className="w-3 h-3 rounded-full mx-1" 
                                    style={{ backgroundColor: pod.color }}
                                  />
                                  <span>{pod.name}</span>
                                </div>
                              )}
                            </h3>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Section</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentsInClass
                                .filter(student => 
                                  searchTerm === '' ||
                                  student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.username.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(student => (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                      {student.firstName} {student.lastName}
                                    </TableCell>
                                    <TableCell>{student.gradeLevel || 'Not assigned'}</TableCell>
                                    <TableCell>{student.section || 'Not assigned'}</TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleEditStudent(student)}
                                        className="flex items-center gap-1"
                                      >
                                        <Edit className="h-4 w-4" />
                                        <span>Edit</span>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student Roster Assignment</DialogTitle>
            <DialogDescription>
              Update {editingStudent?.firstName} {editingStudent?.lastName}'s grade, section, pod, and class assignment.
            </DialogDescription>
          </DialogHeader>
          
          {editingStudent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade-level" className="text-right">
                  Grade Level
                </Label>
                <Input
                  id="grade-level"
                  value={editingStudent.gradeLevel || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, gradeLevel: e.target.value})}
                  placeholder="e.g. 8"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="section" className="text-right">
                  Section
                </Label>
                <Input
                  id="section"
                  value={editingStudent.section || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, section: e.target.value})}
                  placeholder="e.g. A"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pod" className="text-right">
                  Pod
                </Label>
                <Select
                  value={editingStudent.podId?.toString() || 'none'}
                  onValueChange={(value) => 
                    setEditingStudent({
                      ...editingStudent, 
                      podId: value && value !== 'none' ? parseInt(value) : null
                    })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a pod" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No pod assigned</SelectItem>
                    {pods?.map(pod => (
                      <SelectItem key={pod.id} value={pod.id.toString()}>
                        <div className="flex items-center">
                          <div 
                            className="h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: pod.color }}
                          />
                          <span>{pod.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  Class
                </Label>
                <Select
                  value={editingStudent.classId?.toString() || 'none'}
                  onValueChange={(value) => 
                    setEditingStudent({
                      ...editingStudent, 
                      classId: value && value !== 'none' ? parseInt(value) : null
                    })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No class assigned</SelectItem>
                    {classes?.map(classObj => (
                      <SelectItem key={classObj.id} value={classObj.id.toString()}>
                        <div className="flex items-center">
                          {classObj.podId && pods?.find(p => p.id === classObj.podId) ? (
                            <div 
                              className="h-3 w-3 rounded-full mr-2" 
                              style={{ backgroundColor: pods?.find(p => p.id === classObj.podId)?.color || '#ccc' }}
                            />
                          ) : null}
                          <span>{classObj.name}</span>
                          {classObj.gradeLevel ? (
                            <span className="ml-1 text-muted-foreground">
                              (Grade {classObj.gradeLevel})
                            </span>
                          ) : null}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges} 
              disabled={updateStudentRoster.isPending}
            >
              {updateStudentRoster.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}