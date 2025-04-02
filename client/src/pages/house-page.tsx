import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { House, User } from '@shared/schema';
import { globalEventBus } from '@/lib/queryClient';
import { Loader2, ArrowLeft, Settings, Building, UserPlus, LineChart, Award } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HousePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Check which route we're on
  const [isHousesPath] = useRoute('/houses');
  const [isBasePath] = useRoute('/house');
  const [isDashboard] = useRoute('/house/dashboard');
  const [isPosters] = useRoute('/house/posters');
  const [isSetup] = useRoute('/house/setup');
  const [isOptions] = useRoute('/house/options');
  
  // State to force refetch
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Get houses data with refresh counter to force refetch
  const { data: houses, isLoading: isLoadingHouses, refetch: houseRefetch } = useQuery<House[]>({
    queryKey: ['/api/houses', refreshCounter],
    refetchInterval: 2000, // Refresh every 2 seconds to keep data in sync
  });
  
  // Define an interface for the top student data
  interface TopStudentData {
    houseId: number;
    houseName: string;
    houseColor: string;
    housePoints: number;
    topStudent: {
      id: number;
      firstName: string;
      lastName: string;
      totalPoints: number;
    } | null;
  }
  
  // Get top students for each house
  const { data: topStudentsByHouse, isLoading: isLoadingTopStudents } = useQuery<TopStudentData[]>({
    queryKey: ['/api/houses-top-students', refreshCounter],
    refetchInterval: 2000, // Refresh every 2 seconds to keep data in sync
  });
  
  // Subscribe to house-updated events to refresh data immediately
  useEffect(() => {
    // Subscribe to house-updated events
    const unsubscribe = globalEventBus.subscribe('house-updated', () => {
      // Increment refresh counter to trigger a refetch
      setRefreshCounter(prev => prev + 1);
      // Also do an explicit refetch for immediate update
      houseRefetch();
    });
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [houseRefetch]);

  // If we're on the /houses path, show the Houses list page
  if (isHousesPath) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-y-auto bg-neutral">
            <div className="p-4 md:p-8">
              <header className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-neutral-darker">Houses</h1>
                <p className="text-neutral-dark">View and manage house teams and competitions</p>
              </header>

              {isLoadingHouses ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : houses && houses.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {houses.map(house => (
                      <Card key={house.id} className="overflow-hidden">
                        <div className="h-2" style={{ backgroundColor: house.color }}></div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle>{house.name}</CardTitle>
                            <Badge variant="outline" className="font-mono">
                              {house.points} pts
                            </Badge>
                          </div>
                          <CardDescription>
                            {house.description || "No description available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLocation(`/house/dashboard?house=${house.id}`)}
                            >
                              View Details
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-primary"
                              onClick={() => setLocation(`/house/setup?house=${house.id}`)}
                            >
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>House Management</CardTitle>
                      <CardDescription>
                        Manage house settings and student assignments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Button 
                          variant="outline" 
                          className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                          onClick={() => setLocation('/house/dashboard')}
                        >
                          <LineChart className="h-8 w-8 text-primary" />
                          <span>Points Dashboard</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                          onClick={() => setLocation('/house/setup')}
                        >
                          <Building className="h-8 w-8 text-primary" />
                          <span>House Setup</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                          onClick={() => setLocation('/house/posters')}
                        >
                          <Award className="h-8 w-8 text-primary" />
                          <span>House Posters</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                          onClick={() => setLocation('/house/options')}
                        >
                          <Settings className="h-8 w-8 text-primary" />
                          <span>Options</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <p className="text-neutral-dark mb-4">No houses have been set up yet.</p>
                  <Button onClick={() => setLocation('/house/setup')}>
                    Set Up Houses
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <MobileNavbar />
      </div>
    );
  }

  // For other house-related routes, show the original layout
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is now provided globally in App.tsx */}
      <div className="pt-2 px-4">
        <button 
          onClick={() => setLocation('/houses')}
          className="p-2 hover:bg-gray-100 rounded-md flex items-center text-gray-700"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back to Houses</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 p-6">
        <div className="container mx-auto space-y-8">
          {isLoadingHouses ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Main navigation menu - only show on base path */}
              {(isBasePath) && (
                <>
                  {/* Dashboard Button */}
                  <div className="bg-blue-50 rounded-md p-4">
                    <button 
                      onClick={() => setLocation('/house/dashboard')}
                      className="w-full text-left flex items-center space-x-3 text-primary hover:text-primary-dark"
                    >
                      <span className="border border-blue-300 rounded p-2 bg-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                      </span>
                      <div>
                        <div className="font-semibold">Points Dashboard</div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Points Posters */}
                  <div className="bg-white border rounded-md p-4">
                    <button 
                      onClick={() => setLocation('/house/posters')}
                      className="w-full text-left flex items-center space-x-3 text-gray-700 hover:text-primary"
                    >
                      <span className="border border-gray-200 rounded p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="8" x2="8" y2="8"></line><line x1="16" y1="12" x2="8" y2="12"></line><line x1="16" y1="16" x2="8" y2="16"></line></svg>
                      </span>
                      <div>
                        <div className="font-semibold">Points Posters</div>
                      </div>
                    </button>
                  </div>
                  
                  {/* House Setup */}
                  <div className="bg-white border rounded-md p-4">
                    <button 
                      onClick={() => setLocation('/house/setup')}
                      className="w-full text-left flex items-center space-x-3 text-gray-700 hover:text-primary"
                    >
                      <span className="border border-gray-200 rounded p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </span>
                      <div>
                        <div className="font-semibold">House Setup</div>
                      </div>
                    </button>
                  </div>
                  
                  {/* House Options */}
                  <div className="bg-white border rounded-md p-4">
                    <button 
                      onClick={() => setLocation('/house/options')}
                      className="w-full text-left flex items-center space-x-3 text-gray-700 hover:text-primary"
                    >
                      <span className="border border-gray-200 rounded p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                      </span>
                      <div>
                        <div className="font-semibold">Options</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
              
              {/* Dashboard Content */}
              {isDashboard && (
                <div>
                  <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">House Points Dashboard</h2>
                      <button className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded">
                        Reset View
                      </button>
                    </div>
                    
                    {/* Colorful pods grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {houses?.map((house, index) => {
                        // Generate a vibrant color for each pod based on its index
                        const colors = [
                          'bg-gradient-to-br from-green-300 to-green-400',
                          'bg-gradient-to-br from-pink-400 to-pink-500',
                          'bg-gradient-to-br from-amber-300 to-amber-400',
                          'bg-gradient-to-br from-yellow-300 to-yellow-400',
                          'bg-gradient-to-br from-yellow-400 to-orange-400',
                          'bg-gradient-to-br from-blue-300 to-blue-400',
                          'bg-gradient-to-br from-red-400 to-red-500',
                          'bg-gradient-to-br from-lime-300 to-lime-400',
                          'bg-gradient-to-br from-purple-300 to-purple-400',
                          'bg-gradient-to-br from-teal-300 to-teal-400',
                          'bg-gradient-to-br from-cyan-300 to-cyan-400',
                          'bg-gradient-to-br from-amber-600 to-amber-700',
                        ];
                        
                        // Alternate colors based on index
                        const colorClass = colors[index % colors.length];
                        
                        return (
                          <div 
                            key={house.id} 
                            className={`${colorClass} rounded-lg shadow p-6 flex flex-col items-center justify-center text-center aspect-[3/2] transition-transform hover:scale-105 cursor-pointer`}
                          >
                            <div className="text-blue-900 font-bold text-3xl md:text-4xl lg:text-5xl mb-2">
                              {new Intl.NumberFormat().format(house.points)}
                            </div>
                            <div className="text-blue-900 font-medium">
                              {house.name}
                            </div>
                            {/* Show top student if available */}
                            {topStudentsByHouse && topStudentsByHouse.length > 0 && (
                              <>
                                {(() => {
                                  const houseData = topStudentsByHouse.find(h => h.houseId === house.id);
                                  if (houseData?.topStudent) {
                                    return (
                                      <div className="mt-2 flex flex-col items-center">
                                        <div className="text-xs uppercase text-blue-900/70 font-semibold">Top Student</div>
                                        <div className="text-blue-900 font-medium">
                                          {houseData.topStudent.firstName} {houseData.topStudent.lastName.charAt(0)}.
                                        </div>
                                        <div className="text-xs text-blue-900/70">
                                          {houseData.topStudent.totalPoints} pts
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Posters Content */}
              {isPosters && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Points Posters</h2>
                  <p className="text-gray-600 mb-4">Generate and print house points posters for your classroom or school.</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {houses?.map(house => (
                      <div key={house.id} className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2" style={{ color: house.color }}>{house.name}</h3>
                        <div className="bg-gray-100 h-40 flex items-center justify-center rounded mb-3">
                          <p className="text-gray-400">Poster Preview</p>
                        </div>
                        <button className="w-full py-2 rounded bg-primary text-white hover:bg-primary-dark">
                          Download Poster
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Setup Content */}
              {isSetup && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">House Setup</h2>
                  
                  <div className="space-y-6">
                    {houses?.map(house => (
                      <div key={house.id} className="border rounded-lg p-4 relative">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 rounded-full mr-4" style={{ backgroundColor: house.color }}></div>
                          <div>
                            <h3 className="text-lg font-semibold">{house.name}</h3>
                            <p className="text-sm text-gray-500">{house.description || 'No description'}</p>
                          </div>
                          <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                            <Settings size={18} />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">Students: <span className="font-semibold">24</span></div>
                          <button className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center gap-1">
                            <UserPlus size={14} />
                            <span>Assign Students</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Options Content */}
              {isOptions && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">House Options</h2>
                  
                  <div className="space-y-4">
                    <div className="border p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Display Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <input type="checkbox" id="showPoints" className="mr-2" />
                          <label htmlFor="showPoints">Show points on public displays</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="showRankings" className="mr-2" />
                          <label htmlFor="showRankings">Show house rankings</label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Point Settings</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label>Points reset period:</label>
                          <select className="border rounded p-1 w-48">
                            <option>Never (Continuous)</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                            <option>Termly</option>
                            <option>Yearly</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <label>Next reset date:</label>
                          <input type="date" className="border rounded p-1 w-48" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline">Cancel</Button>
                      <Button>Save Changes</Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}