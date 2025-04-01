import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  let title = 'Dashboard';
  if (location.startsWith('/points')) title = 'Points';
  if (location.startsWith('/rewards')) title = 'Rewards';
  // Add more routes as needed

  return (
    <>
      <header className="bg-primary text-white py-3 px-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white text-primary rounded-full p-1">
              {location.startsWith('/points') ? (
                <PlusCircle size={20} />
              ) : (
                <div className="w-5 h-5" />
              )}
            </div>
            <h1 
              className="text-xl font-bold flex items-center cursor-pointer"
              onClick={toggleMenu}
            >
              {title} <ChevronDown className="ml-1 h-5 w-5" />
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-white">
              Help <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
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