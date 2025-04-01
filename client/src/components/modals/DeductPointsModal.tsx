import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User, BehaviorCategory } from '@shared/schema';
import { Loader2, Plus, Minus } from 'lucide-react';

interface DeductPointsModalProps {
  onClose: () => void;
}

export default function DeductPointsModal({ onClose }: DeductPointsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentId, setStudentId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const { data: students, isLoading: isLoadingStudents } = useQuery<Partial<User>[]>({
    queryKey: ['/api/users/role/student'],
    enabled: !!user
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
    enabled: !!user
  });

  const negativeCategories = categories?.filter(c => !c.isPositive) || [];

  const deductPointsMutation = useMutation({
    mutationFn: async (data: { studentId: number; categoryId: number; points: number; teacherId: number; notes: string }) => {
      const res = await apiRequest("POST", "/api/behavior-points", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Points deducted successfully",
        description: `${points} points have been deducted from the student.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points/recent'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to deduct points",
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

    deductPointsMutation.mutate({
      studentId: parseInt(studentId, 10),
      categoryId: parseInt(categoryId, 10),
      points: -points, // Negative value for deduction
      teacherId: user!.id,
      notes
    });
  };

  const incrementPoints = () => setPoints(prev => Math.min(prev + 1, 10));
  const decrementPoints = () => setPoints(prev => Math.max(prev - 1, 1));

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-xl font-heading font-bold text-error">Deduct Points</DialogTitle>
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
                negativeCategories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name} ({category.pointValue} points)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="points">Points</Label>
          <div className="flex items-center">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-r-none" 
              onClick={decrementPoints}
              disabled={points <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input 
              id="points" 
              type="number" 
              value={points} 
              onChange={(e) => setPoints(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))} 
              className="w-20 text-center rounded-none"
              min="1"
              max="10"
            />
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-l-none" 
              onClick={incrementPoints}
              disabled={points >= 10}
            >
              <Plus className="h-4 w-4" />
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
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
          type="button" 
          onClick={handleSubmit} 
          disabled={deductPointsMutation.isPending}
          className="bg-error text-white hover:bg-error/90"
        >
          {deductPointsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Deduct Points'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
