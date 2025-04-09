import React from 'react';
import { Class } from '@shared/schema';

interface ClassDashboardCardProps {
  classItem: Class;
  points: number;
  rank: number;
  gaining?: boolean;
}

const ClassDashboardCard: React.FC<ClassDashboardCardProps> = ({ 
  classItem, 
  points, 
  rank,
  gaining = false
}) => {
  // Define background colors based on design
  const backgrounds = [
    'bg-[#22D3B6]', // teal for 1st place
    'bg-[#F47FB0]', // pink for 2nd place
    'bg-[#F39765]', // orange for 3rd place
    'bg-[#F9C74F]'  // yellow for 4th place
  ];
  
  // Medal colors based on rank
  const medalColors = [
    'bg-[#FFB800]', // gold
    'bg-[#ACACAC]', // silver
    'bg-[#C87137]', // bronze
    'bg-gray-200'   // default
  ];
  
  // Number text colors based on rank
  const numberColors = [
    'text-[#0F4C81]', // blue for 1st place
    'text-[#0F4C81]', // blue for 2nd place
    'text-[#0F4C81]', // blue for 3rd place
    'text-[#0F4C81]'  // blue for 4th place (used orangeish color in design)
  ];

  // Use the appropriate background color based on rank
  const bgColor = backgrounds[rank < backgrounds.length ? rank : backgrounds.length - 1];
  const medalColor = medalColors[rank < medalColors.length ? rank : medalColors.length - 1];
  const numColor = numberColors[rank < numberColors.length ? rank : numberColors.length - 1];

  return (
    <div className={`${bgColor} rounded-lg p-6 flex flex-col items-center text-center relative`}>
      {/* Medal badge */}
      <div className={`${medalColor} rounded-full w-14 h-14 flex items-center justify-center absolute -top-5 ring-4 ring-white`}>
        <span className="font-bold text-white text-xl">{rank + 1}</span>
      </div>
      
      {/* Points */}
      <div className={`${numColor} font-bold text-6xl mt-8`}>
        {points}
      </div>
      
      {/* Class name */}
      <div className="text-[#0F4C81] font-bold text-xl mt-2">
        Class {classItem.name}
      </div>
      
      {/* Grade level */}
      <div className="text-[#0F4C81] mt-1">
        Grade {classItem.gradeLevel}
      </div>
      
      {/* Trophy or gaining badge */}
      {rank === 0 ? (
        <div className="mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0F4C81]">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
          </svg>
        </div>
      ) : gaining ? (
        <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium mt-4">
          Gaining Fast
        </div>
      ) : null}
      
      {/* Circle progress for gaining classes */}
      {gaining && (
        <div className="mt-1 relative">
          <svg className="w-16 h-16" viewBox="0 0 36 36">
            <path 
              className="stroke-current text-yellow-300 stroke-2 fill-none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              strokeDasharray="100, 100"
              strokeDashoffset="25"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-[#0F4C81]">
            0
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDashboardCard;