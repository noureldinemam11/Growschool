import React from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GridPointsSelector from '@/components/points/GridPointsSelector';

export default function DeductPointsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mutation for creating behavior points
  const pointsMutation = useMutation({
    mutationFn: async (data: {
      studentIds: number[];
      categoryId: number;
      points: number;
      notes: string;
    }) => {
      const requests = data.studentIds.map(studentId => 
        apiRequest('POST', '/api/behavior-points', {
          studentId,
          categoryId: data.categoryId,
          points: data.points, // Should be negative here
          notes: data.notes,
        })
      );
      
      await Promise.all(requests);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/teacher'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
      
      // Show success toast
      toast({
        title: "Points Deducted",
        description: "Points have been deducted from the selected students.",
        variant: "default",
      });
      
      // Navigate back to dashboard
      navigate('/');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to deduct points: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle points submission
  const handleSubmitPoints = (
    studentIds: number[], 
    categoryId: number, 
    points: number, 
    notes: string
  ) => {
    // Ensure points are negative
    const pointsValue = points < 0 ? points : -points;
    
    pointsMutation.mutate({
      studentIds,
      categoryId,
      points: pointsValue,
      notes,
    });
  };
  
  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button 
            variant="ghost" 
            className="mb-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold flex items-center">
            <AlertTriangle className="h-7 w-7 mr-3 text-rose-500" />
            Deduct Points
          </h1>
          <p className="text-muted-foreground mt-1">
            Document behavior concerns and learning opportunities
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <GridPointsSelector
          mode="deduct"
          onSubmit={handleSubmitPoints}
          onCancel={() => navigate('/')}
        />
      </div>
    </div>
  );
}