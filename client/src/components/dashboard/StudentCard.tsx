import { FC } from 'react';
import { Progress } from '@/components/ui/progress';

interface StudentCardProps {
  name: string;
  gradeAndHouse: string;
  totalPoints: number;
  goalPercentage: number;
  categoryPoints: {
    academic: number;
    behavior: number;
    extra: number;
  };
}

const StudentCard: FC<StudentCardProps> = ({
  name,
  gradeAndHouse,
  totalPoints,
  goalPercentage,
  categoryPoints
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white">
          <span className="font-semibold">{name.split(' ').map(n => n[0]).join('')}</span>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-neutral-darker">{name}</h3>
          <div className="text-sm text-neutral-dark">{gradeAndHouse}</div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end">
          <div className="text-2xl font-bold font-mono text-primary">{totalPoints}</div>
          <div className="text-xs text-neutral-dark">Total points</div>
        </div>
      </div>
      <div className="mt-3">
        <Progress value={goalPercentage} className="h-2 bg-neutral" />
        <div className="flex justify-between text-xs text-neutral-dark mt-1">
          <span>Monthly Goal</span>
          <span>{goalPercentage}% complete</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-neutral grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-neutral-dark">Academic</div>
          <div className="font-semibold text-neutral-darker font-mono">{categoryPoints.academic}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-dark">Behavior</div>
          <div className="font-semibold text-neutral-darker font-mono">{categoryPoints.behavior}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-dark">Extra</div>
          <div className="font-semibold text-neutral-darker font-mono">{categoryPoints.extra}</div>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;
