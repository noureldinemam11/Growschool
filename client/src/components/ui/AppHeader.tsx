import React from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  const handleBackClick = () => {
    window.history.back(); // Go back to previous page
  };

  return (
    <header className="bg-primary text-white py-3 px-4">
      <div className="flex justify-between items-center">
        {/* Left side with back button */}
        <Button 
          variant="ghost" 
          className="p-0 h-8 text-white hover:bg-primary/20 hover:text-white focus:bg-primary/20"
          onClick={handleBackClick}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span className="text-base font-medium">Back</span>
        </Button>
        
        {/* Right side with Help and Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="mr-1">Help</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-semibold">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}