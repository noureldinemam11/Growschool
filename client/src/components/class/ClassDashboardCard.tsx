import React, { useState } from 'react';
import { Class } from '@shared/schema';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocation } from 'wouter';

interface ClassDashboardCardProps {
  classItem: Class;
  points: number;
  rank: number;
  maxPoints?: number; // Used to calculate bar height ratio
  previousPoints?: number; // Optional previous points for trend
}

const ClassDashboardCard: React.FC<ClassDashboardCardProps> = ({ 
  classItem, 
  points, 
  rank,
  maxPoints = 100, // Default max points for scale
  previousPoints = points - Math.floor(Math.random() * 10) // Simulate previous points for demo
}) => {
  const [, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);

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

  // Text colors matching the bar colors
  const textColors = [
    'text-[#00D1B2]', // teal text
    'text-[#FF69B4]', // pink text
    'text-[#FFCC00]', // yellow text
    'text-[#FFCC00]', // yellow text
    'text-[#FFA500]'  // orange text
  ];

  // Use the appropriate color based on rank
  const barColor = barColors[rank < barColors.length ? rank : barColors.length - 1];
  const circleColor = circleColors[rank < circleColors.length ? rank : circleColors.length - 1];
  const textColor = textColors[rank < textColors.length ? rank : textColors.length - 1];

  // Calculate bar height based on points (min 40px height even for 0 points)
  const heightPercentage = Math.max(15, (points / maxPoints) * 100);
  const barHeight = points === 0 ? 40 : Math.max(40, heightPercentage * 1.6); // Scale appropriately with minimum height

  // Calculate trend
  const pointsDifference = points - previousPoints;
  const trendDirection = pointsDifference > 0 ? 'up' : pointsDifference < 0 ? 'down' : 'same';

  // Determine the trend icon and color
  const getTrendIcon = () => {
    if (trendDirection === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trendDirection === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  // Handle click to go to class details
  const handleClick = () => {
    // Navigate to a hypothetical class details page
    setLocation(`/class/${classItem.id}`);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex flex-col items-center group cursor-pointer" 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
          >
            {/* Points circle with trend indicator */}
            <div className="relative">
              <div 
                className={`${circleColor} w-14 h-14 rounded-full flex items-center justify-center mb-1 text-gray-800 font-bold text-xl shadow-sm
                  transition-transform group-hover:scale-110`}
              >
                {points}
              </div>
              
              {/* Trend indicator */}
              <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                {getTrendIcon()}
              </div>
            </div>
            
            {/* Bar chart column */}
            <div className="flex flex-col items-center">
              <div 
                className={`${barColor} w-16 rounded-t-lg shadow-md transition-all duration-300`} 
                style={{ 
                  height: `${barHeight}px`,
                  width: isHovered ? '20px' : '16px',
                  transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)'
                }}
              />
              
              {/* Class name with more details */}
              <div className="text-center mt-2">
                <div className="font-semibold text-gray-800">
                  {classItem.name}
                </div>
                {isHovered && (
                  <Button size="sm" variant="ghost" className={`mt-1 text-xs ${textColor} flex items-center`}>
                    Details <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-4 max-w-xs">
          <div className="space-y-2">
            <h4 className="font-bold">{classItem.name}</h4>
            <p className="text-sm text-gray-600">{classItem.description || "No description available"}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Points</p>
                <p className="font-bold">{points}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Trend</p>
                <div className="flex items-center">
                  {getTrendIcon()}
                  <span className={`ml-1 font-medium ${trendDirection === 'up' ? 'text-green-500' : trendDirection === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                    {pointsDifference === 0 ? 'No change' : `${Math.abs(pointsDifference)} pts`}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Grade</p>
                <p className="font-medium">{classItem.gradeLevel}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Rank</p>
                <p className="font-medium">#{rank + 1}</p>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ClassDashboardCard;