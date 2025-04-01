import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { insertBehaviorPointSchema, User, BehaviorCategory } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PointsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PointsModal({ isOpen, onClose }: PointsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [points, setPoints] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  
  // Fetch students
  const { data: students, isLoading: loadingStudents } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });

  const assignPointMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/behavior-points', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Points assigned",
        description: `${points} points have been awarded to the student.`,
      });
      
      // Reset form
      setSelectedStudent(null);
      setSelectedCategory(null);
      setPoints(1);
      setNotes("");
      
      // Close modal
      onClose();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign points. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!selectedStudent || !selectedCategory) {
      toast({
        title: "Missing information",
        description: "Please select both a student and a behavior category.",
        variant: "destructive",
      });
      return;
    }

    assignPointMutation.mutate({
      studentId: selectedStudent,
      categoryId: selectedCategory,
      points: points,
      notes: notes || undefined,
    });
  };

  const incrementPoints = () => {
    setPoints(points + 1);
  };

  const decrementPoints = () => {
    if (points > 1) {
      setPoints(points - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Award Points</DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground mb-4">
          Recognize positive student behavior by awarding points.
        </div>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="student">Student</Label>
            <Select 
              value={selectedStudent?.toString() || ""} 
              onValueChange={(value) => setSelectedStudent(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.firstName} {student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category">Behavior Category</Label>
            <Select 
              value={selectedCategory?.toString() || ""} 
              onValueChange={(value) => setSelectedCategory(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="points">Points</Label>
            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={decrementPoints}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input 
                id="points"
                type="number" 
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                className="w-20 text-center" 
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={incrementPoints}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea 
              id="notes"
              placeholder="Enter details about this behavior..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={assignPointMutation.isPending || !selectedStudent || !selectedCategory}
            className="ml-2"
          >
            {assignPointMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Award Points'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}