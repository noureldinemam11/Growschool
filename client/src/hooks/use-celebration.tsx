import React, { useState, useContext, createContext, ReactNode } from "react";
import CelebrationAnimation, { CelebrationType } from "@/components/animations/CelebrationAnimation";

interface CelebrationContextType {
  triggerCelebration: (type: CelebrationType, message: string) => void;
}

interface CelebrationState {
  isVisible: boolean;
  type: CelebrationType;
  message: string;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export const CelebrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [celebration, setCelebration] = useState<CelebrationState>({
    isVisible: false,
    type: "achievement",
    message: "",
  });

  const triggerCelebration = (type: CelebrationType, message: string) => {
    // If a celebration is already showing, wait until it's done
    if (celebration.isVisible) {
      setTimeout(() => {
        triggerCelebration(type, message);
      }, 500);
      return;
    }

    setCelebration({
      isVisible: true,
      type,
      message,
    });
  };

  const handleComplete = () => {
    setCelebration((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  return (
    <CelebrationContext.Provider value={{ triggerCelebration }}>
      {children}
      <CelebrationAnimation 
        isVisible={celebration.isVisible}
        type={celebration.type}
        message={celebration.message}
        onComplete={handleComplete}
      />
    </CelebrationContext.Provider>
  );
};

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (context === undefined) {
    throw new Error("useCelebration must be used within a CelebrationProvider");
  }
  return context;
};