import React from 'react';
import { Trophy } from 'lucide-react';
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
  // Get color for the class - either from database or fallback
  const getClassColor = () => {
    // First priority: use the color from the database
    if (classItem.color) {
      return classItem.color;
    }
    
    // Fallback colors if database color doesn't exist
    const fallbackColors: { [key: string]: string } = {
      '9L': '#00D1B2', // teal
      '9M': '#FF69B4', // pink
      '10A': '#FFB800', // amber/gold
      '9K': '#59B5F8', // blue
      '10B': '#A459F8', // purple
    };
    
    return fallbackColors[classItem.name] || '#00D1B2';
  };

  // Get the actual color (hex value)
  const classColorHex = getClassColor();

  // Calculate bar height based on points (min 40px height even for 0 points)
  const heightPercentage = Math.max(15, (points / maxPoints) * 100);
  const barHeight = points === 0 ? 40 : Math.max(40, heightPercentage * 1.6); // Scale appropriately with minimum height

  // Get medal badge for top 3 - these are based on rank, not class positions
  const getMedalBadge = () => {
    if (rank === 0) {
      return (
        <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1 shadow-md flex items-center justify-center">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      );
    } else if (rank === 1) {
      return (
        <div className="absolute -top-2 -right-2 bg-gray-400 rounded-full p-1 shadow-md flex items-center justify-center">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="absolute -top-2 -right-2 bg-amber-700 rounded-full p-1 shadow-md flex items-center justify-center">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Points circle with medal badge */}
      <div className="relative">
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center mb-1 text-white font-bold text-xl shadow-md"
          style={{ backgroundColor: classColorHex }}
        >
          {points}
        </div>
        {getMedalBadge()}
      </div>
      
      {/* Bar chart column */}
      <div className="flex flex-col items-center">
        <div 
          className="w-16 rounded-t-lg shadow-md flex flex-col justify-end items-center transition-all duration-500" 
          style={{ 
            height: `${barHeight}px`,
            backgroundColor: classColorHex 
          }}
        >
          {/* Streak indicator dots - shown for top 3 ranks */}
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
        
        {/* Class name and grade level */}
        <div className="text-center mt-2 w-full">
          <div className="font-bold text-gray-800">
            {classItem.name}
          </div>
          <div className="text-xs text-gray-500">
            {classItem.gradeLevel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDashboardCard;