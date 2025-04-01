import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';

export default function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-primary text-white py-3 px-4">
      <div className="flex justify-between items-center">
        {/* Left side with Points logo */}
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full mr-2">
              <span className="text-primary text-xs">⌘</span>
            </div>
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