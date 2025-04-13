import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { userRoles, appUserRoles, User } from '@shared/schema';
import { Loader2, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('view');
  const queryClient = useQueryClient();
  
  // State for managing the edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    password: string;
    confirmPassword?: string;
  }>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    role: 'admin',
    password: '',
  });
  
  // State for managing delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Partial<User> | null>(null);
  
  // State for managing create user form
  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    role: 'admin',
    password: '',
    confirmPassword: '',
  });

  // Query to get users by role (including the "all" role)
  const { data: users, isLoading } = useQuery<Partial<User>[]>({
    queryKey: ['/api/users/role/' + selectedRole]
  });
  
  // Mutation for updating a user
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const res = await apiRequest('PATCH', `/api/users/${userData.id}`, userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'User updated successfully',
        description: `${data.firstName} ${data.lastName}'s information has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/role/${selectedRole}`] });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update user',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutation for deleting a user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User deleted successfully',
        description: 'The user and all associated data have been removed.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/role/${selectedRole}`] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete user',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Function to handle opening the edit dialog
  const handleEditUser = (user: Partial<User>) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'admin',
      password: '', // Password is empty by default when editing
    });
    setEditDialogOpen(true);
  };
  
  // Function to handle submitting the edit form
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser?.id) return;
    
    // Only include password in the update if it was provided
    const updateData: Partial<User> = {
      id: selectedUser.id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
      role: formData.role as any,
    };
    
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    updateUserMutation.mutate(updateData);
  };
  
  // Function to handle opening the delete confirmation dialog
  const handleDeleteClick = (user: Partial<User>) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  // Function to handle confirming user deletion
  const handleConfirmDelete = () => {
    if (userToDelete?.id) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };
  
  // Mutation for creating a user
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest('POST', '/api/register', userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'User created successfully',
        description: `${data.firstName} ${data.lastName} has been added to the system.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/role/${createFormData.role}`] });
      
      // Reset form data
      setCreateFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        role: 'admin',
        password: '',
        confirmPassword: '',
      });
      
      // Switch back to the view tab
      setActiveTab('view');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create user',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Function to handle creating a new user
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (createFormData.password !== createFormData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'The passwords you entered do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    // Create user data object
    const userData = {
      firstName: createFormData.firstName,
      lastName: createFormData.lastName,
      username: createFormData.username,
      email: createFormData.email,
      role: createFormData.role,
      password: createFormData.password,
    };
    
    createUserMutation.mutate(userData);
  };

  // Filter users based on search query and only include app users (admin and teacher)
  const filteredUsers = users?.filter(user => {
    // Only show app users (admin and teacher)
    if (!appUserRoles.includes(user.role as any)) return false;
    
    // Apply search filter
    if (!searchQuery) return true;
    
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Create, update and manage user accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. Leave password blank to keep current password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input 
                      id="edit-firstName" 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input 
                      id="edit-lastName" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email (Optional)</Label>
                  <Input 
                    id="edit-email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-username">Username</Label>
                    <Input 
                      id="edit-username" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData({...formData, role: value})}
                    >
                      <SelectTrigger id="edit-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {appUserRoles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-password">
                    New Password <span className="text-xs text-neutral-dark">(leave blank to keep current)</span>
                  </Label>
                  <Input 
                    id="edit-password" 
                    type="password" 
                    placeholder="Enter new password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}? 
                This action cannot be undone and all associated data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete} 
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="view">View Users</TabsTrigger>
            <TabsTrigger value="create">Create User</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-dark" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All App Users</SelectItem>
                  {appUserRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button onClick={() => setActiveTab('create')}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={
                            user.role === 'admin' ? 'bg-primary' :
                            user.role === 'teacher' ? 'bg-accent' :
                            user.role === 'student' ? 'bg-secondary' :
                            'bg-neutral-dark'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border rounded-md">
                <p className="text-neutral-dark">No users found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <form onSubmit={handleCreateUser} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Enter first name" 
                    value={createFormData.firstName}
                    onChange={(e) => setCreateFormData({...createFormData, firstName: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Enter last name" 
                    value={createFormData.lastName}
                    onChange={(e) => setCreateFormData({...createFormData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter email address (optional)" 
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Choose a username" 
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({...createFormData, username: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={createFormData.role} 
                    onValueChange={(value) => setCreateFormData({...createFormData, role: value})}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {appUserRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Set a password" 
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="Confirm password" 
                    value={createFormData.confirmPassword}
                    onChange={(e) => setCreateFormData({...createFormData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setCreateFormData({
                    firstName: '',
                    lastName: '',
                    username: '',
                    email: '',
                    role: 'admin',
                    password: '',
                    confirmPassword: '',
                  });
                  setActiveTab('view');
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : "Create User"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
