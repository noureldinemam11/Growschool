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
          {/* Higher contrast for point cost */}
          <div className={`
            ${canAfford 
              ? 'bg-primary text-white' 
              : 'bg-destructive text-white'
            } 
            text-sm px-4 py-1.5 rounded-md font-mono font-bold flex items-center shadow-sm
          `}>
            {reward.pointCost} points
            {!canAfford && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-1">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">You need {pointsNeeded} more points</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded font-medium text-gray-700">
            {reward.quantity} remaining
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full font-semibold text-white"
          variant={canAfford && !isOutOfStock ? "default" : "outline"}
          disabled={isOutOfStock}
          onClick={canAfford ? onRedeem : undefined}
        >
          {isOutOfStock 
            ? "Out of Stock" 
            : canAfford 
              ? "Redeem Reward" 
              : (
                <span className="flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Need <strong>{pointsNeeded}</strong> More Points</span>
                </span>
              )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RewardCard;
