import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BehaviorCategory, User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Check, Loader2, Award } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface BatchPointsAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentIds: number[];
}

export default function BatchPointsAssignment({ 
  isOpen, 
  onClose, 
  selectedStudentIds 
}: BatchPointsAssignmentProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [points, setPoints] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Fetch categories
  const { data: categories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });

  // Fetch students to get names for display
  const { data: students } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });

  // Get positive behavior categories
  const positiveCategories = categories?.filter(c => c.isPositive) || [];

  // Filter selected students
  const selectedStudents = students?.filter(s => 
    selectedStudentIds.includes(s.id)
  ) || [];

  // Create a readable list of student names
  const studentNamesList = selectedStudents.map(s => 
    `${s.firstName} ${s.lastName}`
  ).join(', ');

  // We now use batchAssignMutation instead to handle all students at once

  // Reset the form
  const resetForm = () => {
    setSelectedCategory(null);
    setPoints(1);
    setNotes('');
    onClose();
  };

  // Invalidate all relevant queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
    queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/teacher'] });
    queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    queryClient.invalidateQueries({ queryKey: ['/api/houses-top-students'] });
    
    // Force immediate refetch
    queryClient.refetchQueries({ queryKey: ['/api/behavior-points/recent'] });
    queryClient.refetchQueries({ queryKey: ['/api/houses'] });
  };

  // Batch assignment mutation
  const batchAssignMutation = useMutation({
    mutationFn: async (pointsArray: any[]) => {
      console.log('Sending batch points request:', { points: pointsArray });
      
      try {
        const res = await fetch('/api/behavior-points/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ points: pointsArray }),
          credentials: 'include',
        });
        
        console.log('Batch points response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Batch points error response:', errorText);
          throw new Error(`Error assigning batch points: ${errorText}`);
        }
        
        const result = await res.json();
        console.log('Batch points success response:', result);
        return result;
      } catch (error) {
        console.error('Batch points fetch error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Points assigned successfully",
        description: `Assigned points to ${selectedStudentIds.length} students.`,
      });
      
      // Reset form and close
      resetForm();
      
      // Refresh all relevant data
      invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Error assigning points",
        description: `${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle submit
  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast({
        title: "Missing category",
        description: "Please select a behavior category.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication error", 
        description: "You must be logged in to assign points.",
        variant: "destructive",
      });
      return;
    }

    // Get the category details
    const category = categories?.find(c => c.id === selectedCategory);
    if (!category) {
      toast({
        title: "Category error",
        description: "Selected category not found.",
        variant: "destructive",
      });
      return;
    }
    
    // Create an array of point assignments for all students at once
    const pointValue = category.pointValue * points;
    
    // Show processing toast
    toast({
      title: "Processing",
      description: `Assigning ${pointValue} points to ${selectedStudentIds.length} students...`,
    });
    
    // Create batch points array
    const pointsArray = selectedStudentIds.map(studentId => ({
      studentId,
      categoryId: selectedCategory,
      points: pointValue,
      teacherId: user.id,
      notes: notes || undefined,
    }));
    
    // Send as a single batch request
    try {
      await batchAssignMutation.mutateAsync(pointsArray);
    } catch (error) {
      console.error('Failed to assign batch points:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Award Points to Multiple Students</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            You are about to award points to {selectedStudentIds.length} students: 
            <div className="font-medium mt-1">{studentNamesList}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Select Behavior Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {positiveCategories.map(category => (
                <Card 
                  key={category.id}
                  className={cn(
                    "cursor-pointer transition-all border-2 p-3",
                    selectedCategory === category.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-gray-400"
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">{category.pointValue} points</div>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="points">Points Multiplier</Label>
            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => setPoints(Math.max(1, points - 1))}
              >
                -
              </Button>
              <Input 
                id="points"
                type="number" 
                value={points}
                min={1}
                max={10}
                className="w-20 text-center"
                onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => setPoints(Math.min(10, points + 1))}
              >
                <Check className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground ml-2">
                (1x to 10x the base point value)
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea 
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={resetForm}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={batchAssignMutation.isPending || !selectedCategory}
          >
            {batchAssignMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4" />
                Award Points
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}