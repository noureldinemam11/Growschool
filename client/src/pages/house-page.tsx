import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import HouseCard from '@/components/houses/HouseCard';
import HouseLeaderboard from '@/components/houses/HouseLeaderboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { House, User } from '@shared/schema';
import { Loader2 } from 'lucide-react';

export default function HousePage() {
  const { user } = useAuth();
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null);

  const { data: houses, isLoading: isLoadingHouses } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });

  const { data: houseStudents, isLoading: isLoadingStudents } = useQuery<Partial<User>[]>({
    queryKey: ['/api/users/students/house/' + selectedHouseId],
    enabled: !!selectedHouseId
  });

  // Auto-select first house when data loads or user's house if they're a student
  if (houses?.length && !selectedHouseId) {
    if (user?.role === 'student' && user.houseId) {
      setSelectedHouseId(user.houseId);
    } else {
      setSelectedHouseId(houses[0].id);
    }
  }

  const selectedHouse = houses?.find(h => h.id === selectedHouseId);
  
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-y-auto bg-neutral">
          <div className="p-4 md:p-8">
            <header className="mb-6">
              <h1 className="text-2xl font-heading font-bold text-neutral-darker">Houses</h1>
              <p className="text-neutral-dark">Track house points and competition standings</p>
            </header>

            {isLoadingHouses ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : houses && houses.length > 0 ? (
              <div className="space-y-6">
                <HouseLeaderboard houses={houses} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {houses.map(house => (
                    <HouseCard 
                      key={house.id}
                      house={house}
                      isSelected={house.id === selectedHouseId}
                      onClick={() => setSelectedHouseId(house.id)}
                    />
                  ))}
                </div>
                
                {selectedHouse && (
                  <div className="bg-white rounded-lg shadow-sm">
                    <Tabs defaultValue="overview" className="w-full">
                      <div className="border-b px-6 pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div className="flex items-center mb-4 md:mb-0">
                            <div className="w-12 h-12 rounded-full" style={{ backgroundColor: selectedHouse.color }}></div>
                            <div className="ml-4">
                              <h2 className="text-xl font-heading font-bold text-neutral-darker">{selectedHouse.name} House</h2>
                              <p className="text-neutral-dark text-sm">{selectedHouse.description || 'No description available'}</p>
                            </div>
                          </div>
                          <div className="text-center md:text-right">
                            <div className="text-xs text-neutral-dark">Total Points</div>
                            <div className="text-3xl font-mono font-bold text-primary">{selectedHouse.points.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <TabsList className="mb-0">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="members">Members</TabsTrigger>
                          <TabsTrigger value="history">Point History</TabsTrigger>
                        </TabsList>
                      </div>
                      
                      <TabsContent value="overview" className="p-6 space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>House Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <div className="text-neutral-dark text-sm mb-1">House Name</div>
                                <div className="font-medium">{selectedHouse.name}</div>
                              </div>
                              <div>
                                <div className="text-neutral-dark text-sm mb-1">House Color</div>
                                <div className="flex items-center">
                                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: selectedHouse.color }}></div>
                                  <span className="font-medium">{selectedHouse.color}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-neutral-dark text-sm mb-1">Total Points</div>
                                <div className="font-medium font-mono">{selectedHouse.points.toLocaleString()}</div>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="text-neutral-dark text-sm mb-1">Description</div>
                              <div className="font-medium">{selectedHouse.description || 'No description available'}</div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>House Achievements</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-neutral-dark">Achievements will be displayed here.</p>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="members" className="p-6">
                        {isLoadingStudents ? (
                          <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : houseStudents && houseStudents.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-neutral">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Student</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Grade</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Section</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {houseStudents.map(student => (
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
                                      {student.gradeLevel || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                      {student.section || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-neutral-dark">No students assigned to this house.</p>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="history" className="p-6">
                        <p className="text-neutral-dark">Point history will be available soon.</p>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-neutral-dark">No houses found in the system.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <MobileNavbar />
    </div>
  );
}
