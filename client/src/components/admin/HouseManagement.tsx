import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { House, InsertHouse } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { insertHouseSchema } from '@shared/schema';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';

// Extended schema with validation
const formSchema = insertHouseSchema
  .extend({
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: 'Please provide a valid hex color (e.g., #FF5733)',
    }),
  });

type FormData = z.infer<typeof formSchema>;

export default function HouseManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);

  // Fetch houses
  const { data: houses, isLoading } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });

  // Create house form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#4F46E5',
      description: '',
      logoUrl: '',
    },
  });

  // Edit house form
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

  // Create house mutation
  const createHouseMutation = useMutation({
    mutationFn: async (newHouse: InsertHouse) => {
      try {
        const res = await apiRequest('POST', '/api/houses', newHouse);
        
        // Check if response is OK
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to create house');
        }
        
        return await res.json();
      } catch (err) {
        console.error('House creation error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: 'House created successfully',
        description: 'The new house has been added to the system.',
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create house',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Edit house mutation
  const updateHouseMutation = useMutation({
    mutationFn: async (updatedHouse: Partial<House> & { id: number }) => {
      const { id, ...data } = updatedHouse;
      try {
        const res = await apiRequest('PATCH', `/api/houses/${id}`, data);
        
        // Check if response is OK
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to update house');
        }
        
        const responseData = await res.json();
        
        if (!responseData?.success) {
          throw new Error(responseData?.error || 'Failed to update house');
        }
        
        return responseData.house; // Return the updated house from the response
      } catch (err) {
        console.error('House update error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: 'House updated successfully',
        description: 'The house information has been updated.',
      });
      setIsEditDialogOpen(false);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update house',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete house mutation
  const deleteHouseMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const res = await apiRequest('DELETE', `/api/houses/${id}`);
        
        // Check if response is OK
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to delete house');
        }
        
        return await res.json();
      } catch (err) {
        console.error('House deletion error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: 'House deleted successfully',
        description: 'The house has been removed from the system.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete house',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form submit handlers
  const onSubmit = (data: FormData) => {
    createHouseMutation.mutate(data);
  };

  const onEditSubmit = (data: FormData & { id: number }) => {
    updateHouseMutation.mutate(data);
  };

  const handleEditHouse = (house: House) => {
    setSelectedHouse(house);
    editForm.reset({
      id: house.id,
      name: house.name,
      color: house.color,
      description: house.description || '',
      logoUrl: house.logoUrl || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteHouse = (id: number) => {
    if (window.confirm('Are you sure you want to delete this house? This action cannot be undone.')) {
      deleteHouseMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>House Management</CardTitle>
            <CardDescription>Create, edit, and manage school houses</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" />
                <span>Add House</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New House</DialogTitle>
                <DialogDescription>
                  Create a new house for organizing students and fostering school spirit.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>House Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Dragon House" {...field} />
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
                        <FormLabel>House Color</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder="#FF5733" {...field} />
                          </FormControl>
                          <div
                            className="h-8 w-8 rounded-md border"
                            style={{ backgroundColor: field.value }}
                          />
                        </div>
                        <FormDescription>Hex color code (e.g. #FF5733)</FormDescription>
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
                            placeholder="A brief description of the house and its values..."
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
                        <FormDescription>Enter a URL for the house logo image</FormDescription>
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
                      disabled={createHouseMutation.isPending}
                    >
                      {createHouseMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create House'
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
          ) : !houses || houses.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No houses found. Create your first house by clicking the "Add House" button.
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
                {houses.map((house) => (
                  <TableRow key={house.id}>
                    <TableCell>
                      <div
                        className="h-6 w-6 rounded-full mx-auto"
                        style={{ backgroundColor: house.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{house.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {house.description || 'No description'}
                    </TableCell>
                    <TableCell className="text-center font-mono font-semibold">
                      {house.points}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditHouse(house)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHouse(house.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
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

      {/* Edit House Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit House</DialogTitle>
            <DialogDescription>
              Update the information for {selectedHouse?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedHouse && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House Name</FormLabel>
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
                      <FormLabel>House Color</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <div
                          className="h-8 w-8 rounded-md border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                      <FormDescription>Hex color code (e.g. #FF5733)</FormDescription>
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
                        <Textarea {...field} value={field.value || ''} />
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
                      <FormDescription>Enter a URL for the house logo image</FormDescription>
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
                    disabled={updateHouseMutation.isPending}
                  >
                    {updateHouseMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update House'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}