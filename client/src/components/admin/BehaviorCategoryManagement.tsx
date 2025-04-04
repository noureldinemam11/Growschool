import { useState, useEffect } from 'react';
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
  pointValue: z.coerce.number()
})
.refine(
  (data) => {
    if (data.isPositive) {
      return data.pointValue >= 1 && data.pointValue <= 10;
    } else {
      return data.pointValue <= -1 && data.pointValue >= -10;
    }
  },
  {
    message: "Point value must be 1-10 for positive categories or -10 to -1 for negative categories",
    path: ["pointValue"] // This targets the error to the pointValue field
  }
);

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
  
  // Update the point value when the isPositive value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'isPositive') {
        const isPositive = value.isPositive;
        const currentValue = form.getValues().pointValue;
        
        // If switching from positive to negative and current value is positive
        if (!isPositive && currentValue > 0) {
          form.setValue('pointValue', -1); // Default to -1 for negative
        } 
        // If switching from negative to positive and current value is negative
        else if (isPositive && currentValue < 0) {
          form.setValue('pointValue', 1); // Default to 1 for positive
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

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
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Behavior Categories</h3>
                <p className="text-sm text-neutral-dark">Manage the categories used for awarding or deducting points</p>
              </div>
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
              <div>
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Positive Behavior Categories</h4>
                  <div className="border rounded-md mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Point Value</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories
                          .filter(category => category.isPositive)
                          .map(category => (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">{category.name}</TableCell>
                              <TableCell>{category.description || '-'}</TableCell>
                              <TableCell>
                                <Badge className="bg-success">+{category.pointValue}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => startEditing(category)} title="Edit category">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => confirmDelete(category)} title="Delete category">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        {categories.filter(category => category.isPositive).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-neutral-dark">
                              No positive behavior categories found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <h4 className="text-md font-semibold mb-2">Negative Behavior Categories</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Point Value</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories
                          .filter(category => !category.isPositive)
                          .map(category => (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">{category.name}</TableCell>
                              <TableCell>{category.description || '-'}</TableCell>
                              <TableCell>
                                <Badge className="bg-error">{category.pointValue}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => startEditing(category)} title="Edit category">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => confirmDelete(category)} title="Delete category">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        {categories.filter(category => !category.isPositive).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-neutral-dark">
                              No negative behavior categories found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border rounded-md">
                <p className="text-neutral-dark mb-4">No behavior categories found</p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Category
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <div className="mb-4">
              <h3 className="text-lg font-medium">{editingCategory ? 'Edit' : 'Create New'} Behavior Category</h3>
              <p className="text-sm text-neutral-dark">
                {editingCategory 
                  ? `Modify the details for "${editingCategory.name}"`
                  : 'Define a new category for awarding or deducting student behavior points'}
              </p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary mr-4 flex items-center justify-center">
                      {form.getValues().isPositive ? (
                        <Check className="h-6 w-6 text-white" />
                      ) : (
                        <X className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {form.getValues().isPositive ? 'Positive Behavior' : 'Negative Behavior'}
                      </h4>
                      <p className="text-sm text-neutral-dark">
                        {form.getValues().isPositive 
                          ? 'Points will be added to student totals'
                          : 'Points will be deducted from student totals'}
                      </p>
                    </div>
                  </div>
                
                  <FormField
                    control={form.control}
                    name="isPositive"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between border p-3 rounded-md bg-white">
                          <FormLabel className="text-sm flex-1">
                            <span className="font-medium">Category Type:</span> {' '}
                            {field.value ? (
                              <span className="text-success font-medium">Positive (adds points)</span>
                            ) : (
                              <span className="text-error font-medium">Negative (deducts points)</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={form.getValues().isPositive 
                              ? "e.g., Academic Excellence, Leadership" 
                              : "e.g., Disruption, Missing Homework"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Choose a clear, descriptive name for this behavior category
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={form.getValues().isPositive 
                              ? "e.g., Awarded for outstanding academic performance or significant improvement" 
                              : "e.g., Given when student disrupts class or fails to complete assignments"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Provide details about when this category should be used
                        </FormDescription>
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
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-dark">
                            {form.getValues().isPositive ? '+' : '-'}
                          </div>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={form.getValues().isPositive ? "1" : "1"}
                              max={form.getValues().isPositive ? "10" : "10"} 
                              placeholder="1-10"
                              className="pl-8"
                              {...field} 
                              value={Math.abs(field.value)}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value)) {
                                  // Always store the value as positive for display, actual value will be negative for negative categories
                                  field.onChange(form.getValues().isPositive ? value : -value);
                                }
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormDescription className="text-xs flex justify-between">
                          <span>
                            {form.getValues().isPositive 
                              ? "Value from 1-10 for positive categories." 
                              : "Value from 1-10 for negative categories (will be stored as negative)."}
                          </span>
                          <span className={`font-medium ${form.getValues().isPositive ? 'text-success' : 'text-error'}`}>
                            {form.getValues().isPositive ? `+${Math.abs(field.value)}` : `-${Math.abs(field.value)}`} points
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-6">
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
                      <>
                        {editingCategory ? (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Category
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Category
                          </>
                        )}
                      </>
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
