import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Award, Trophy, Star, Medal, PartyPopper } from "lucide-react";

export type CelebrationType = 
  | "points_milestone" 
  | "house_milestone" 
  | "behavior_streak" 
  | "improvement" 
  | "achievement";

interface CelebrationAnimationProps {
  type: CelebrationType;
  message: string;
  isVisible: boolean;
  onComplete?: () => void;
}

// Animation colors based on celebration type
const celebrationColors = {
  points_milestone: ["#FFD700", "#FFA500"], // Gold, Orange
  house_milestone: ["#4CAF50", "#8BC34A"],  // Green, Light Green
  behavior_streak: ["#2196F3", "#03A9F4"],  // Blue, Light Blue
  improvement: ["#9C27B0", "#E040FB"],      // Purple, Pink
  achievement: ["#F44336", "#FF9800"],      // Red, Orange
};

// Icons for each celebration type
const celebrationIcons = {
  points_milestone: Trophy,
  house_milestone: Medal,
  behavior_streak: Star,
  improvement: Sparkles,
  achievement: PartyPopper,
};

const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  type,
  message,
  isVisible,
  onComplete
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const colors = celebrationColors[type];
  const IconComponent = celebrationIcons[type];

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      
      // Hide animation after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
        if (onComplete) onComplete();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  // Generate random confetti pieces
  const confettiPieces = Array.from({ length: 50 }).map((_, i) => {
    const randomX = Math.random() * 100 - 50; // -50 to 50
    const randomY = Math.random() * -100 - 20; // -20 to -120 (start above)
    const scale = Math.random() * 0.6 + 0.4; // 0.4 to 1.0
    const rotate = Math.random() * 360; // 0 to 360 degrees
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return { id: i, x: randomX, y: randomY, scale, rotate, color };
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Confetti animation */}
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden">
              {confettiPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  className="absolute"
                  style={{ 
                    left: '50%',
                    top: '40%',
                    width: '10px',
                    height: '10px',
                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                    backgroundColor: piece.color,
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0,
                    rotate: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    x: piece.x + 'vw', 
                    y: piece.y + 'vh',
                    scale: piece.scale,
                    rotate: piece.rotate,
                    opacity: 1,
                  }}
                  transition={{ 
                    duration: 1 + Math.random() * 2,
                    ease: "easeOut",
                    delay: Math.random() * 0.3,
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Main celebration message */}
          <motion.div 
            className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-lg p-6 text-center max-w-md mx-auto z-10 border-2"
            style={{ borderColor: colors[0] }}
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 15 
            }}
          >
            <motion.div 
              className="mb-4 mx-auto flex justify-center"
              initial={{ rotate: 0, scale: 1 }}
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.2, 1, 1.1, 1] 
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center" 
                style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                <IconComponent size={32} className="text-white" />
              </div>
            </motion.div>
            
            <motion.h3 
              className="text-2xl font-bold mb-2 bg-gradient-to-r"
              style={{ 
                backgroundImage: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Congratulations!
            </motion.h3>
            
            <motion.p 
              className="text-neutral-dark"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {message}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationAnimation;