import { FC, ReactNode } from 'react';

interface OverviewCardProps {
  title: string;
  value: number;
  changeText: string;
  changeType: 'positive' | 'negative';
  icon: ReactNode;
  subtitle: string;
  subtitleValue: string;
}

const OverviewCard: FC<OverviewCardProps> = ({
  title,
  value,
  changeText,
  changeType,
  icon,
  subtitle,
  subtitleValue
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-heading text-neutral-dark">{title}</h3>
        <span className={`
          ${changeType === 'positive' ? 'bg-success bg-opacity-10 text-success' : 'bg-error bg-opacity-10 text-error'} 
          text-xs px-2 py-1 rounded-full
        `}>
          {changeText}
        </span>
      </div>
      <div className="flex items-center">
        <div className="text-4xl font-heading font-bold text-neutral-darker font-mono">{value}</div>
        <div className={`ml-auto ${changeType === 'positive' ? 'bg-primary' : 'bg-error'} text-white p-2 rounded-full`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 text-sm text-neutral-dark">
        <span className="font-semibold">{subtitleValue}</span> {subtitle}
      </div>
    </div>
  );
};

export default OverviewCard;
