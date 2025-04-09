import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import UserManagement from '@/components/admin/UserManagement';
import BehaviorCategoryManagement from '@/components/admin/BehaviorCategoryManagement';
import RewardManagement from '@/components/admin/RewardManagement';
import PodManagement from '@/components/admin/PodManagement';
import ClassManagement from '@/components/admin/ClassManagement';
import RosterManagement from '@/components/admin/RosterManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Trash2, Award, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useQuery, useMutation } from '@tanstack/react-query';

// RecentPointsList component to display recent behavior points
interface RecentPointsListProps {
  type: 'positive' | 'negative';
  limit?: number;
}

function RecentPointsList({ type, limit = 5 }: RecentPointsListProps) {
  // Define a BehaviorPoint type interface
  interface BehaviorPoint {
    id: number;
    studentId: number;
    teacherId: number;
    categoryId: number;
    points: number;
    notes: string;
    timestamp: string;
    student?: {
      firstName: string;
      lastName: string;
      gradeLevel?: string;
      section?: string;
    };
    teacher?: {
      firstName: string;
      lastName: string;
    };
    category?: {
      name: string;
    };
  }

  // Fetch recent points
  const { data: recentPoints = [], isLoading } = useQuery<BehaviorPoint[]>({
    queryKey: ['/api/behavior-points/recent'],
  });

  // Filter points based on type
  const filteredPoints = recentPoints
    .filter(point => type === 'positive' ? point.points > 0 : point.points < 0)
    .slice(0, limit);

  if (isLoading) {
    return <div className="text-center py-2">Loading...</div>;
  }

  if (filteredPoints.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-dark text-sm">
        No {type === 'positive' ? 'positive' : 'negative'} points recorded recently.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredPoints.map(point => (
        <div key={point.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${type === 'positive' ? 'bg-success/10' : 'bg-error/10'} mr-3`}>
              <Star className={`h-4 w-4 ${type === 'positive' ? 'text-success' : 'text-error'}`} />
            </div>
            <div>
              <p className="font-medium text-sm">
                {point.student 
                  ? `${point.student.firstName} ${point.student.lastName}`
                  : `Student ${point.studentId}`}
              </p>
              <p className="text-xs text-neutral-dark">
                {point.category?.name || 'Unknown category'}: {type === 'positive' ? '+' : ''}{point.points} points
              </p>
            </div>
          </div>
          <div className="text-xs text-neutral-dark">
            {new Date(point.timestamp).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// PointsResetSection component for handling points reset functionality
function PointsResetSection() {
  const { toast } = useToast();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: number, name: string } | null>(null);
  
  // Define a Student type interface
  interface Student {
    id: number;
    firstName: string;
    lastName: string;
    [key: string]: any; // Allow for other properties we might not explicitly use
  }

  // Fetch all students for the student reset dropdown
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/users/role/student'],
    staleTime: 60000,
  });
  
  // Fetch recent behavior points to check if any exist
  const { data: behaviorPoints = [] } = useQuery<any[]>({
    queryKey: ['/api/behavior-points/recent'],
    staleTime: 30000,
  });

  // Mutation for resetting all points
  const resetAllPointsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/behavior-points/all');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset all points');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pods-top-students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/teacher'] });
      
      toast({
        title: "Points Reset",
        description: "All behavior points have been reset successfully.",
      });
      
      setIsResetDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for resetting points for a specific student
  const resetStudentPointsMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const response = await apiRequest('DELETE', `/api/behavior-points/student/${studentId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset student points');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pods-top-students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/teacher'] });
      
      toast({
        title: "Points Reset",
        description: data.message || "Student's points have been reset successfully.",
      });
      
      setIsStudentDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  return (
    <>
      <Card className="p-4">
        <h4 className="text-md font-medium mb-2">Reset All Points</h4>
        <p className="text-sm text-neutral-dark mb-4">
          This will reset all behavior points for all students across all pods. This action cannot be undone.
        </p>
        
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset All Points
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset All Points</DialogTitle>
              <DialogDescription>
                This action will delete ALL behavior points for ALL students and reset pod points to zero.
                <div className="mt-2 font-semibold">This action cannot be undone.</div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsResetDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => resetAllPointsMutation.mutate()}
                disabled={resetAllPointsMutation.isPending}
              >
                {resetAllPointsMutation.isPending ? "Resetting..." : "Reset All Points"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
      
      {/* Only show the Reset Student Points section if there are behavior points */}
      {behaviorPoints && behaviorPoints.length > 0 && (
        <Card className="p-4">
          <h4 className="text-md font-medium mb-2">Reset Student Points</h4>
          <p className="text-sm text-neutral-dark mb-4">
            Select a student to reset only their behavior points. This action cannot be undone.
          </p>
          
          <div className="space-y-4">
            {students && students.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {students.slice(0, 6).map((student: Student) => (
                  <Button 
                    key={student.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      setSelectedStudent({
                        id: student.id,
                        name: `${student.firstName} ${student.lastName}`
                      });
                      setIsStudentDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2 text-destructive" />
                    {student.firstName} {student.lastName}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-dark">No students found.</p>
            )}
            
            {students && students.length > 6 && (
              <p className="text-xs text-neutral-dark">
                {students.length - 6} more students available. Use student roster for more.
              </p>
            )}
          </div>
        </Card>
      )}
      
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Points for Student</DialogTitle>
            <DialogDescription>
              {selectedStudent ? (
                <>
                  This action will delete ALL behavior points for <span className="font-semibold">{selectedStudent.name}</span>.
                  <div className="mt-2 font-semibold">This action cannot be undone.</div>
                </>
              ) : (
                "Please select a student first."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsStudentDialogOpen(false);
                setSelectedStudent(null);
              }}
            >
              Cancel
            </Button>
            {selectedStudent && (
              <Button 
                variant="destructive"
                onClick={() => resetStudentPointsMutation.mutate(selectedStudent.id)}
                disabled={resetStudentPointsMutation.isPending}
              >
                {resetStudentPointsMutation.isPending ? "Resetting..." : "Reset Points"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Redirect non-admin users
  if (user && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-y-auto bg-neutral">
          <div className="p-4 md:p-8">
            <header className="mb-6">
              <h1 className="text-2xl font-heading font-bold text-neutral-darker">Admin Dashboard</h1>
              <p className="text-neutral-dark">Manage school system settings and configurations</p>
            </header>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="overview" className="mr-4">Overview</TabsTrigger>
                <TabsTrigger value="users" className="mr-4">User Management</TabsTrigger>
                <TabsTrigger value="students" className="mr-4">Student Roster</TabsTrigger>
                <TabsTrigger value="behavior" className="mr-4">Behavior Categories</TabsTrigger>
                <TabsTrigger value="rewards" className="mr-4">Rewards</TabsTrigger>
                <TabsTrigger value="houses" className="mr-4">Pods & Classes</TabsTrigger>
                <TabsTrigger value="system">System Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Users</CardTitle>
                      <CardDescription>Manage system users</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-mono font-bold text-primary">
                        {/* Would fetch actual count in a real implementation */}
                        120
                      </div>
                      <div className="mt-2 text-sm text-neutral-dark">
                        Total registered users in the system
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Pods</CardTitle>
                      <CardDescription>View pod stats</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-mono font-bold text-primary">
                        {/* Would fetch actual count in a real implementation */}
                        4
                      </div>
                      <div className="mt-2 text-sm text-neutral-dark">
                        School pods for competitions
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Rewards</CardTitle>
                      <CardDescription>Manage reward store</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-mono font-bold text-primary">
                        {/* Would fetch actual count in a real implementation */}
                        12
                      </div>
                      <div className="mt-2 text-sm text-neutral-dark">
                        Available rewards in the store
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent System Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Positive Points */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center text-success">
                          <Award className="h-5 w-5 mr-2" />
                          Positive Behaviors
                        </h3>
                        <div className="border rounded-md p-4">
                          <RecentPointsList type="positive" limit={5} />
                        </div>
                      </div>

                      {/* Negative Points */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center text-error">
                          <Award className="h-5 w-5 mr-2" />
                          Behavior Concerns
                        </h3>
                        <div className="border rounded-md p-4">
                          <RecentPointsList type="negative" limit={5} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Quick Tips</AlertTitle>
                  <AlertDescription>
                    Use the tabs above to access different administration sections. Each section provides detailed management capabilities for that aspect of the system.
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="users">
                <UserManagement />
              </TabsContent>

              <TabsContent value="students">
                <RosterManagement />
              </TabsContent>
              
              <TabsContent value="behavior">
                <BehaviorCategoryManagement />
              </TabsContent>
              
              <TabsContent value="rewards">
                <RewardManagement />
              </TabsContent>
              
              <TabsContent value="houses" className="space-y-6">
                <PodManagement />
                <div className="mt-8">
                  <ClassManagement />
                </div>
              </TabsContent>
              
              <TabsContent value="system" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Configure global system settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Points Management</h3>
                      <p className="text-neutral-dark mb-4">
                        Reset points for all students or individual students. These actions cannot be undone.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PointsResetSection />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <MobileNavbar />
    </div>
  );
}
