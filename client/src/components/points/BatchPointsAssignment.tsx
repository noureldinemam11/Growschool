import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { User, BehaviorCategory, InsertBehaviorPoint } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

interface BatchPointsAssignmentProps {
  studentIds: number[];
  onBack: () => void;
  onComplete: () => void;
}

export default function BatchPointsAssignment({
  studentIds,
  onBack,
  onComplete
}: BatchPointsAssignmentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [successfulAssignments, setSuccessfulAssignments] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch behavior categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });

  // Fetch students to display names
  const { data: students, isLoading: isLoadingStudents } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });

  // Filter for only positive categories
  const positiveCategories = categories?.filter(c => c.isPositive) || [];

  // Mutations for adding behavior points (one by one)
  const addPointsMutation = useMutation({
    mutationFn: async (data: InsertBehaviorPoint) => {
      const res = await apiRequest('POST', '/api/behavior-points', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] }); // Invalidate house points data
      
      // Increment successful assignments counter
      setSuccessfulAssignments(prev => prev + 1);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add behavior points. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const handleIncrementPoints = () => {
    setPoints(prev => Math.min(prev + 1, 10));
  };

  const handleDecrementPoints = () => {
    setPoints(prev => Math.max(prev - 1, 1));
  };

  // Get the selected category details
  const selectedCategory = positiveCategories.find(c => c.id.toString() === categoryId);

  // Handle submitting points to all selected students
  const handleSubmitAll = async () => {
    if (!categoryId) {
      toast({
        title: "Missing Category",
        description: "Please select a behavior category.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to award points.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSuccessfulAssignments(0);

    const batchAssignments = studentIds.map(studentId => {
      return addPointsMutation.mutateAsync({
        studentId,
        categoryId: parseInt(categoryId),
        points: selectedCategory ? selectedCategory.pointValue * points : points,
        teacherId: user.id,
        notes: notes || (selectedCategory ? `${selectedCategory.name} - Batch award` : 'Batch award')
      });
    });

    try {
      await Promise.all(batchAssignments);
      
      toast({
        title: "Points Awarded Successfully",
        description: `Awarded points to ${studentIds.length} students.`,
      });
      
      // Reset form and go back
      setTimeout(() => {
        setIsSubmitting(false);
        onComplete();
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Some point assignments failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStudentNames = () => {
    if (!students) return "Loading students...";
    
    const selectedStudents = students.filter(s => studentIds.includes(s.id));
    if (selectedStudents.length === 0) return "No students selected";
    
    if (selectedStudents.length <= 3) {
      return selectedStudents.map(s => `${s.firstName} ${s.lastName}`).join(", ");
    } else {
      const firstTwo = selectedStudents.slice(0, 2).map(s => `${s.firstName} ${s.lastName}`).join(", ");
      return `${firstTwo} and ${selectedStudents.length - 2} others`;
    }
  };

  const actualPointsValue = selectedCategory ? selectedCategory.pointValue * points : points;

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Batch Award Points</CardTitle>
          <Badge variant="outline" className="font-normal">
            {studentIds.length} Student{studentIds.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <CardDescription>
          Assign points to multiple students at once
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Students</h3>
          <div className="p-3 bg-slate-50 rounded-md text-sm">
            {isLoadingStudents ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading students...
              </div>
            ) : (
              getStudentNames()
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-1">Behavior Category</h3>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a behavior category" />
            </SelectTrigger>
            <SelectContent>
              {positiveCategories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name} ({category.pointValue} {category.pointValue === 1 ? 'point' : 'points'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-1">Points Multiplier</h3>
          <div className="flex items-center space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={handleDecrementPoints}
              disabled={points <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="w-12 text-center font-medium">× {points}</div>
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={handleIncrementPoints}
              disabled={points >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            {selectedCategory && (
              <div className="ml-3 text-sm text-muted-foreground">
                {selectedCategory.pointValue} × {points} = <span className="font-semibold text-green-600">{actualPointsValue} points</span> per student
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-1">Notes (Optional)</h3>
          <Textarea 
            placeholder="Add notes about this batch award"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        
        {isSubmitting && (
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" />
              <span>
                Awarding points: {successfulAssignments} of {studentIds.length} complete...
              </span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleSubmitAll} 
          disabled={!categoryId || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Awarding...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Award {actualPointsValue * studentIds.length} Points
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}