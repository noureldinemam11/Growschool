import { FC } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/redemptions/student/' + user?.id] });
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
      </DialogHeader>
      
      <div className="py-4">
        <div className="bg-neutral p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-semibold text-lg">{reward.name}</h3>
            <div className="bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-full text-sm font-mono">
              {reward.pointCost} points
            </div>
          </div>
          <p className="text-neutral-dark">{reward.description}</p>
        </div>
        
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-neutral-darker">Your available points:</span>
          <span className="font-mono font-semibold text-primary">{availablePoints}</span>
        </div>
        
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-neutral-darker">Cost:</span>
          <span className="font-mono font-semibold">{reward.pointCost}</span>
        </div>
        
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-neutral-darker">Remaining after purchase:</span>
          <span className="font-mono font-semibold text-neutral-darker">{availablePoints - reward.pointCost}</span>
        </div>
        
        <div className="flex items-center justify-between py-2">
          <span className="text-neutral-darker">Quantity available:</span>
          <span className={`font-mono font-semibold ${isOutOfStock ? 'text-error' : ''}`}>
            {reward.quantity}
          </span>
        </div>
        
        {!canAfford && (
          <div className="mt-4 bg-error bg-opacity-10 text-error p-3 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Not enough points</p>
              <p className="text-sm">
                You need {reward.pointCost - availablePoints} more points to redeem this reward.
              </p>
            </div>
          </div>
        )}
        
        {isOutOfStock && (
          <div className="mt-4 bg-error bg-opacity-10 text-error p-3 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Out of stock</p>
              <p className="text-sm">
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
