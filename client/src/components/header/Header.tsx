import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, Globe } from 'lucide-react';
import NavigationMenu from './NavigationMenu';
import { useAuth } from '@/hooks/use-auth';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  let title = 'Points';
  if (location.startsWith('/rewards')) title = 'Rewards';
  // Add more routes as needed

  return (
    <>
      <header className="bg-primary text-white py-3 px-6 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={toggleMenu}
          >
            <Globe className="h-6 w-6" />
            <span className="text-lg font-medium">
              {title} <ChevronDown className="ml-1 h-4 w-4 inline" />
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="mr-2">Help</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-semibold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={closeMenu} 
      />
    </>
  );
}