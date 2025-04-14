import React, { useState, useEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { Class } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { globalEventBus } from '@/lib/queryClient';

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
  // Track previous and current points for animation
  const [prevPoints, setPrevPoints] = useState(points);
  const [showPointsChange, setShowPointsChange] = useState(false);
  const [pointsDiff, setPointsDiff] = useState(0);
  const prevPointsRef = useRef(points);
  
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
  
  // Check for points changes and display animation
  useEffect(() => {
    if (prevPointsRef.current !== points) {
      // Calculate the difference for the animation
      const diff = points - prevPointsRef.current;
      if (diff !== 0) {
        setPointsDiff(diff);
        setShowPointsChange(true);
        
        // Hide the animation after 1.5 seconds
        const timeout = setTimeout(() => {
          setShowPointsChange(false);
        }, 1500);
        
        return () => clearTimeout(timeout);
      }
    }
    prevPointsRef.current = points;
    setPrevPoints(points);
  }, [points]);
  
  // Listen for global events to trigger animations even when the prop doesn't change
  useEffect(() => {
    // Unified handler for all types of point updates
    const handleAnyPointsUpdate = () => {
      // Always show animation on global update, regardless of previous state
      // Calculate the difference again in case it was updated directly
      const diff = points - prevPointsRef.current;
      setPointsDiff(diff);
      
      // Reset the animation state
      setShowPointsChange(false);
      
      // Trigger animation on next tick to ensure it plays even if there was already an animation
      setTimeout(() => {
        setShowPointsChange(true);
        
        // Hide animation after display time
        setTimeout(() => {
          setShowPointsChange(false);
        }, 1500);
      }, 10);
      
      // Update reference for next comparison
      prevPointsRef.current = points;
    };
    
    // Subscribe to multiple events - both global and class-specific
    const classEventName = `class-${classItem.id}-updated`; // Class-specific event
    const subscriptions = [
      globalEventBus.subscribe('points-updated', handleAnyPointsUpdate),
      globalEventBus.subscribe(classEventName, handleAnyPointsUpdate),
      globalEventBus.subscribe('class-updated', handleAnyPointsUpdate)
    ];
    
    return () => {
      // Clean up all subscriptions
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [classItem.id, points]);

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
    <div className="flex flex-col items-center" data-class-id={classItem.id}>
      {/* Points circle with medal badge */}
      <div className="relative">
        <motion.div 
          className="w-14 h-14 rounded-full flex items-center justify-center mb-1 text-white font-bold text-xl shadow-md"
          style={{ backgroundColor: classColorHex }}
          animate={{ 
            scale: showPointsChange ? [1, 1.2, 1] : 1,
            boxShadow: showPointsChange 
              ? ["0px 0px 0px rgba(0,0,0,0.2)", "0px 0px 15px rgba(0,0,0,0.35)", "0px 0px 0px rgba(0,0,0,0.2)"] 
              : "0px 0px 0px rgba(0,0,0,0.2)"
          }}
          transition={{ 
            duration: 0.5, 
            type: "spring", 
            stiffness: 300, 
            damping: 15 
          }}
        >
          <motion.span
            key={points}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3,
              type: "spring"
            }}
            className="points-value"
          >
            {points}
          </motion.span>
        </motion.div>
        
        {/* Points change indicator - shows a floating number with enhanced animation */}
        <AnimatePresence>
          {showPointsChange && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -25, scale: 1.2 }}
              exit={{ opacity: 0, y: -40, scale: 0.8 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className={`absolute -top-2 left-1/2 transform -translate-x-1/2 font-bold text-base z-10 px-2 py-0.5 rounded-full ${
                pointsDiff > 0 
                  ? 'text-green-600 bg-green-100 border border-green-200' 
                  : 'text-red-600 bg-red-100 border border-red-200'
              }`}
            >
              {pointsDiff > 0 ? `+${pointsDiff}` : pointsDiff}
            </motion.div>
          )}
        </AnimatePresence>
        
        {getMedalBadge()}
      </div>
      
      {/* Bar chart column */}
      <div className="flex flex-col items-center">
        <motion.div 
          className="w-16 rounded-t-lg shadow-md flex flex-col justify-end items-center overflow-hidden"
          style={{ backgroundColor: classColorHex }}
          animate={{ 
            height: barHeight,
            boxShadow: showPointsChange 
              ? ["0px 0px 0px rgba(0,0,0,0.2)", "0px 0px 10px rgba(0,0,0,0.3)", "0px 0px 0px rgba(0,0,0,0.2)"] 
              : "0px 0px 0px rgba(0,0,0,0.2)"
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            bounce: showPointsChange ? 0.5 : 0.25 // More bounce when points change
          }}
        >
          {/* Add a pulsing effect when points change */}
          {showPointsChange && pointsDiff > 0 && (
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          )}
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
        </motion.div>
        
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