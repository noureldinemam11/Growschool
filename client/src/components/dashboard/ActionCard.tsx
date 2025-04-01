import { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: 'primary' | 'error' | 'secondary' | 'accent';
  onClick: () => void;
}

const colorVariants = {
  primary: {
    border: 'border-primary',
    bgLight: 'bg-primary bg-opacity-10',
    iconColor: 'text-primary'
  },
  error: {
    border: 'border-error',
    bgLight: 'bg-error bg-opacity-10',
    iconColor: 'text-error'
  },
  secondary: {
    border: 'border-secondary',
    bgLight: 'bg-secondary bg-opacity-10',
    iconColor: 'text-secondary'
  },
  accent: {
    border: 'border-accent',
    bgLight: 'bg-accent bg-opacity-10',
    iconColor: 'text-accent'
  }
};

const ActionCard: FC<ActionCardProps> = ({ title, description, icon, color, onClick }) => {
  const colorClasses = colorVariants[color];
  
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-sm p-4 border-l-4 cursor-pointer hover:shadow-md transition-shadow",
        colorClasses.border
      )}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={cn("p-3 rounded-lg", colorClasses.bgLight)}>
          <div className={colorClasses.iconColor}>
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <h3 className="font-heading font-bold text-neutral-darker">{title}</h3>
          <p className="text-sm text-neutral-dark">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default ActionCard;
