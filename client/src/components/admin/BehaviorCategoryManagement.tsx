import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BehaviorCategory, InsertBehaviorCategory } from '@shared/schema';
import { Loader2, Plus, Edit, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form schema for creating/editing behavior categories
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isPositive: z.boolean(),
  pointValue: z.coerce.number().min(1).max(10)
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function BehaviorCategoryManagement() {
  const [activeTab, setActiveTab] = useState('view');
  const [editingCategory, setEditingCategory] = useState<BehaviorCategory | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BehaviorCategory | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const { data: categories, isLoading, refetch } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });

  // Form setup for creating or editing categories
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      isPositive: true,
      pointValue: 1
    }
  });

  // Reset form when switching tabs or when edit is cancelled
  const resetForm = () => {
    form.reset({
      name: '',
      description: '',
      isPositive: true,
      pointValue: 1
    });
    setEditingCategory(null);
  };

  // Set form values when editing
  const startEditing = (category: BehaviorCategory) => {
    form.reset({
      name: category.name,
      description: category.description || '',
      isPositive: category.isPositive,
      pointValue: category.pointValue
    });
    setEditingCategory(category);
    setActiveTab('create');
  };

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const res = await apiRequest(
        'POST',
        '/api/behavior-categories',
        data as InsertBehaviorCategory
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Behavior category created successfully',
        variant: 'default',
      });
      resetForm();
      setActiveTab('view');
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create category: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number, values: CategoryFormValues }) => {
      const res = await apiRequest(
        'PATCH',
        `/api/behavior-categories/${data.id}`,
        data.values
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Behavior category updated successfully',
        variant: 'default',
      });
      resetForm();
      setActiveTab('view');
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update category: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        'DELETE',
        `/api/behavior-categories/${id}`,
        {}
      );
      
      // Check if there's an error message in the response
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Behavior category deleted successfully',
        variant: 'default',
      });
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-categories'] });
    },
    onError: (error: any) => {
      setDeleteErrorMessage(error.message || 'Failed to delete category');
    }
  });

  // Handle form submission
  const onSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    resetForm();
    setActiveTab('view');
  };

  // Handle delete button click
  const confirmDelete = (category: BehaviorCategory) => {
    setCategoryToDelete(category);
    setDeleteErrorMessage(null);
    setIsDeleteDialogOpen(true);
  };

  // Execute delete when confirmed
  const handleDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavior Categories</CardTitle>
        <CardDescription>
          Manage behavior categories and point values
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="view">View Categories</TabsTrigger>
            <TabsTrigger value="create">{editingCategory ? 'Edit' : 'Create'} Category</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => {
                resetForm();
                setActiveTab('create');
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Point Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(category => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>
                          <Badge className={category.isPositive ? 'bg-success' : 'bg-error'}>
                            {category.isPositive ? 'Positive' : 'Negative'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-mono font-semibold ${category.isPositive ? 'text-success' : 'text-error'}`}>
                            {category.isPositive ? '+' : '-'}{category.pointValue}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => startEditing(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(category)}>
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
                <p className="text-neutral-dark">No behavior categories found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter a description of this behavior category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isPositive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Type</FormLabel>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-neutral-dark">
                            <span className="font-medium text-success">Positive</span> / <span className="text-error">Negative</span>
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pointValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Point Value</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="10" 
                            placeholder="Enter point value"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Value from 1-10. Points will be awarded or deducted based on category type.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingCategory ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingCategory ? 'Update Category' : 'Create Category'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the behavior category "{categoryToDelete?.name}"?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {deleteErrorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{deleteErrorMessage}</AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
