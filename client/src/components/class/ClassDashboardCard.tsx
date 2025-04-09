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
  // Define background colors based on design
  const barColors = [
    'bg-[#22D3B6]', // teal for 1st place
    'bg-[#FF69B4]', // bright pink for 2nd place
    'bg-[#FFCC00]', // yellow for 3rd place
    'bg-[#FFCC00]', // yellow for 4th place
    'bg-[#FFA500]'  // orange for 5th place
  ];
  
  // Circle colors based on rank
  const circleColors = [
    'bg-[#22D3B6]', // teal for 1st
    'bg-[#FF69B4]', // pink for 2nd
    'bg-[#FFCC00]', // yellow for 3rd/4th
    'bg-[#FFCC00]', // yellow for 3rd/4th
    'bg-[#FFA500]', // orange for 5th
  ];

  // Use the appropriate color based on rank
  const barColor = barColors[rank < barColors.length ? rank : barColors.length - 1];
  const circleColor = circleColors[rank < circleColors.length ? rank : circleColors.length - 1];

  // Calculate bar height based on points (min 20% height even for 0 points)
  const heightPercentage = Math.max(20, (points / maxPoints) * 100);
  const barHeight = Math.max(60, heightPercentage * 2); // Scale it appropriately, min 60px

  return (
    <div className="flex flex-col items-center">
      {/* Points circle */}
      <div 
        className={`${circleColor} w-16 h-16 rounded-full flex items-center justify-center mb-2 text-[#333333] font-bold text-2xl`}
      >
        {points}
      </div>
      
      {/* Bar chart column */}
      <div className="flex flex-col items-center">
        <div 
          className={`${barColor} w-20 rounded-t-lg`} 
          style={{ height: `${barHeight}px` }}
        />
        
        {/* Class name and grade level */}
        <div className="text-center mt-2">
          <div className="font-semibold text-gray-800">
            Class {classItem.name}
          </div>
          <div className="text-sm text-gray-600">
            Grade {classItem.gradeLevel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDashboardCard;