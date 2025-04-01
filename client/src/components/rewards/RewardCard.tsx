import { FC } from 'react';
import { Reward } from '@shared/schema';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RewardCardProps {
  reward: Reward;
  canAfford: boolean;
  onRedeem: () => void;
  availablePoints?: number;
}

const RewardCard: FC<RewardCardProps> = ({ reward, canAfford, onRedeem, availablePoints = 0 }) => {
  const isOutOfStock = reward.quantity <= 0;
  const pointsNeeded = !canAfford ? reward.pointCost - availablePoints : 0;
  
  return (
    <Card className={!canAfford ? "border-secondary" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Gift className="h-5 w-5 mr-2 text-primary" />
          {reward.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-dark mb-3">{reward.description}</p>
        <div className="flex justify-between items-center">
          <div className={`${canAfford ? 'bg-primary bg-opacity-10 text-primary' : 'bg-destructive bg-opacity-10 text-destructive'} text-sm px-2 py-1 rounded-full font-mono flex items-center`}>
            {reward.pointCost} points
            {!canAfford && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You need {pointsNeeded} more points</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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
              : `Need ${pointsNeeded} More Points`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RewardCard;
