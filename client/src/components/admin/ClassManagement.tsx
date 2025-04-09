import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Class, InsertClass, Pod } from '@shared/schema';
import { apiRequest, queryClient, globalEventBus } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { insertClassSchema } from '@shared/schema';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';

// Form schema
const formSchema = insertClassSchema.extend({});

type FormData = z.infer<typeof formSchema>;

export default function ClassManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Fetch classes with refresh counter to force refetch
  const { data: classes, isLoading, refetch } = useQuery<Class[]>({
    queryKey: ['/api/classes', refreshCounter],
  });

  // Fetch pods for assignment
  const { data: pods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  // Create class form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      podId: 0,
      gradeLevel: '',
      description: '',
    },
  });

  // Edit class form
  const editForm = useForm<FormData & { id: number }>({
    resolver: zodResolver(formSchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      name: '',
      podId: 0,
      gradeLevel: '',
      description: '',
    },
  });

  // Get pod name by ID
  const getPodName = (podId: number): string => {
    if (!pods || pods.length === 0) return 'Unknown';
    const pod = pods.find(p => p.id === podId);
    return pod ? pod.name : 'Unknown';
  };

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (newClass: InsertClass) => {
      try {
        console.log('Creating class with data:', newClass);
        
        // Use apiRequest for more consistent handling
        const res = await apiRequest('POST', '/api/classes', newClass);
        
        // Get parsed JSON response
        const data = await res.json();
        console.log('Parsed create class response:', data);
        return data;
      } catch (err) {
        console.error('Class creation error:', err);
        throw err;
      }
    },
    onSuccess: (newClass) => {
      toast({
        title: 'Class created successfully',
        description: 'The new class has been added to the system.',
      });
      setIsAddDialogOpen(false);
      form.reset();
      
      // Force immediate UI updates
      globalEventBus.publish('class-updated');
      
      // Increment refresh counter to force a refetch
      setRefreshCounter(prev => prev + 1);
      
      // Also invalidate the cache and wait for UI to update
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      
      // Force refetch with a small delay to ensure server consistency
      setTimeout(() => {
        refetch();
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create class',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Edit class mutation
  const updateClassMutation = useMutation({
    mutationFn: async (updatedClass: Partial<Class> & { id: number }) => {
      const { id, ...classData } = updatedClass;
      try {
        console.log('Updating class with data:', classData);
        
        // Use apiRequest for more consistent handling
        const res = await apiRequest('PATCH', `/api/classes/${id}`, classData);
        
        // Get parsed JSON response
        const responseData = await res.json();
        console.log('Parsed update class response:', responseData);
        return responseData.class || responseData;
      } catch (err) {
        console.error('Class update error:', err);
        throw err;
      }
    },
    onSuccess: (updatedClass) => {
      toast({
        title: 'Class updated successfully',
        description: 'The class information has been updated.',
      });
      setIsEditDialogOpen(false);
      editForm.reset();
      
      // Increment refresh counter to force a refetch
      setRefreshCounter(prev => prev + 1);
      
      // Also invalidate the cache and wait for UI to update
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      
      // Force refetch with a small delay to ensure server consistency
      setTimeout(() => {
        refetch();
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update class',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        console.log('Deleting class with id:', id);
        
        // Use apiRequest for more consistent handling
        const res = await apiRequest('DELETE', `/api/classes/${id}`);
        
        // Get parsed JSON response
        const data = await res.json();
        console.log('Parsed delete class response:', data);
        return data;
      } catch (err) {
        console.error('Class deletion error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Class deleted successfully',
        description: 'The class has been removed from the system.',
      });
      
      // Increment refresh counter to force a refetch
      setRefreshCounter(prev => prev + 1);
      
      // Also invalidate the cache and wait for UI to update
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      
      // Force refetch with a small delay to ensure server consistency
      setTimeout(() => {
        refetch();
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete class',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form submit handlers
  const onSubmit = (data: FormData) => {
    createClassMutation.mutate({
      ...data,
      podId: Number(data.podId) // Ensure podId is a number
    });
  };

  const onEditSubmit = (data: FormData & { id: number }) => {
    updateClassMutation.mutate({
      ...data,
      podId: Number(data.podId) // Ensure podId is a number
    });
  };

  const handleEditClass = (classObj: Class) => {
    setSelectedClass(classObj);
    editForm.reset({
      id: classObj.id,
      name: classObj.name,
      podId: classObj.podId,
      gradeLevel: classObj.gradeLevel || '',
      description: classObj.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClass = (id: number) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      deleteClassMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Class Management</CardTitle>
            <CardDescription>Create, edit, and manage school classes within pods</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" />
                <span>Add Class</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
                <DialogDescription>
                  Create a new class and assign it to a pod.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Class 5A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="podId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pod</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a pod" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pods?.map((pod) => (
                              <SelectItem key={pod.id} value={pod.id.toString()}>
                                {pod.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>The pod this class belongs to</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gradeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade Level</FormLabel>
                        <FormControl>
                          <Input placeholder="5th Grade" {...field} />
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
                          <Textarea
                            placeholder="A brief description of the class..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
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
                      disabled={createClassMutation.isPending}
                    >
                      {createClassMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Class'
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
          ) : !classes || classes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No classes found. Create your first class by clicking the "Add Class" button.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Pod</TableHead>
                  <TableHead>Grade Level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classObj) => (
                  <TableRow key={classObj.id}>
                    <TableCell className="font-medium">{classObj.name}</TableCell>
                    <TableCell>{getPodName(classObj.podId)}</TableCell>
                    <TableCell>{classObj.gradeLevel || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {classObj.description || 'No description'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleEditClass(classObj)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClass(classObj.id)}
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

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update the class information and pod assignment.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="podId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pod</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value.toString()}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a pod" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pods?.map((pod) => (
                          <SelectItem key={pod.id} value={pod.id.toString()}>
                            {pod.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
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
                  disabled={updateClassMutation.isPending}
                >
                  {updateClassMutation.isPending ? (
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