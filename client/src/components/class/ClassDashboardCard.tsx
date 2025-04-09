import React from 'react';
import { Class } from '@shared/schema';

interface ClassDashboardCardProps {
  classItem: Class;
  points: number;
  rank: number;
  maxPoints?: number; // Used to calculate bar height ratio
}

const ClassDashboardCard: React.FC<ClassDashboardCardProps> = ({ 
  classItem, 
  points, 
  rank,
  maxPoints = 100 // Default max points for scale
}) => {
  // Define background colors based on the new design image
  const barColors = [
    'bg-[#00D1B2]', // bright teal for 1st place
    'bg-[#FF69B4]', // bright pink for 2nd place
    'bg-[#FFCC00]', // yellow for 3rd place
    'bg-[#FFCC00]', // yellow for 4th place
    'bg-[#FFA500]'  // orange for 5th place
  ];
  
  // Circle colors based on rank - matching the design image
  const circleColors = [
    'bg-[#00D1B2]', // teal for 1st
    'bg-[#FF69B4]', // pink for 2nd
    'bg-[#FFCC00]', // yellow for 3rd/4th
    'bg-[#FFCC00]', // yellow for 3rd/4th
    'bg-[#FFA500]', // orange for 5th
  ];

  // Use the appropriate color based on rank
  const barColor = barColors[rank < barColors.length ? rank : barColors.length - 1];
  const circleColor = circleColors[rank < circleColors.length ? rank : circleColors.length - 1];

  // Calculate bar height based on points (min 40px height even for 0 points)
  const heightPercentage = Math.max(15, (points / maxPoints) * 100);
  const barHeight = points === 0 ? 40 : Math.max(40, heightPercentage * 1.6); // Scale appropriately with minimum height

  return (
    <div className="flex flex-col items-center">
      {/* Points circle */}
      <div 
        className={`${circleColor} w-14 h-14 rounded-full flex items-center justify-center mb-1 text-gray-800 font-bold text-xl shadow-sm`}
      >
        {points}
      </div>
      
      {/* Bar chart column */}
      <div className="flex flex-col items-center">
        <div 
          className={`${barColor} w-16 rounded-t-lg shadow-md`} 
          style={{ height: `${barHeight}px` }}
        />
        
        {/* Class name only */}
        <div className="text-center mt-2">
          <div className="font-semibold text-gray-700">
            {classItem.name}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDashboardCard;