import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient, globalEventBus } from '@/lib/queryClient';
import { User, BehaviorCategory } from '@shared/schema';
import { Loader2, Plus, Minus } from 'lucide-react';
import { sendWebSocketMessage } from '@/lib/websocket';

interface AwardPointsModalProps {
  onClose: () => void;
  preSelectedStudentId?: string | null;
}

export default function AwardPointsModal({ onClose, preSelectedStudentId }: AwardPointsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentId, setStudentId] = useState<string>(preSelectedStudentId || '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [selectedCategoryRef, setSelectedCategoryRef] = useState<BehaviorCategory | null>(null);

  const { data: students, isLoading: isLoadingStudents } = useQuery<Partial<User>[]>({
    queryKey: ['/api/users/role/student'],
    enabled: !!user
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
    enabled: !!user
  });

  const positiveCategories = categories?.filter(c => c.isPositive) || [];

  const awardPointsMutation = useMutation({
    mutationFn: async (data: { studentId: number; categoryId: number; points: number; teacherId: number; notes: string }) => {
      const res = await apiRequest("POST", "/api/behavior-points", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Points awarded successfully",
        description: `${selectedCategoryRef?.pointValue || 0} × ${points} = ${(selectedCategoryRef?.pointValue || 0) * points} points have been awarded to the student.`
      });
      
      // Invalidate all affected queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] }); // Refresh house standings
      queryClient.invalidateQueries({ queryKey: ['/api/classes/points'] }); // Refresh class points
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] }); // Refresh pod data
      
      // Invalidate the selected student's points specifically
      const studentIdNum = parseInt(studentId, 10);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/behavior-points/student', studentIdNum]
      });
      
      // Trigger event bus for immediate UI updates
      globalEventBus.publish('points-updated');
      globalEventBus.publish(`student-${studentIdNum}-updated`);
      globalEventBus.publish('class-updated');
      globalEventBus.publish('pod-updated');
      
      // Try to send WebSocket message for real-time updates to other users
      try {
        sendWebSocketMessage('points-updated', { 
          studentId: studentIdNum,
          pointsAdded: (selectedCategoryRef?.pointValue || 0) * points
        });
      } catch (error) {
        console.warn('WebSocket message not sent:', error);
      }
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to award points",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!studentId || !categoryId) {
      toast({
        title: "Missing information",
        description: "Please select both a student and a behavior category.",
        variant: "destructive"
      });
      return;
    }

    // Get the selected category to use its point value
    const selectedCategory = positiveCategories.find(cat => cat.id.toString() === categoryId);
    if (!selectedCategory) {
      toast({
        title: "Category Error",
        description: "Could not find the selected category",
        variant: "destructive"
      });
      return;
    }

    // Save the selected category for the success message
    setSelectedCategoryRef(selectedCategory);

    // Use the actual point value from the category (should be positive)
    // Multiply by the points multiplier the user selected
    awardPointsMutation.mutate({
      studentId: parseInt(studentId, 10),
      categoryId: parseInt(categoryId, 10),
      points: selectedCategory.pointValue * points,
      teacherId: user!.id,
      notes
    });
  };

  const incrementPoints = () => setPoints(prev => Math.min(prev + 1, 10));
  const decrementPoints = () => setPoints(prev => Math.max(prev - 1, 1));

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-xl font-heading font-bold text-primary">Award Points</DialogTitle>
        <DialogDescription>
          Recognize positive student behavior by awarding points.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="student-select">Student</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger id="student-select">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingStudents ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading students...</span>
                </div>
              ) : (
                students && students.map(student => (
                  <SelectItem key={student.id} value={student.id!.toString()}>
                    {student.firstName} {student.lastName} - Grade {student.gradeLevel}{student.section}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category-select">Behavior Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category-select">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCategories ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading categories...</span>
                </div>
              ) : (
                positiveCategories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name} ({category.pointValue} points)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="points">Points Multiplier (1-10)</Label>
          <div className="flex items-center">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-r-none h-12 w-12 text-lg" 
              onClick={decrementPoints}
              disabled={points <= 1}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <Input 
              id="points" 
              type="number" 
              value={points} 
              onChange={(e) => setPoints(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))} 
              className="w-20 text-center rounded-none h-12 text-lg font-medium"
              min="1"
              max="10"
            />
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-l-none h-12 w-12 text-lg" 
              onClick={incrementPoints}
              disabled={points >= 10}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea 
            id="notes" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="Enter details about this behavior..."
            rows={3}
          />
        </div>
      </div>
      
      {/* Mobile-friendly footer with sticky submit button */}
      <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 pb-2">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto order-2 sm:order-1">
          Cancel
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit} 
          disabled={awardPointsMutation.isPending}
          className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2 h-12 text-base font-medium"
        >
          {awardPointsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Award Points'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
