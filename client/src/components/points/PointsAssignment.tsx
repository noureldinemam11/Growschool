import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BehaviorCategory, insertBehaviorPointSchema } from '@shared/schema';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PointsAssignmentProps {
  studentId: number;
  onBack: () => void;
}

const pointAssignmentSchema = insertBehaviorPointSchema.extend({
  notes: z.string().optional(),
});

type PointAssignmentFormData = z.infer<typeof pointAssignmentSchema>;

export default function PointsAssignment({ studentId, onBack }: PointsAssignmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState('positive');
  
  const { data: categories, isLoading: isLoadingCategories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });
  
  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['/api/users', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${studentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch student');
      }
      return response.json();
    }
  });

  const form = useForm<PointAssignmentFormData>({
    resolver: zodResolver(pointAssignmentSchema),
    defaultValues: {
      studentId,
      categoryId: 0,
      points: 1,
      notes: '',
    },
  });

  const assignPointMutation = useMutation({
    mutationFn: async (data: PointAssignmentFormData) => {
      const res = await apiRequest('POST', '/api/behavior-points', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Points assigned successfully",
        description: `${form.getValues().points} points have been assigned to the student.`,
      });
      
      // Reset the form
      form.reset({
        studentId,
        categoryId: 0,
        points: currentTab === 'positive' ? 1 : -1,
        notes: '',
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to assign points",
        description: "There was an error assigning points to the student. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: PointAssignmentFormData) => {
    // Ensure points are negative for negative behaviors
    if (currentTab === 'negative' && data.points > 0) {
      data.points = -data.points;
    }
    
    assignPointMutation.mutate(data);
  };

  const positiveCategories = categories?.filter(cat => !cat.name.toLowerCase().includes('negative')) || [];
  const negativeCategories = categories?.filter(cat => cat.name.toLowerCase().includes('negative')) || [];

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    
    // Update points value based on tab
    const currentPoints = form.getValues().points;
    if (value === 'positive' && currentPoints < 0) {
      form.setValue('points', Math.abs(currentPoints));
    } else if (value === 'negative' && currentPoints > 0) {
      form.setValue('points', -Math.abs(currentPoints));
    }
  };

  if (isLoadingCategories || isLoadingStudent) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Assign Points to {student?.firstName} {student?.lastName}
        </h2>
        <Button variant="outline" onClick={onBack}>Back to Students</Button>
      </div>
      
      <Tabs defaultValue="positive" value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="positive">Positive Behavior</TabsTrigger>
          <TabsTrigger value="negative">Negative Behavior</TabsTrigger>
        </TabsList>
        
        <TabsContent value="positive" className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Behavior Category</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      {positiveCategories.map((category) => (
                        <Card 
                          key={category.id}
                          className={`cursor-pointer transition-all hover:border-primary ${field.value === category.id ? 'border-2 border-primary bg-primary/5' : ''}`}
                          onClick={() => field.onChange(category.id)}
                        >
                          <CardContent className="p-4">
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-gray-500">{category.description}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <div className="flex items-center space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => field.onChange(Math.max(1, field.value - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            className="w-20 text-center" 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => field.onChange(field.value + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes here..." 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={assignPointMutation.isPending || !form.getValues().categoryId}
                className="w-full"
              >
                {assignPointMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning Points...
                  </>
                ) : (
                  'Assign Points'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="negative" className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Behavior Category</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      {negativeCategories.map((category) => (
                        <Card 
                          key={category.id}
                          className={`cursor-pointer transition-all hover:border-destructive ${field.value === category.id ? 'border-2 border-destructive bg-destructive/5' : ''}`}
                          onClick={() => field.onChange(category.id)}
                        >
                          <CardContent className="p-4">
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-gray-500">{category.description}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <div className="flex items-center space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => field.onChange(Math.min(-1, field.value - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <FormControl>
                          <Input 
                            value={Math.abs(field.value)} 
                            type="number" 
                            min="1" 
                            className="w-20 text-center" 
                            onChange={(e) => field.onChange(-Math.abs(parseInt(e.target.value) || 1))}
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => field.onChange(field.value + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes here..." 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={assignPointMutation.isPending || !form.getValues().categoryId}
                className="w-full"
                variant="destructive"
              >
                {assignPointMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning Points...
                  </>
                ) : (
                  'Assign Points'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}