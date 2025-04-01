import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, Search, QrCode } from 'lucide-react';
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

  return (
    <>
      {/* Main Navigation Bar */}
      <header className="bg-primary text-white py-3 px-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          {/* Left side with Points dropdown */}
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={toggleMenu}
          >
            <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full">
              <span className="text-primary text-xs">⌘</span>
            </div>
            <span className="text-base font-medium flex items-center">
              Points <ChevronDown className="ml-1 h-4 w-4" />
            </span>
          </div>
          
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

      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={closeMenu} 
      />
    </>
  );
}