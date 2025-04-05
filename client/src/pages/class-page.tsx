import { useState } from 'react';
// Directly importing component paths to avoid module resolution issues
import ClassManagement from '../components/admin/ClassManagement';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Loader2, User, School, Bookmark, Users } from 'lucide-react';
import { Class, User as UserType } from '@shared/schema';
import { Badge } from "@/components/ui/badge";
import StudentClassAssignment from '../components/admin/StudentClassAssignment';

export default function ClassPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('class-management');

  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  const { data: teachers, isLoading: isLoadingTeachers } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/teacher'],
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/student'],
  });

  // Count students with each class
  const classStudents = students?.reduce((acc, student) => {
    if (student.classId) {
      acc[student.classId] = (acc[student.classId] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>) || {};

  const isLoading = isLoadingClasses || isLoadingTeachers || isLoadingStudents;

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You need administrator privileges to access this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Class Management</h1>
        <p className="text-muted-foreground">
          Manage classes, assign teachers, and organize students
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <School className="h-5 w-5 text-primary" />
                  Classes
                </CardTitle>
                <CardDescription>Total number of classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{classes?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Teachers
                </CardTitle>
                <CardDescription>Total number of teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{teachers?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Students
                </CardTitle>
                <CardDescription>Total number of students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{students?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="class-management" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="class-management">Class Management</TabsTrigger>
              <TabsTrigger value="student-assignment">Student Assignment</TabsTrigger>
              <TabsTrigger value="class-overview">Class Overview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="class-management">
              <ClassManagement />
            </TabsContent>
            
            <TabsContent value="student-assignment">
              <StudentClassAssignment />
            </TabsContent>
            
            <TabsContent value="class-overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes && classes.length > 0 ? (
                  classes.map((classItem) => (
                    <Card key={classItem.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 bg-primary/5 border-b">
                        <div className="flex justify-between items-start">
                          <CardTitle>{classItem.name}</CardTitle>
                          <Badge variant="outline" className="bg-background">
                            Grade {classItem.gradeLevel}-{classItem.section}
                          </Badge>
                        </div>
                        <CardDescription>
                          {classItem.academicYear}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                              <Users className="h-4 w-4" /> Students
                            </h4>
                            <p className="text-2xl font-bold">{classStudents[classItem.id] || 0}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">
                              {classItem.description || 'No description provided'}
                            </p>
                          </div>
                          
                          <div className="pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setActiveTab('student-assignment');
                              }}
                            >
                              Manage Students
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full">
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle>No Classes Found</CardTitle>
                        <CardDescription>
                          There are no classes in the system yet. Go to the Class Management tab to create some.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}