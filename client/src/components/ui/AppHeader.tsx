import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import ProfileDropdown from './ProfileDropdown';

interface AppHeaderProps {
  customBackAction?: () => void;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  title?: string;
}

export default function AppHeader({
  customBackAction,
  showBackButton,
  showHomeButton = false,
  title
}: AppHeaderProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // If showBackButton isn't explicitly set, show it except on the main dashboard
  const shouldShowBackButton = showBackButton !== undefined 
    ? showBackButton 
    : location !== '/';
  
  const handleBackClick = () => {
    if (customBackAction) {
      customBackAction();
    } else {
      // Determine which page to navigate to based on current location
      if (location.includes('/house/') || location.includes('/houses/')) {
        navigate('/houses');
      } else if (location.includes('/points/')) {
        navigate('/points');
      } else if (location.includes('/students/')) {
        navigate('/students');
      } else if (location.includes('/rewards/')) {
        navigate('/rewards');
      } else if (location.includes('/reports/')) {
        navigate('/reports');
      } else if (location.includes('/incidents/')) {
        navigate('/incidents');
      } else if (location.includes('/admin/')) {
        navigate('/admin');
      } else {
        // Default fallback
        navigate('/');
      }
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <header className="bg-primary text-white py-2 px-3 md:py-3 md:px-4">
      <div className="flex justify-between items-center">
        {/* Left side with navigation */}
        <div className="flex items-center">
          {shouldShowBackButton && (
            <Button 
              variant="ghost" 
              className="p-0 h-8 text-white hover:bg-primary/20 hover:text-white focus:bg-primary/20"
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-base ml-1 md:ml-2 hidden sm:inline">Back</span>
            </Button>
          )}
          
          {showHomeButton && (
            <Button 
              variant="ghost" 
              className="p-0 h-8 text-white hover:bg-primary/20 hover:text-white focus:bg-primary/20 ml-2"
              onClick={handleHomeClick}
            >
              <Home className="h-5 w-5" />
              <span className="text-base font-medium ml-1 md:ml-2 hidden sm:inline">Dashboard</span>
            </Button>
          )}
          
          {title && (
            <h1 className="text-base md:text-lg font-medium ml-2 md:ml-4 truncate max-w-[150px] sm:max-w-none">{title}</h1>
          )}
        </div>
        
        {/* Right side with Profile Dropdown */}
        <div className="flex items-center">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}