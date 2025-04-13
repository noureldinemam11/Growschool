import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import StudentList from '@/components/student/StudentList';
import StudentDetail from '@/components/student/StudentDetail';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User as UserType, BehaviorPoint, RewardRedemption } from '@shared/schema';
import { Loader2, Gift, UserCircle, FileText, Award, Calendar, Filter, Plus } from 'lucide-react';

export default function StudentPage() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  // Parse the student ID from the URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('id');
    if (studentId) {
      setSelectedStudentId(Number(studentId));
    }
  }, []);

  const { data: students, isLoading: isLoadingStudents } = useQuery<Partial<UserType>[]>({
    queryKey: ['/api/users/role/student'],
    enabled: !!user && ['admin', 'teacher'].includes(user.role)
  });

  const { data: childStudents, isLoading: isLoadingChildren } = useQuery<Partial<UserType>[]>({
    queryKey: ['/api/users/students/parent/' + user?.id],
    enabled: !!user && user.role === 'parent'
  });

  const { data: selectedStudentPoints, isLoading: isLoadingPoints } = useQuery<BehaviorPoint[]>({
    queryKey: ['/api/behavior-points/student/' + selectedStudentId],
    enabled: !!selectedStudentId
  });

  // Fetch student's reward redemptions
  const { data: redemptions, isLoading: isLoadingRedemptions } = useQuery<any[]>({
    queryKey: ['/api/rewards/redemptions/student/' + selectedStudentId],
    enabled: !!selectedStudentId
  });

  // If parent, show their children, otherwise show all students (for teachers/admins)
  const displayStudents = user?.role === 'parent' ? childStudents : students;
  const isLoading = user?.role === 'parent' ? isLoadingChildren : isLoadingStudents;

  // Auto-select first student when data loads
  if (displayStudents?.length && !selectedStudentId) {
    setSelectedStudentId(displayStudents[0].id!);
  }

  // Filter for selected student
  const selectedStudent = displayStudents?.find(s => s.id === selectedStudentId);

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-y-auto bg-neutral">
          <div className="p-4 md:p-8">
            <header className="mb-6">
              <h1 className="text-2xl font-heading font-bold text-neutral-darker">Students</h1>
              <p className="text-neutral-dark">
                {user?.role === 'teacher' || user?.role === 'admin' ? 
                  'View and manage student behavior records' : 
                  'Monitor your children\'s behavior and achievements'}
              </p>
            </header>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayStudents && displayStudents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <h2 className="font-heading font-semibold text-lg mb-4">
                      {user?.role === 'parent' ? 'My Children' : 'Student Directory'}
                    </h2>
                    <StudentList 
                      students={displayStudents}
                      selectedStudentId={selectedStudentId}
                      onSelectStudent={(id) => setSelectedStudentId(id)}
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  {selectedStudent ? (
                    <Tabs defaultValue="overview" className="w-full">
                      <div className="bg-white rounded-lg p-2 mb-4">
                        <TabsList className="flex w-full h-10 items-center justify-start p-1 border-0 mb-0 bg-neutral/20 rounded-md">
                          <TabsTrigger value="overview" className="flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md border-0 data-[state=active]:border-0 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <UserCircle className="h-4 w-4 mr-1.5" />
                            <span>Overview</span>
                          </TabsTrigger>
                          <TabsTrigger value="behavior" className="flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md border-0 data-[state=active]:border-0 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <FileText className="h-4 w-4 mr-1.5" />
                            <span>Behavior Records</span>
                          </TabsTrigger>
                          <TabsTrigger value="rewards" className="flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md border-0 data-[state=active]:border-0 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Award className="h-4 w-4 mr-1.5" />
                            <span>Rewards</span>
                          </TabsTrigger>
                        </TabsList>
                      </div>
                      
                      <TabsContent value="overview" className="space-y-4 mt-0">
                        <StudentDetail 
                          student={selectedStudent} 
                          points={selectedStudentPoints || []}
                          isLoading={isLoadingPoints}
                        />
                      </TabsContent>
                      
                      <TabsContent value="behavior" className="space-y-4 mt-0">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                            <h3 className="font-heading font-semibold text-lg">Behavior History</h3>
                            
                            {/* Behavior history filters */}
                            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                              <Button variant="outline" size="sm" className="h-8">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                This Semester
                              </Button>
                              <Button variant="outline" size="sm" className="h-8">
                                <Filter className="h-3.5 w-3.5 mr-1" />
                                All Types
                              </Button>
                            </div>
                          </div>
                          
                          {isLoadingPoints ? (
                            <div className="flex items-center justify-center h-32">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : selectedStudentPoints && selectedStudentPoints.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-neutral">
                                  <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Category</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Points</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Teacher</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Notes</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {selectedStudentPoints.map(point => (
                                    <tr key={point.id} className={point.points > 0 ? 'bg-green-50/30' : point.points < 0 ? 'bg-red-50/30' : ''}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                        {new Date(point.timestamp).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                        {/* We'll use the useQuery hook to get categories later */}
                                        Category ID: {point.categoryId}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-mono font-semibold ${
                                          point.points > 0 ? 'text-success' : 'text-error'
                                        }`}>
                                          {point.points}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                        {/* We'll use the useQuery hook to get teachers later */}
                                        Teacher ID: {point.teacherId}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-neutral-darker">
                                        {point.notes || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center h-32">
                              <FileText className="h-10 w-10 text-gray-300 mb-2" />
                              <p className="text-neutral-dark">No behavior records found for this student.</p>
                              {user?.role === 'teacher' || user?.role === 'admin' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-3"
                                  onClick={() => {
                                    localStorage.setItem('batchSelectedStudentIds', JSON.stringify([selectedStudent.id]));
                                    window.location.href = '/points';
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Add First Record
                                </Button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="rewards" className="space-y-4 mt-0">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                            <h3 className="font-heading font-semibold text-lg">Reward Redemptions</h3>
                            
                            {/* Rewards history filters */}
                            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                              <Button variant="outline" size="sm" className="h-8">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                All Time
                              </Button>
                              <Button variant="outline" size="sm" className="h-8">
                                <Filter className="h-3.5 w-3.5 mr-1" />
                                All Status
                              </Button>
                            </div>
                          </div>
                          
                          {isLoadingRedemptions ? (
                            <div className="flex items-center justify-center h-32">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : redemptions && redemptions.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-neutral">
                                  <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Reward</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Points Spent</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {redemptions.map(redemption => (
                                    <tr key={redemption.id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                        {new Date(redemption.timestamp).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-neutral-darker">
                                          {redemption.reward?.name || 'Unnamed Reward'}
                                        </div>
                                        <div className="text-xs text-neutral-dark">
                                          {redemption.reward?.description || 'No description'}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-primary">
                                        {redemption.pointsSpent}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge className={
                                          redemption.status === 'approved' ? 'bg-success text-white' :
                                          redemption.status === 'delivered' ? 'bg-accent text-white' :
                                          'bg-secondary'
                                        }>
                                          {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-8 gap-3">
                              <Gift className="h-12 w-12 text-gray-300" />
                              <p className="text-neutral-dark">No reward redemptions found for this student.</p>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => {
                                  window.location.href = '/rewards';
                                }}
                              >
                                <Award className="h-3.5 w-3.5 mr-1" />
                                View Available Rewards
                              </Button>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center h-64 text-center">
                      <UserCircle className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-neutral-dark mb-2">Select a student to view their details</p>
                      <p className="text-xs text-muted-foreground">
                        You can filter and search for students in the directory on the left
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-neutral-dark">
                  {user?.role === 'parent' 
                    ? "You don't have any children registered in the system."
                    : "No students found in the system."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <MobileNavbar />
    </div>
  );
}
