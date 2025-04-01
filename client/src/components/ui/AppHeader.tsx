import React from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';

export default function AppHeader() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Check if we're in the categories view of the points page
  const isPointsCategories = location.includes('/points') && location.includes('categories');
  
  const handleLogoClick = (e: React.MouseEvent) => {
    if (isPointsCategories) {
      e.preventDefault(); // Prevent default link behavior
      window.history.back(); // Go back to previous page
    }
    // Otherwise let the Link component handle navigation to home
  };

  return (
    <header className="bg-primary text-white py-3 px-4">
      <div className="flex justify-between items-center">
        {/* Left side with Points logo that acts as back button in points category view */}
        <Link href="/">
          <div 
            className="flex items-center cursor-pointer" 
            onClick={handleLogoClick}
          >
            {isPointsCategories ? (
              <ChevronLeft className="h-5 w-5 mr-1" />
            ) : (
              <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full mr-2">
                <span className="text-primary text-xs">⌘</span>
              </div>
            )}
            <span className="text-base font-medium">Points</span>
          </div>
        </Link>
        
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