import { FC } from 'react';
import { House } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HouseCardProps {
  house: House;
  isSelected: boolean;
  onClick: () => void;
}

const HouseCard: FC<HouseCardProps> = ({ house, isSelected, onClick }) => {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md overflow-hidden",
        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
      )}
      onClick={onClick}
    >
      <div className="h-2" style={{ backgroundColor: house.color }}></div>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-neutral-darker">{house.name}</h3>
            <p className="text-sm text-neutral-dark line-clamp-1">{house.description || 'No description'}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="font-mono font-bold text-primary text-xl">{house.points.toLocaleString()}</div>
            <div className="text-xs text-neutral-dark">Points</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HouseCard;
