import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import StudentList from '@/components/student/StudentList';
import StudentDetail from '@/components/student/StudentDetail';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, BehaviorPoint } from '@shared/schema';
import { Loader2 } from 'lucide-react';

export default function StudentPage() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const { data: students, isLoading: isLoadingStudents } = useQuery<Partial<User>[]>({
    queryKey: ['/api/users/role/student'],
    enabled: !!user && ['admin', 'teacher'].includes(user.role)
  });

  const { data: childStudents, isLoading: isLoadingChildren } = useQuery<Partial<User>[]>({
    queryKey: ['/api/users/students/parent/' + user?.id],
    enabled: !!user && user.role === 'parent'
  });

  const { data: selectedStudentPoints, isLoading: isLoadingPoints } = useQuery<BehaviorPoint[]>({
    queryKey: ['/api/behavior-points/student/' + selectedStudentId],
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <h2 className="font-heading font-semibold text-lg mb-4">
                      {user?.role === 'parent' ? 'My Children' : 'Student List'}
                    </h2>
                    <StudentList 
                      students={displayStudents}
                      selectedStudentId={selectedStudentId}
                      onSelectStudent={(id) => setSelectedStudentId(id)}
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  {selectedStudent ? (
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="behavior">Behavior Records</TabsTrigger>
                        <TabsTrigger value="rewards">Rewards</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-4">
                        <StudentDetail 
                          student={selectedStudent} 
                          points={selectedStudentPoints || []}
                          isLoading={isLoadingPoints}
                        />
                      </TabsContent>
                      
                      <TabsContent value="behavior" className="space-y-4">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                          <h3 className="font-heading font-semibold text-lg mb-4">Behavior History</h3>
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
                                    <tr key={point.id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                        {new Date(point.timestamp).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                        {/* Placeholder - would fetch category name in a real implementation */}
                                        Category ID: {point.categoryId}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-mono font-semibold ${
                                          point.points > 0 ? 'text-success' : 'text-error'
                                        }`}>
                                          {point.points > 0 ? `+${point.points}` : point.points}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                        {/* Placeholder - would fetch teacher name in a real implementation */}
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
                            <p className="text-neutral-dark">No behavior records found for this student.</p>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="rewards" className="space-y-4">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                          <h3 className="font-heading font-semibold text-lg mb-4">Reward Redemptions</h3>
                          <p className="text-neutral-dark">This functionality is coming soon.</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center h-64">
                      <p className="text-neutral-dark">Select a student to view their details</p>
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
