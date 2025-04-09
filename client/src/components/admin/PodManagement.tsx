import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Pod, InsertPod } from '@shared/schema';
import { apiRequest, queryClient, globalEventBus } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { insertPodSchema } from '@shared/schema';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { HexColorPicker } from 'react-colorful';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';

// Extended schema with validation
const formSchema = insertPodSchema
  .extend({
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: 'Please provide a valid hex color (e.g., #FF5733)',
    }),
  });

type FormData = z.infer<typeof formSchema>;

export default function PodManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);

  // Fetch pods with refresh counter to force refetch
  const { data: pods, isLoading, refetch } = useQuery<Pod[]>({
    queryKey: ['/api/pods', refreshCounter],
  });

  // Create pod form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#4F46E5',
      description: '',
      logoUrl: '',
    },
  });

  // Edit pod form
  const editForm = useForm<FormData & { id: number }>({
    resolver: zodResolver(formSchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      name: '',
      color: '#4F46E5',
      description: '',
      logoUrl: '',
    },
  });

  // Create pod mutation
  const createPodMutation = useMutation({
    mutationFn: async (newPod: InsertPod) => {
      try {
        console.log('Creating pod with data:', newPod);
        
        // Use apiRequest for more consistent handling
        const res = await apiRequest('POST', '/api/pods', newPod);
        
        // Get parsed JSON response
        const data = await res.json();
        console.log('Parsed create pod response:', data);
        return data;
      } catch (err) {
        console.error('Pod creation error:', err);
        throw err;
      }
    },
    onSuccess: (newPod) => {
      toast({
        title: 'Pod created successfully',
        description: 'The new pod has been added to the system.',
      });
      setIsAddDialogOpen(false);
      form.reset();
      
      // Force immediate UI updates
      globalEventBus.publish('pod-updated');
      
      // Increment refresh counter to force a refetch
      setRefreshCounter(prev => prev + 1);
      
      // Also invalidate the cache and wait for UI to update
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] });
      
      // Force refetch with a small delay to ensure server consistency
      setTimeout(() => {
        refetch();
        // Publish another update event after refetch completes
        globalEventBus.publish('pod-updated');
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create pod',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Edit pod mutation
  const updatePodMutation = useMutation({
    mutationFn: async (updatedPod: Partial<Pod> & { id: number }) => {
      const { id, ...podData } = updatedPod;
      try {
        console.log('Updating pod with data:', podData);
        
        // Use apiRequest for more consistent handling
        const res = await apiRequest('PATCH', `/api/pods/${id}`, podData);
        
        // Get parsed JSON response
        const responseData = await res.json();
        console.log('Parsed update pod response:', responseData);
        return responseData.pod || responseData;
      } catch (err) {
        console.error('Pod update error:', err);
        throw err;
      }
    },
    onSuccess: (updatedPod) => {
      toast({
        title: 'Pod updated successfully',
        description: 'The pod information has been updated.',
      });
      setIsEditDialogOpen(false);
      editForm.reset();
      
      // Force immediate UI updates - fire event for other components
      globalEventBus.publish('pod-updated');
      
      // Increment refresh counter to force a refetch
      setRefreshCounter(prev => prev + 1);
      
      // Also invalidate the cache and wait for UI to update
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] });
      
      // Force refetch with a small delay to ensure server consistency
      setTimeout(() => {
        refetch();
        // Publish another update event after refetch completes
        globalEventBus.publish('pod-updated');
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update pod',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete pod mutation
  const deletePodMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        console.log('Deleting pod with id:', id);
        
        // Use apiRequest for more consistent handling
        const res = await apiRequest('DELETE', `/api/pods/${id}`);
        
        // Get parsed JSON response
        const data = await res.json();
        console.log('Parsed delete pod response:', data);
        return data;
      } catch (err) {
        console.error('Pod deletion error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Pod deleted successfully',
        description: 'The pod has been removed from the system.',
      });
      
      // Force immediate UI updates across all components
      globalEventBus.publish('pod-updated');
      
      // Increment refresh counter to force a refetch
      setRefreshCounter(prev => prev + 1);
      
      // Also invalidate the cache and wait for UI to update
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] });
      
      // Force refetch with a small delay to ensure server consistency
      setTimeout(() => {
        refetch();
        // Publish another update event after refetch completes
        globalEventBus.publish('pod-updated');
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete pod',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form submit handlers
  const onSubmit = (data: FormData) => {
    createPodMutation.mutate(data);
  };

  const onEditSubmit = (data: FormData & { id: number }) => {
    updatePodMutation.mutate(data);
  };

  const handleEditPod = (pod: Pod) => {
    setSelectedPod(pod);
    editForm.reset({
      id: pod.id,
      name: pod.name,
      color: pod.color,
      description: pod.description || '',
      logoUrl: pod.logoUrl || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeletePod = (id: number) => {
    if (window.confirm('Are you sure you want to delete this pod? This action cannot be undone.')) {
      deletePodMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pod Management</CardTitle>
            <CardDescription>Create, edit, and manage school pods</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" />
                <span>Add Pod</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Pod</DialogTitle>
                <DialogDescription>
                  Create a new pod for organizing students and fostering school spirit.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pod Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Dragon Pod" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pod Color</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input 
                              placeholder="#FF5733" 
                              {...field} 
                              onClick={() => setShowColorPicker(true)}
                            />
                          </FormControl>
                          <div
                            className="h-8 w-8 rounded-md border cursor-pointer"
                            style={{ backgroundColor: field.value }}
                            onClick={() => setShowColorPicker(true)}
                          />
                        </div>
                        {showColorPicker && (
                          <div className="relative mt-2">
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowColorPicker(false)}
                            />
                            <div className="absolute z-50 shadow-lg rounded-md p-3 bg-background border">
                              <HexColorPicker 
                                color={field.value} 
                                onChange={(color) => {
                                  field.onChange(color);
                                }}
                              />
                              <div className="mt-2 flex justify-end">
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => setShowColorPicker(false)}
                                >
                                  Done
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        <FormDescription>Select or enter a hex color code (e.g. #FF5733)</FormDescription>
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
                          <Textarea
                            placeholder="A brief description of the pod and its values..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Enter a URL for the pod logo image</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPodMutation.isPending}
                    >
                      {createPodMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Pod'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !pods || pods.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No pods found. Create your first pod by clicking the "Add Pod" button.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pods.map((pod) => (
                  <TableRow key={pod.id}>
                    <TableCell>
                      <div
                        className="h-6 w-6 rounded-full mx-auto"
                        style={{ backgroundColor: pod.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{pod.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {pod.description || 'No description'}
                    </TableCell>
                    <TableCell className="text-center">{pod.points}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleEditPod(pod)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeletePod(pod.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Pod Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pod</DialogTitle>
            <DialogDescription>
              Update the pod's information and appearance.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pod Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pod Color</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input 
                          {...field} 
                          onClick={() => setShowEditColorPicker(true)}
                        />
                      </FormControl>
                      <div
                        className="h-8 w-8 rounded-md border cursor-pointer"
                        style={{ backgroundColor: field.value }}
                        onClick={() => setShowEditColorPicker(true)}
                      />
                    </div>
                    {showEditColorPicker && (
                      <div className="relative mt-2">
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowEditColorPicker(false)}
                        />
                        <div className="absolute z-50 shadow-lg rounded-md p-3 bg-background border">
                          <HexColorPicker 
                            color={field.value} 
                            onChange={(color) => {
                              field.onChange(color);
                            }}
                          />
                          <div className="mt-2 flex justify-end">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="secondary"
                              onClick={() => setShowEditColorPicker(false)}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePodMutation.isPending}
                >
                  {updatePodMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}