import React, { useState } from 'react';
import { User, BehaviorCategory, insertBehaviorPointSchema } from '@shared/schema';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Grid, CheckSquare, Shuffle, List, XCircle, MoreHorizontal, ArrowRight, Check, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface StudentGridProps {
  onSelectStudent: (studentId: number) => void;
  selectedDate?: Date;
  teacherFilter?: number;
}

export default function StudentGrid({ onSelectStudent, selectedDate, teacherFilter }: StudentGridProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [teacherFilterType, setTeacherFilterType] = useState<string>('all');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [points, setPoints] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  
  // Fetch students (only role=student)
  const { data: students, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });
  
  // Fetch behavior categories
  const { data: categories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });
  
  // Get positive behavior categories for batch assignments
  const positiveCategories = categories?.filter(c => c.isPositive) || [];

  const toggleStudentSelection = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const selectAll = () => {
    if (students) {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const deselectAll = () => {
    setSelectedStudents([]);
  };

  const selectRandom = () => {
    if (students && students.length > 0) {
      const randomIndex = Math.floor(Math.random() * students.length);
      setSelectedStudents([students[randomIndex].id]);
    }
  };

  const handleContinue = () => {
    if (selectedStudents.length === 1) {
      onSelectStudent(selectedStudents[0]);
    } else if (selectedStudents.length > 1) {
      // Open batch assignment modal
      setIsBatchModalOpen(true);
    }
  };
  
  // Batch assignment mutation
  const batchAssignMutation = useMutation({
    mutationFn: async (data: { points: any[] }) => {
      const res = await apiRequest('POST', '/api/behavior-points/batch', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Points assigned successfully",
        description: `Assigned points to ${data.count} students.`,
      });
      
      // Reset form and close modal
      setSelectedCategory(null);
      setPoints(1);
      setNotes('');
      setIsBatchModalOpen(false);
      setSelectedStudents([]);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/teacher'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    },
    onError: (error) => {
      toast({
        title: "Error assigning points",
        description: "There was an error assigning points to students. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
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
          <span className="text-sm font-medium">Showing points earned</span>
          <Select
            defaultValue="today"
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Today" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm font-medium">given by</span>
          <Select
            value={teacherFilterType}
            onValueChange={setTeacherFilterType}
          >
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="All Teachers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              <SelectItem value="me">Only Me</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm">
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {students?.map((student) => (
          <Card 
            key={student.id}
            className={cn(
              "cursor-pointer transition-all border-2",
              selectedStudents.includes(student.id) 
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

      <div className="mt-6 flex justify-center">
        <div className="rounded-full border border-gray-200 bg-white p-1 flex items-center">
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
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <XCircle className="h-4 w-4" />
            <span>Absent</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span>More</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={handleContinue}
            disabled={selectedStudents.length === 0}
          >
            <ArrowRight className="h-4 w-4" />
            <span>Continue</span>
          </Button>
        </div>
      </div>
      
      {/* Batch Points Assignment Modal */}
      <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Award Points to Multiple Students</DialogTitle>
            <DialogDescription>
              You're about to award points to {selectedStudents.length} students.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                  <XCircle className="h-4 w-4" />
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
              onClick={() => setIsBatchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedCategory) {
                  toast({
                    title: "Please select a category",
                    description: "You must select a behavior category before awarding points.",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Get the category details
                const category = categories?.find(c => c.id === selectedCategory);
                if (!category) {
                  toast({
                    title: "Category Error",
                    description: "The selected category could not be found.",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Create points data for each selected student
                const pointsData = selectedStudents.map(studentId => ({
                  studentId,
                  categoryId: selectedCategory,
                  points: category.pointValue * points, // Multiply by the points multiplier
                  teacherId: user?.id,
                  notes: notes || undefined
                }));
                
                // Submit the batch mutation
                batchAssignMutation.mutate({ points: pointsData });
              }}
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
    </div>
  );
}