import { FC } from 'react';
import { Reward } from '@shared/schema';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';

interface RewardCardProps {
  reward: Reward;
  canAfford: boolean;
  onRedeem: () => void;
}

const RewardCard: FC<RewardCardProps> = ({ reward, canAfford, onRedeem }) => {
  const isOutOfStock = reward.quantity <= 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Gift className="h-5 w-5 mr-2 text-primary" />
          {reward.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-dark mb-3">{reward.description}</p>
        <div className="flex justify-between items-center">
          <div className="bg-primary bg-opacity-10 text-primary text-sm px-2 py-1 rounded-full font-mono">
            {reward.pointCost} points
          </div>
          <div className="text-xs text-neutral-dark">
            {reward.quantity} remaining
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full" 
          variant={canAfford && !isOutOfStock ? "default" : "outline"}
          disabled={!canAfford || isOutOfStock}
          onClick={onRedeem}
        >
          {isOutOfStock 
            ? "Out of Stock" 
            : canAfford 
              ? "Redeem Reward" 
              : "Not Enough Points"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RewardCard;
