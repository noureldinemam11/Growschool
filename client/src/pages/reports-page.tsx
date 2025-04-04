import { useState, FC } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import BehaviorChart from '@/components/reports/BehaviorChart';
import PointsDistributionChart from '@/components/reports/PointsDistributionChart';
import BehaviorAnalytics from '@/components/analytics/BehaviorAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BehaviorPoint, House, User } from '@shared/schema';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Display student points (simplified version to avoid any issues)
function StudentPoints({ studentId }: { studentId: number | undefined }) {
  if (!studentId) return <span>-</span>;
  
  // Fetch behavior points instead of balance to reduce complexity
  const { data: points, isLoading } = useQuery<BehaviorPoint[]>({
    queryKey: [`/api/behavior-points/student/${studentId}`],
    enabled: !!studentId,
  });
  
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin inline-block" />;
  }
  
  // Sum up all the points
  const total = points?.reduce((sum, point) => sum + point.points, 0) || 0;
  return <span>{total}</span>;
}

// Simple component to display house information
function StudentHouse({ houseId }: { houseId: number }) {
  const { data: houses } = useQuery<House[]>({
    queryKey: ['/api/houses'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  if (!houses) return <span>House #{houseId}</span>;
  
  const house = houses.find(h => h.id === houseId);
  if (!house) return <span>House #{houseId}</span>;
  
  return (
    <div className="flex items-center">
      <div 
        className="w-3 h-3 rounded-full mr-2" 
        style={{ backgroundColor: house.color }}
      ></div>
      <span>{house.name}</span>
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<string>("week");
  const [reportType, setReportType] = useState<string>("behavior");
  
  const { data: behaviorPoints, isLoading: isLoadingPoints } = useQuery<BehaviorPoint[]>({
    queryKey: ['/api/behavior-points/recent?limit=1000'],
    enabled: !!user && ['admin', 'teacher'].includes(user.role)
  });

  // State to force refetch
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  const { data: houses, isLoading: isLoadingHouses } = useQuery<House[]>({
    queryKey: ['/api/houses', refreshCounter],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: teacherPoints, isLoading: isLoadingTeacherPoints } = useQuery<BehaviorPoint[]>({
    queryKey: ['/api/behavior-points/teacher/' + user?.id],
    enabled: !!user && user.role === 'teacher'
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<Partial<User>[]>({
    queryKey: ['/api/users/role/student'],
    enabled: !!user && ['admin', 'teacher'].includes(user.role)
  });

  // Display appropriate data based on user role
  const displayPoints = user?.role === 'teacher' ? teacherPoints : behaviorPoints;
  const isLoading = user?.role === 'teacher' ? isLoadingTeacherPoints : isLoadingPoints;

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-y-auto bg-neutral">
          <div className="p-4 md:p-8">
            <header className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-heading font-bold text-neutral-darker">Reports</h1>
                  <p className="text-neutral-dark">
                    {user?.role === 'admin' 
                      ? 'School-wide behavior data and analytics' 
                      : user?.role === 'teacher'
                      ? 'Track behavior trends and student performance'
                      : 'Monitor progress and achievements'}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Download className="h-4 w-4 mr-1" /> Export
                  </Button>
                </div>
              </div>
            </header>

            {['admin', 'teacher'].includes(user?.role || '') ? (
              <Tabs defaultValue="behavior" value={reportType} onValueChange={setReportType} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="behavior">Behavior Analytics</TabsTrigger>
                  <TabsTrigger value="houses">House Competition</TabsTrigger>
                  <TabsTrigger value="students">Student Performance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="behavior" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Points Awarded vs. Deducted</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        {isLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : displayPoints ? (
                          <BehaviorChart points={displayPoints} timeframe={timeframe} />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-neutral-dark">No data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Points by Category</CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        {isLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : displayPoints ? (
                          <PointsDistributionChart points={displayPoints} />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-neutral-dark">No data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-6">
                    <BehaviorAnalytics />
                  </div>
                </TabsContent>
                
                <TabsContent value="houses" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>House Points Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      {isLoadingHouses ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : houses && houses.length > 0 ? (
                        <div className="space-y-4">
                          {houses.map(house => (
                            <div key={house.id} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div 
                                    className="w-4 h-4 rounded-full mr-2" 
                                    style={{ backgroundColor: house.color }}
                                  ></div>
                                  <span className="font-medium">{house.name}</span>
                                </div>
                                <span className="font-mono">{house.points.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-neutral-light rounded-full h-2.5">
                                <div 
                                  className="h-2.5 rounded-full" 
                                  style={{ 
                                    width: `${(house.points / Math.max(...houses.map(h => h.points))) * 100}%`,
                                    backgroundColor: house.color 
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-neutral-dark">No houses available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>House Points Over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <div className="flex items-center justify-center h-full">
                        <p className="text-neutral-dark">Historical house data will be available soon.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="students" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingStudents ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : students && students.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-neutral">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Student</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Grade</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">House</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Points</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {/* We would normally calculate total points per student here */}
                              {students.slice(0, 10).map((student, index) => (
                                <tr key={student.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="h-8 w-8 rounded-full bg-neutral-light flex items-center justify-center">
                                        <span className="font-semibold text-neutral-dark">
                                          {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-neutral-darker">
                                          {student.firstName} {student.lastName}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                    {student.gradeLevel}{student.section}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                    {student.houseId ? <StudentHouse houseId={student.houseId} /> : <span>-</span>}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-primary">
                                    {student.id && <StudentPoints studentId={student.id} />}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-neutral-dark">No student data available.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              // Student/Parent view
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-dark">Personal performance reports will be available soon.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Progress Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-dark">Timeline of behavior and achievements will be available soon.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <MobileNavbar />
    </div>
  );
}
