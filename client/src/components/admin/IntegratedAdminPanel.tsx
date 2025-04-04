import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  House, BehaviorCategory, User as UserType
} from '@shared/schema';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  User,
  UserPlus,
  Settings,
  PlusCircle,
  Pencil,
  Trash,
  Trophy
} from 'lucide-react';

export function IntegratedAdminPanel() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch necessary data
  const { data: houses = [] } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });
  
  const { data: students = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/student'],
  });
  
  const { data: teachers = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/teacher'],
  });
  
  const { data: behaviorCategories = [] } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Manage school system settings and configurations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b">
            <div className="flex overflow-x-auto py-2 px-4">
              <Button 
                variant={activeTab === "overview" ? "default" : "ghost"} 
                className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary px-4" 
                onClick={() => setActiveTab("overview")}
                data-active={activeTab === "overview"}
              >
                Overview
              </Button>
              <Button 
                variant={activeTab === "users" ? "default" : "ghost"} 
                className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary px-4" 
                onClick={() => setActiveTab("users")}
                data-active={activeTab === "users"}
              >
                User Management
              </Button>
              <Button 
                variant={activeTab === "categories" ? "default" : "ghost"} 
                className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary px-4" 
                onClick={() => setActiveTab("categories")}
                data-active={activeTab === "categories"}
              >
                Behavior Categories
              </Button>
              <Button 
                variant={activeTab === "houses" ? "default" : "ghost"} 
                className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary px-4" 
                onClick={() => setActiveTab("houses")}
                data-active={activeTab === "houses"}
              >
                Houses
              </Button>
              <Button 
                variant={activeTab === "rewards" ? "default" : "ghost"} 
                className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary px-4" 
                onClick={() => setActiveTab("rewards")}
                data-active={activeTab === "rewards"}
              >
                Rewards
              </Button>
              <Button 
                variant={activeTab === "settings" ? "default" : "ghost"} 
                className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary px-4" 
                onClick={() => setActiveTab("settings")}
                data-active={activeTab === "settings"}
              >
                System Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <h3 className="text-3xl font-bold tracking-tight">{students.length}</h3>
                </div>
                <div className="p-3 rounded-full bg-blue-600 bg-opacity-10">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Teachers</p>
                  <h3 className="text-3xl font-bold tracking-tight">{teachers.length}</h3>
                </div>
                <div className="p-3 rounded-full bg-indigo-600 bg-opacity-10">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Houses</p>
                  <h3 className="text-3xl font-bold tracking-tight">{houses.length}</h3>
                </div>
                <div className="p-3 rounded-full bg-amber-600 bg-opacity-10">
                  <Trophy className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Behavior Categories</p>
                  <h3 className="text-3xl font-bold tracking-tight">{behaviorCategories.length}</h3>
                </div>
                <div className="p-3 rounded-full bg-emerald-600 bg-opacity-10">
                  <Settings className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Users</h2>
              <p className="text-muted-foreground">Manage system users</p>
            </div>
            <Button onClick={() => {}} className="gap-1">
              <UserPlus size={16} />
              <span>Add User</span>
            </Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="admins">Admins</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="parents">Parents</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="border rounded-md mt-6">
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted text-left">
                      <th className="p-4 align-middle font-medium">Name</th>
                      <th className="p-4 align-middle font-medium">Username</th>
                      <th className="p-4 align-middle font-medium">Role</th>
                      <th className="p-4 align-middle font-medium">House</th>
                      <th className="p-4 align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...teachers, ...students.slice(0, 5)].map((user, i) => (
                      <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">{user.firstName} {user.lastName}</td>
                        <td className="p-4 align-middle">{user.username || "-"}</td>
                        <td className="p-4 align-middle">
                          <Badge variant={user.role === "teacher" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          {user.houseId ? houses.find(h => h.id === user.houseId)?.name || "-" : "-"}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="admins" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    Select a tab to view different user categories
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="teachers" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    Select a tab to view different user categories
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Behavior Categories</h2>
              <p className="text-muted-foreground">Manage behavior point categories</p>
            </div>
            <Button onClick={() => {}} className="gap-1">
              <PlusCircle size={16} />
              <span>Add Category</span>
            </Button>
          </div>

          <Tabs defaultValue="positive">
            <TabsList>
              <TabsTrigger value="positive">Positive Categories</TabsTrigger>
              <TabsTrigger value="negative">Negative Categories</TabsTrigger>
            </TabsList>
            <TabsContent value="positive" className="border rounded-md mt-6">
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted text-left">
                      <th className="p-4 align-middle font-medium">Name</th>
                      <th className="p-4 align-middle font-medium">Points Value</th>
                      <th className="p-4 align-middle font-medium">Description</th>
                      <th className="p-4 align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {behaviorCategories
                      .filter(cat => cat.isPositive)
                      .map((category, i) => (
                      <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">{category.name}</td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700">
                            +{category.pointValue}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">{category.description || "-"}</td>
                        <td className="p-4 align-middle">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="negative" className="border rounded-md mt-6">
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted text-left">
                      <th className="p-4 align-middle font-medium">Name</th>
                      <th className="p-4 align-middle font-medium">Points Value</th>
                      <th className="p-4 align-middle font-medium">Description</th>
                      <th className="p-4 align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {behaviorCategories
                      .filter(cat => !cat.isPositive)
                      .map((category, i) => (
                      <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">{category.name}</td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 hover:bg-rose-50 hover:text-rose-700">
                            {category.pointValue}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">{category.description || "-"}</td>
                        <td className="p-4 align-middle">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {activeTab === "houses" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Houses</h2>
              <p className="text-muted-foreground">Manage school houses for competitions</p>
            </div>
            <Button onClick={() => {}} className="gap-1">
              <PlusCircle size={16} />
              <span>Add House</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {houses.map((house, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: house.color }}
                    />
                    <CardTitle>{house.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{house.points} points</div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {students.filter(s => s.houseId === house.id).length} students
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      <Pencil size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users size={14} className="mr-1" />
                      Members
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === "rewards" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Rewards Store</h2>
              <p className="text-muted-foreground">Manage rewards that students can redeem</p>
            </div>
            <Button onClick={() => {}} className="gap-1">
              <PlusCircle size={16} />
              <span>Add Reward</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>Example Reward {i + 1}</CardTitle>
                  <CardDescription>Special privilege or item</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{(i + 1) * 10} points</div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Available: {10 - (i % 4)}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-between">
                  <Button variant="outline" size="sm">
                    <Pencil size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash size={14} className="mr-1" />
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
            <p className="text-muted-foreground">Configure the behavior management system</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>Basic details about your school</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">School Name</label>
                  <input type="text" className="w-full p-2 border rounded-md" defaultValue="My School" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Academic Year</label>
                  <input type="text" className="w-full p-2 border rounded-md" defaultValue="2023-2024" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Points System</CardTitle>
              <CardDescription>Configure how points are calculated and displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="house-totals" className="rounded border-gray-300" defaultChecked />
                  <label htmlFor="house-totals" className="text-sm font-medium">Show house point totals on the dashboard</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="allow-negative" className="rounded border-gray-300" defaultChecked />
                  <label htmlFor="allow-negative" className="text-sm font-medium">Allow negative point balances for students</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="notifications" className="rounded border-gray-300" defaultChecked />
                  <label htmlFor="notifications" className="text-sm font-medium">Send email notifications for significant point changes</label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}