import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import UserManagement from '@/components/admin/UserManagement';
import BehaviorCategoryManagement from '@/components/admin/BehaviorCategoryManagement';
import RewardManagement from '@/components/admin/RewardManagement';
import HouseManagement from '@/components/admin/HouseManagement';
import RosterManagement from '@/components/admin/RosterManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
                <TabsTrigger value="houses" className="mr-4">Houses</TabsTrigger>
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
                      <CardTitle>Houses</CardTitle>
                      <CardDescription>View house stats</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-mono font-bold text-primary">
                        {/* Would fetch actual count in a real implementation */}
                        4
                      </div>
                      <div className="mt-2 text-sm text-neutral-dark">
                        School houses for competitions
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
                    <p className="text-neutral-dark">System activity log will be displayed here.</p>
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
                <HouseManagement />
              </TabsContent>
              
              <TabsContent value="system" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Configure global system settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-dark">System configuration options will be available soon.</p>
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
