import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, UserPlus, UsersRound, School, Home, Edit } from 'lucide-react';
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
  houseId: number | null;
}

interface House {
  id: number;
  name: string;
  color: string;
  description: string | null;
  logoUrl: string | null;
  points: number;
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
    queryKey: ['/api/users/students'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch houses
  const { data: houses, isLoading: isLoadingHouses } = useQuery<House[]>({
    queryKey: ['/api/houses'],
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

  // Group students by house
  const studentsByHouse = students
    ? students.reduce<Record<string, Student[]>>((acc, student) => {
        const house = student.houseId
          ? houses?.find(h => h.id === student.houseId)?.name || 'Unknown'
          : 'Unassigned';
        if (!acc[house]) {
          acc[house] = [];
        }
        acc[house].push(student);
        return acc;
      }, {})
    : {};

  // Update student roster mutation
  const updateStudentRoster = useMutation({
    mutationFn: async (values: { studentId: number; gradeLevel?: string; section?: string; houseId?: number | null }) => {
      const { studentId, ...data } = values;
      const res = await apiRequest('PATCH', `/api/users/students/${studentId}/roster`, data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/users/students'] });
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
      houseId: editingStudent.houseId,
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
          <p className="text-muted-foreground">Manage student assignments to grades, sections, and houses</p>
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
          <TabsTrigger value="houses" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>By House</span>
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
                      <TableHead>House</TableHead>
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
                          {student.houseId ? (
                            <div className="flex items-center">
                              <div 
                                className="h-3 w-3 rounded-full mr-2" 
                                style={{ backgroundColor: houses?.find(h => h.id === student.houseId)?.color || '#ccc' }}
                              />
                              <span>{houses?.find(h => h.id === student.houseId)?.name || 'Unknown'}</span>
                            </div>
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
                              <TableHead>House</TableHead>
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
                                    {student.houseId ? (
                                      <div className="flex items-center">
                                        <div 
                                          className="h-3 w-3 rounded-full mr-2" 
                                          style={{ backgroundColor: houses?.find(h => h.id === student.houseId)?.color || '#ccc' }}
                                        />
                                        <span>{houses?.find(h => h.id === student.houseId)?.name || 'Unknown'}</span>
                                      </div>
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
                              <TableHead>House</TableHead>
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
                                    {student.houseId ? (
                                      <div className="flex items-center">
                                        <div 
                                          className="h-3 w-3 rounded-full mr-2" 
                                          style={{ backgroundColor: houses?.find(h => h.id === student.houseId)?.color || '#ccc' }}
                                        />
                                        <span>{houses?.find(h => h.id === student.houseId)?.name || 'Unknown'}</span>
                                      </div>
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

        {/* By House Tab */}
        <TabsContent value="houses">
          <Card>
            <CardHeader>
              <CardTitle>Students by House</CardTitle>
              <CardDescription>View students organized by assigned house</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStudents || isLoadingHouses ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : Object.keys(studentsByHouse).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No students found. Try adjusting your search or add new students.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(studentsByHouse)
                    .sort(([houseA], [houseB]) => {
                      if (houseA === 'Unassigned') return 1;
                      if (houseB === 'Unassigned') return -1;
                      return houseA.localeCompare(houseB);
                    })
                    .map(([houseName, studentsInHouse]) => {
                      const house = houses?.find(h => h.name === houseName);
                      return (
                        <div key={houseName} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                              {house ? (
                                <div className="h-5 w-5 rounded-full mr-2" style={{ backgroundColor: house.color }} />
                              ) : (
                                <Home className="h-5 w-5 mr-2 text-primary" />
                              )}
                              {houseName}
                              <Badge className="ml-2">{studentsInHouse.length} students</Badge>
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
                              {studentsInHouse
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
              Update {editingStudent?.firstName} {editingStudent?.lastName}'s grade, section, and house assignment.
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
                <Label htmlFor="house" className="text-right">
                  House
                </Label>
                <Select
                  value={editingStudent.houseId?.toString() || ''}
                  onValueChange={(value) => 
                    setEditingStudent({
                      ...editingStudent, 
                      houseId: value ? parseInt(value) : null
                    })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a house" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No house assigned</SelectItem>
                    {houses?.map(house => (
                      <SelectItem key={house.id} value={house.id.toString()}>
                        <div className="flex items-center">
                          <div 
                            className="h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: house.color }}
                          />
                          <span>{house.name}</span>
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