import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Pod, User } from '@shared/schema';
import { globalEventBus } from '@/lib/queryClient';
import { Loader2, ArrowLeft, Settings, Building, UserPlus, LineChart, Award, Maximize2, Minimize2 } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClassDashboardCard from '@/components/class/ClassDashboardCard';

export default function PodPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Check which route we're on
  const [isPodsPath] = useRoute('/pods');
  const [isBasePath] = useRoute('/pod');
  const [isDashboard] = useRoute('/pod/dashboard');
  const [isPosters] = useRoute('/pod/posters');
  const [isSetup] = useRoute('/pod/setup');
  const [isOptions] = useRoute('/pod/options');
  
  // State to force refetch
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // State for fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Add ESC key handler for exiting fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);
  
  // Get pods data with refresh counter to force refetch
  const { data: pods, isLoading: isLoadingPods, refetch: podRefetch } = useQuery<Pod[]>({
    queryKey: ['/api/pods', refreshCounter],
    refetchInterval: 2000, // Refresh every 2 seconds to keep data in sync
  });
  
  // State for classes in the selected pod
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [classPoints, setClassPoints] = useState<Record<number, number>>({});
  const [isLoadingClassPoints, setIsLoadingClassPoints] = useState(true);
  
  // Get pod ID from URL query params
  const params = new URLSearchParams(window.location.search);
  const podId = params.get('pod') ? parseInt(params.get('pod') as string) : null;
      
  // Get the selected pod, if any
  const selectedPod = podId && pods ? pods.find(p => p.id === podId) : null;
  
  // Fetch classes for the selected pod
  useEffect(() => {
    if (podId) {
      setIsLoadingClasses(true);
      console.log(`Fetching classes for pod ID: ${podId}`);
      
      fetch(`/api/classes?podId=${podId}`)
        .then(res => res.json())
        .then(data => {
          console.log(`Received ${data.length} classes, filtering for pod ${podId}:`, data);
          // Filter classes to only include those from the selected pod
          const filteredClasses = data.filter((classItem: { podId: number }) => classItem.podId === podId);
          console.log(`Filtered to ${filteredClasses.length} classes for pod ${podId}:`, filteredClasses);
          setClasses(filteredClasses);
          setIsLoadingClasses(false);
        })
        .catch(err => {
          console.error("Error fetching classes for pod:", err);
          setIsLoadingClasses(false);
        });
    } else {
      // Reset classes if no pod is selected
      setClasses([]);
    }
  }, [podId]);
  
  // Fetch class points
  useEffect(() => {
    if (classes.length > 0) {
      setIsLoadingClassPoints(true);
      // Fetch class points from API
      fetch(`/api/classes/points`)
        .then(res => res.json())
        .then(data => {
          setClassPoints(data);
          setIsLoadingClassPoints(false);
        })
        .catch(err => {
          console.error("Error fetching class points:", err);
          setIsLoadingClassPoints(false);
        });
    }
  }, [classes]);
  
  // Define an interface for the top student data
  interface TopStudentData {
    podId: number;
    podName: string;
    podColor: string;
    podPoints: number;
    topStudent: {
      id: number;
      firstName: string;
      lastName: string;
      totalPoints: number;
    } | null;
  }
  
  // Get top students for each pod
  const { data: topStudentsByPod, isLoading: isLoadingTopStudents } = useQuery<TopStudentData[]>({
    queryKey: ['/api/pods-top-students', refreshCounter],
    refetchInterval: 2000, // Refresh every 2 seconds to keep data in sync
  });
  
  // Subscribe to pod-updated events to refresh data immediately
  useEffect(() => {
    // Subscribe to pod-updated events
    const unsubscribe = globalEventBus.subscribe('pod-updated', () => {
      // Increment refresh counter to trigger a refetch
      setRefreshCounter(prev => prev + 1);
      // Also do an explicit refetch for immediate update
      podRefetch();
    });
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [podRefetch]);
  


  // If we're on the /pods path, show the Pods list page
  if (isPodsPath) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-y-auto bg-neutral">
            <div className="p-4 md:p-8">
              <header className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-neutral-darker">Pods</h1>
                <p className="text-neutral-dark">View and manage pod teams and competitions</p>
              </header>

              {isLoadingPods ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pods && pods.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pods.map(pod => (
                      <Card key={pod.id} className="overflow-hidden">
                        <div className="h-2" style={{ backgroundColor: pod.color }}></div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle>{pod.name}</CardTitle>
                            <Badge variant="outline" className="font-mono">
                              {pod.points} pts
                            </Badge>
                          </div>
                          <CardDescription>
                            {pod.description || "No description available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLocation(`/pod/dashboard?pod=${pod.id}`)}
                            >
                              View Details
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-primary"
                              onClick={() => setLocation(`/pod/setup?pod=${pod.id}`)}
                            >
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <p className="text-neutral-dark mb-4">No pods have been set up yet.</p>
                  <Button onClick={() => setLocation('/pod/setup')}>
                    Set Up Pods
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

  // For other pod-related routes, show the original layout
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is now provided globally in App.tsx */}

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 p-6">
        <div className="container mx-auto space-y-8">
          {isLoadingPods ? (
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
                      onClick={() => setLocation('/pods')}
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
                      onClick={() => setLocation('/pod/posters')}
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
                  
                  {/* Pod Setup */}
                  <div className="bg-white border rounded-md p-4">
                    <button 
                      onClick={() => setLocation('/pod/setup')}
                      className="w-full text-left flex items-center space-x-3 text-gray-700 hover:text-primary"
                    >
                      <span className="border border-gray-200 rounded p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </span>
                      <div>
                        <div className="font-semibold">Pod Setup</div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Options button removed as requested */}
                </>
              )}
              
              {/* Dashboard Content */}
              {isDashboard && (
                <div className={isFullscreen ? "fixed inset-0 z-50 bg-slate-50 overflow-auto p-6" : ""}>
                  <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <div className="mb-6">
                      {/* Header with back button and title */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          {isFullscreen && (
                            <div className="fixed top-0 left-0 right-0 bg-primary text-white py-2 px-4 z-[60] flex items-center">
                              <button 
                                onClick={() => {
                                  setIsFullscreen(false);
                                  // Stay on the same page, just exit fullscreen
                                }}
                                className="flex items-center text-white hover:bg-primary/80 font-medium"
                              >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                <span>Back</span>
                              </button>
                            </div>
                          )}
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                              Classes Dashboard
                              {selectedPod && (
                                <div 
                                  className="ml-3 px-3 py-1 rounded-full text-white text-sm font-medium" 
                                  style={{ backgroundColor: selectedPod.color }}
                                >
                                  {selectedPod.name}
                                </div>
                              )}
                            </h2>
                            {selectedPod && (
                              <p className="text-gray-600 mt-1">{selectedPod.description || "No pod description available"}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select 
                            className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm"
                            defaultValue="thisWeek"
                          >
                            <option value="today">Today</option>
                            <option value="thisWeek">This Week</option>
                            <option value="thisMonth">This Month</option>
                            <option value="allTime">All Time</option>
                          </select>
                          <button 
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 rounded-full hover:bg-gray-100"
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                          >
                            {isFullscreen ? 
                              <Minimize2 className="h-5 w-5 text-gray-700" /> : 
                              <Maximize2 className="h-5 w-5 text-gray-700" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Pod stats summary */}
                      {selectedPod && (
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500">Total Pod Points</p>
                            <p className="text-2xl font-bold" style={{ color: selectedPod.color }}>
                              {selectedPod.points}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500">Classes</p>
                            <p className="text-2xl font-bold text-gray-800">{classes.length}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500">Pod Rank</p>
                            <p className="text-2xl font-bold text-gray-800">
                              {pods ? (pods.findIndex(p => p.id === selectedPod.id) + 1) : 0}/{pods?.length || 0}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Legend for colors */}
                      <div className="mt-4 bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm font-medium mb-2">Class Rankings</p>
                        <div className="flex items-center flex-wrap gap-3">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-[#00D1B2] mr-1"></div>
                            <span className="text-xs">1st Place</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-[#FF69B4] mr-1"></div>
                            <span className="text-xs">2nd Place</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-[#FFCC00] mr-1"></div>
                            <span className="text-xs">3rd & 4th Place</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-[#FFA500] mr-1"></div>
                            <span className="text-xs">5th Place</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bar chart container for classes */}
                    <div className="bg-slate-50 p-4 rounded-lg relative overflow-hidden">
                      {/* Grid lines */}
                      <div className="absolute inset-0 pt-16 pb-8">
                        <div className="h-1/4 border-t border-gray-200"></div>
                        <div className="h-1/4 border-t border-gray-200"></div>
                        <div className="h-1/4 border-t border-gray-200"></div>
                        <div className="h-1/4 border-t border-gray-200"></div>
                      </div>
                      
                      {/* Classes display section */}
                      {!podId ? (
                        <div className="col-span-full text-center py-10">
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pod Selected</h3>
                          <p className="text-gray-500 mb-4">Please select a pod to see classes within it</p>
                          <Button onClick={() => setLocation('/pods')}>
                            View All Pods
                          </Button>
                        </div>
                      ) : isLoadingClasses ? (
                        <div className="col-span-full flex justify-center items-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : classes.length === 0 ? (
                        <div className="col-span-full text-center py-10">
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Classes Found</h3>
                          <p className="text-gray-500 mb-4">This pod doesn't have any classes assigned to it yet</p>
                          <Button onClick={() => setLocation('/admin')}>
                            Manage Classes
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Y-axis labels */}
                          <div className="absolute left-2 top-0 bottom-0 w-8 flex flex-col justify-between pt-14 pb-8 text-xs text-gray-500">
                            {(() => {
                              const sortedClasses = classes
                                .map(classItem => ({
                                  ...classItem,
                                  points: classPoints[classItem.id] || 0
                                }))
                                .sort((a, b) => b.points - a.points);
                              
                              const maxPoints = Math.max(
                                sortedClasses[0]?.points || 0, 
                                70 // Minimum scale for good visual appearance
                              );
                              
                              // Create 5 labels for y-axis
                              return [4, 3, 2, 1].map((div) => (
                                <div key={div} className="text-right">
                                  {Math.round(maxPoints * div / 4)}
                                </div>
                              ));
                            })()}
                            <div className="text-right">0</div>
                          </div>
                          
                          <div className="flex items-end space-x-8 justify-around pt-16 pb-4 relative min-h-[300px] pl-8">
                            {/* Calculate max points for scaling */}
                            {(() => {
                              const sortedClasses = classes
                                .map(classItem => ({
                                  ...classItem,
                                  points: classPoints[classItem.id] || 0
                                }))
                                .sort((a, b) => b.points - a.points);
                                
                              const maxPoints = Math.max(
                                sortedClasses[0]?.points || 0, 
                                70 // Minimum scale for good visual appearance
                              );
                              
                              return sortedClasses.map((classItem, index) => (
                                <ClassDashboardCard
                                  key={classItem.id}
                                  classItem={classItem}
                                  points={classItem.points}
                                  rank={index}
                                  maxPoints={maxPoints}
                                  previousPoints={classItem.points - Math.floor(Math.random() * 10)}
                                />
                              ));
                            })()}
                          </div>
                          
                          {/* Baseline with label */}
                          <div className="absolute bottom-0 left-0 right-0 border-t-2 border-gray-300">
                          </div>
                          
                          {/* Add view details button */}
                          <div className="flex justify-center mt-8">
                            <Button variant="outline" className="flex items-center gap-2" onClick={() => setLocation(`/pod/${podId}/stats`)}>
                              <LineChart className="h-4 w-4" />
                              View Detailed Stats
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Posters Content */}
              {isPosters && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Points Posters</h2>
                  <p className="text-gray-600 mb-4">Generate and print pod points posters for your classroom or school.</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {pods?.map(pod => (
                      <div key={pod.id} className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2" style={{ color: pod.color }}>{pod.name}</h3>
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
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Pod Setup</h2>
                  
                  <div className="space-y-6">
                    {pods?.map(pod => (
                      <div key={pod.id} className="border rounded-lg p-4 relative">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 rounded-full mr-4" style={{ backgroundColor: pod.color }}></div>
                          <div>
                            <h3 className="text-lg font-semibold">{pod.name}</h3>
                            <p className="text-sm text-gray-500">{pod.description || 'No description'}</p>
                          </div>
                          {/* Settings button removed as requested */}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">Students: <span className="font-semibold">24</span></div>
                          <button 
                            onClick={() => setLocation(`/roster?pod=${pod.id}`)}
                            className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center gap-1"
                          >
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
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Pod Options</h2>
                  
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
                          <label htmlFor="showRankings">Show pod rankings</label>
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