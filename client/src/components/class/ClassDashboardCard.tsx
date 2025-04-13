import React from 'react';
import { Award, Trophy, Star } from 'lucide-react';
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

  // Generate random student name for demonstration (in production, this would come from actual data)
  const starStudent = ['Ahmed', 'Sara', 'Liam', 'Emma', 'Noah'][rank % 5];

  // Determine ranking badge
  const getRankBadge = () => {
    if (rank === 0) {
      return (
        <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1 shadow-md">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      );
    } else if (rank === 1) {
      return (
        <div className="absolute -top-2 -right-2 bg-gray-400 rounded-full p-1 shadow-md">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="absolute -top-2 -right-2 bg-amber-700 rounded-full p-1 shadow-md">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Points circle with rank badge */}
      <div className="relative">
        <div 
          className={`${circleColor} w-14 h-14 rounded-full flex items-center justify-center mb-1 text-gray-800 font-bold text-xl shadow-md`}
        >
          {points}
        </div>
        {getRankBadge()}
      </div>
      
      {/* Bar chart column */}
      <div className="flex flex-col items-center">
        <div 
          className={`${barColor} w-16 rounded-t-lg shadow-md flex flex-col justify-end items-center`} 
          style={{ height: `${barHeight}px` }}
        >
          {/* Streak indicator */ }
          <div className="w-full flex justify-center items-center pb-1">
            {rank < 3 && (
              <div className="flex">
                {[...Array(3 - rank)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-white rounded-full mx-0.5" />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Class name and star student */}
        <div className="text-center mt-2 w-full">
          <div className="font-bold text-gray-800">
            {classItem.name}
          </div>
          
          {/* Star student */}
          <div className="mt-1 flex items-center justify-center text-xs">
            <Star className="h-3 w-3 mr-1 text-yellow-500" />
            <span className="text-gray-600">{starStudent}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDashboardCard;