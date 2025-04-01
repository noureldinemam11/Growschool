import { FC, useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Reward, User } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';

interface AdminRedeemRewardModalProps {
  reward: Reward;
  onClose: () => void;
}

const AdminRedeemRewardModal: FC<AdminRedeemRewardModalProps> = ({ reward, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentPointsBalance, setStudentPointsBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  
  const isOutOfStock = reward.quantity <= 0;

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
    enabled: user?.role === 'admin' || user?.role === 'teacher'
  });

  // Fetch student's points balance when a student is selected
  useEffect(() => {
    const fetchStudentBalance = async () => {
      if (!selectedStudentId) {
        setStudentPointsBalance(null);
        return;
      }
      
      setIsLoadingBalance(true);
      try {
        const res = await apiRequest('GET', `/api/students/${selectedStudentId}/points-balance`);
        const data = await res.json();
        setStudentPointsBalance(data.balance);
      } catch (error) {
        console.error('Error fetching student balance:', error);
        setStudentPointsBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    fetchStudentBalance();
  }, [selectedStudentId]);

  const canAfford = studentPointsBalance !== null && studentPointsBalance >= reward.pointCost;

  const redeemRewardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/rewards/redeem-for-student', {
        rewardId: reward.id,
        studentId: Number(selectedStudentId),
        awardedById: user?.id
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reward Redeemed!",
        description: `You've successfully redeemed ${reward.name} for the student.`
      });
      // Invalidate queries to refresh the rewards and redemptions
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/redemptions/student/' + selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/' + selectedStudentId + '/points-balance'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl font-heading font-bold">Redeem Reward for Student</DialogTitle>
        <DialogDescription>
          Exchange student points for a reward from the store.
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        <div className="bg-neutral p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-semibold text-lg">{reward.name}</h3>
            <div className="bg-primary text-white font-bold px-3 py-1.5 rounded-md text-sm font-mono shadow-sm">
              {reward.pointCost} points
            </div>
          </div>
          <p className="text-neutral-dark">{reward.description}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="student-select">Select Student</Label>
            <Select 
              value={selectedStudentId} 
              onValueChange={handleStudentChange}
              disabled={isLoadingStudents || redeemRewardMutation.isPending}
            >
              <SelectTrigger id="student-select" className="w-full">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map(student => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.firstName} {student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedStudentId && (
            <>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700 font-medium">Student's available points:</span>
                <span className="font-mono font-bold text-primary text-lg">
                  {isLoadingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin inline-block" />
                  ) : (
                    studentPointsBalance
                  )}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700 font-medium">Cost:</span>
                <span className="font-mono font-bold text-red-600 text-lg">-{reward.pointCost}</span>
              </div>
              
              {studentPointsBalance !== null && (
                <div className="flex items-center justify-between py-3 border-b bg-blue-50 px-3 rounded">
                  <span className="text-gray-700 font-medium">Remaining after purchase:</span>
                  <span className="font-mono font-bold text-primary text-lg">
                    {studentPointsBalance - reward.pointCost}
                  </span>
                </div>
              )}
            </>
          )}
          
          <div className="flex items-center justify-between py-3 mt-1">
            <span className="text-gray-700 font-medium">Quantity available:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {reward.quantity}
            </span>
          </div>
          
          {selectedStudentId && !canAfford && studentPointsBalance !== null && (
            <div className="mt-4 bg-red-100 border border-red-200 p-4 rounded-md flex items-start">
              <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold text-red-700">Not enough points</p>
                <p className="text-sm text-red-600 mt-1">
                  The student needs <span className="font-bold">{reward.pointCost - studentPointsBalance}</span> more points to redeem this reward.
                </p>
              </div>
            </div>
          )}
          
          {isOutOfStock && (
            <div className="mt-4 bg-red-100 border border-red-200 p-4 rounded-md flex items-start">
              <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold text-red-700">Out of stock</p>
                <p className="text-sm text-red-600 mt-1">
                  This reward is currently unavailable. Please check back later.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <DialogFooter className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button 
          onClick={() => redeemRewardMutation.mutate()}
          disabled={!selectedStudentId || !canAfford || isOutOfStock || redeemRewardMutation.isPending || isLoadingBalance}
          className="flex-1"
        >
          {redeemRewardMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Confirm Redemption
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default AdminRedeemRewardModal;