import React, { useState } from 'react';
import { User, BehaviorCategory } from '@shared/schema';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Grid, Shuffle, List, XCircle, MoreHorizontal, ArrowRight, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Direct batch points assignment implementation
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface StudentGridProps {
  onSelectStudent: (studentId: number) => void;
  selectedDate?: Date;
  teacherFilter?: number;
}

export default function StudentGrid({ onSelectStudent, selectedDate, teacherFilter }: StudentGridProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for student selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [teacherFilterType, setTeacherFilterType] = useState<string>('all');
  
  // State for direct batch assignment dialog
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [pointsMultiplier, setPointsMultiplier] = useState(1);
  const [notes, setNotes] = useState('');
  
  // Fetch students (only role=student)
  const { data: students, isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });
  
  // Fetch behavior categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });

  // Get only positive categories
  const positiveCategories = categories?.filter(c => c.isPositive) || [];

  // Toggle student selection
  const toggleStudentSelection = (studentId: number) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const selectAll = () => {
    if (students) {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const deselectAll = () => {
    setSelectedStudentIds([]);
  };

  const selectRandom = () => {
    if (students && students.length > 0) {
      const randomIndex = Math.floor(Math.random() * students.length);
      setSelectedStudentIds([students[randomIndex].id]);
    }
  };

  // Handle continue button - either select single student or open batch dialog
  const handleContinue = () => {
    if (selectedStudentIds.length === 1) {
      onSelectStudent(selectedStudentIds[0]);
    } else if (selectedStudentIds.length > 1) {
      // Instead of using modal component, directly open our dialog
      setBatchDialogOpen(true);
    }
  };

  // Create a direct batch points mutation
  const batchAssignMutation = useMutation({
    mutationFn: async (pointsArray: any[]) => {
      console.log('Direct Batch Points Request:', { points: pointsArray });
      
      try {
        const res = await fetch('/api/behavior-points/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: pointsArray }),
          credentials: 'include',
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Error: ${errorText}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error('Batch points error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: `Points assigned to ${selectedStudentIds.length} students.`,
      });
      
      // Reset dialog state and selection
      setBatchDialogOpen(false);
      setSelectedCategory(null);
      setPointsMultiplier(1);
      setNotes('');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/teacher'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error assigning points",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Handle the batch points assignment
  const handleBatchAssign = () => {
    if (!selectedCategory) {
      toast({
        title: "No category selected",
        description: "Please select a behavior category",
        variant: "destructive"
      });
      return;
    }
    
    if (!user?.id) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to assign points",
        variant: "destructive"
      });
      return;
    }
    
    const category = categories?.find(c => c.id === selectedCategory);
    if (!category) return;
    
    const pointValue = category.pointValue * pointsMultiplier;
    
    const pointsArray = selectedStudentIds.map(studentId => ({
      studentId,
      categoryId: selectedCategory,
      points: pointValue,
      teacherId: user.id,
      notes: notes || undefined
    }));
    
    batchAssignMutation.mutate(pointsArray);
  };
  
  // Show loading indicator while students are loading
  if (studentsLoading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Showing students by</span>
          <Select
            defaultValue="all"
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="class">Class</SelectItem>
              <SelectItem value="grade">Grade</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm">
          Filter Options
        </Button>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {students?.map((student) => (
          <Card 
            key={student.id}
            className={cn(
              "cursor-pointer transition-all border-2",
              selectedStudentIds.includes(student.id) 
                ? "border-primary bg-primary/5" 
                : "hover:border-gray-400"
            )}
            onClick={() => toggleStudentSelection(student.id)}
          >
            <CardContent className="p-4">
              <div className="uppercase font-semibold text-primary">{student.firstName}</div>
              <div className="text-sm text-gray-500">{student.lastName}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selection Tools */}
      <div className="mt-6 flex justify-center">
        <div className="rounded-full border border-gray-200 bg-white p-1 flex items-center gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={selectAll}
          >
            <Grid className="h-4 w-4" />
            <span>Select All</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={deselectAll}
          >
            <XCircle className="h-4 w-4" />
            <span>Deselect</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={selectRandom}
          >
            <Shuffle className="h-4 w-4" />
            <span>Random</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <List className="h-4 w-4" />
            <span>Timeline</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="rounded-full flex items-center gap-1 ml-2 bg-primary hover:bg-primary/90"
            onClick={handleContinue}
            disabled={selectedStudentIds.length === 0}
          >
            <ArrowRight className="h-4 w-4" />
            <span>Continue</span>
          </Button>
        </div>
      </div>
      
      {/* Debug selectedStudentIds */}
      {selectedStudentIds.length > 0 && (
        <div className="mt-4 p-2 bg-muted/20 rounded-md text-sm">
          <div className="font-medium">Selected Students: {selectedStudentIds.length}</div>
          <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis">
            IDs: {selectedStudentIds.join(', ')}
          </div>
        </div>
      )}
      
      {/* Batch Points Assignment Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Points to {selectedStudentIds.length} Students</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
                  {positiveCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name} ({category.pointValue} points)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCategory && (
              <div className="grid gap-2">
                <Label htmlFor="multiplier">Point Multiplier</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="multiplier"
                    type="number"
                    min={1}
                    max={5}
                    value={pointsMultiplier}
                    onChange={(e) => setPointsMultiplier(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedCategory && categories ? 
                      `(${categories.find(c => c.id === selectedCategory)?.pointValue || 0} × ${pointsMultiplier} = 
                      ${(categories.find(c => c.id === selectedCategory)?.pointValue || 0) * pointsMultiplier} points per student)` 
                      : ''}
                  </span>
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Enter a note about this assignment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBatchDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBatchAssign}
              disabled={!selectedCategory || batchAssignMutation.isPending}
              className="gap-1"
            >
              {batchAssignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Award className="h-4 w-4" />
              )}
              Assign Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}