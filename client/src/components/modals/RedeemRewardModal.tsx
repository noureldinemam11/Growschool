import { FC } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Reward } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';

interface RedeemRewardModalProps {
  reward: Reward;
  availablePoints: number;
  onClose: () => void;
}

const RedeemRewardModal: FC<RedeemRewardModalProps> = ({ reward, availablePoints, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const canAfford = availablePoints >= reward.pointCost;
  const isOutOfStock = reward.quantity <= 0;

  const redeemRewardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/rewards/redeem', {
        rewardId: reward.id,
        studentId: user?.id
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reward Redeemed!",
        description: `You've successfully redeemed ${reward.name}. A teacher will deliver it to you soon.`
      });
      // Invalidate queries to refresh the rewards, redemptions, and points balance
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/redemptions/student/' + user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/' + user?.id + '/points-balance'] });
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

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl font-heading font-bold">Redeem Reward</DialogTitle>
        <DialogDescription>
          Exchange your earned points for a reward from the store.
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
        
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-700 font-medium">Your available points:</span>
          <span className="font-mono font-bold text-primary text-lg">{availablePoints}</span>
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-700 font-medium">Cost:</span>
          <span className="font-mono font-bold text-red-600 text-lg">-{reward.pointCost}</span>
        </div>
        
        <div className="flex items-center justify-between py-3 border-b bg-blue-50 px-3 rounded">
          <span className="text-gray-700 font-medium">Remaining after purchase:</span>
          <span className="font-mono font-bold text-primary text-lg">{availablePoints - reward.pointCost}</span>
        </div>
        
        <div className="flex items-center justify-between py-3 mt-1">
          <span className="text-gray-700 font-medium">Quantity available:</span>
          <span className={`font-mono font-bold px-2 py-0.5 rounded ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {reward.quantity}
          </span>
        </div>
        
        {!canAfford && (
          <div className="mt-4 bg-red-100 border border-red-200 p-4 rounded-md flex items-start">
            <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold text-red-700">Not enough points</p>
              <p className="text-sm text-red-600 mt-1">
                You need <span className="font-bold">{reward.pointCost - availablePoints}</span> more points to redeem this reward.
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
      
      <DialogFooter className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button 
          onClick={() => redeemRewardMutation.mutate()}
          disabled={!canAfford || isOutOfStock || redeemRewardMutation.isPending}
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

export default RedeemRewardModal;
