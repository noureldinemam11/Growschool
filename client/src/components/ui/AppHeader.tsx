import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Link } from 'wouter';

export default function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-primary text-white py-3 px-4">
      <div className="flex justify-between items-center">
        {/* Left side with Points dropdown */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-white hover:bg-primary/50 hover:text-white focus:bg-primary/50">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full mr-2">
                    <span className="text-primary text-xs">⌘</span>
                  </div>
                  <span>Points</span>
                </div>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid grid-cols-3 gap-3 p-4 w-[400px]">
                  <Link href="/points">
                    <NavigationMenuLink className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-md">
                      <div className="h-12 w-12 bg-blue-100 text-primary rounded-full flex items-center justify-center mb-2">
                        <span className="text-2xl">+</span>
                      </div>
                      <span className="text-sm font-medium">POINTS</span>
                    </NavigationMenuLink>
                  </Link>
                  <Link href="/rewards">
                    <NavigationMenuLink className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-md">
                      <div className="h-12 w-12 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mb-2">
                        <span className="text-xl">🏆</span>
                      </div>
                      <span className="text-sm font-medium">REWARDS</span>
                    </NavigationMenuLink>
                  </Link>
                  <Link href="/recaps">
                    <NavigationMenuLink className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-md">
                      <div className="h-12 w-12 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mb-2">
                        <span className="text-xl">📋</span>
                      </div>
                      <span className="text-sm font-medium">RECAPS</span>
                    </NavigationMenuLink>
                  </Link>
                  <Link href="/insights">
                    <NavigationMenuLink className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-md">
                      <div className="h-12 w-12 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mb-2">
                        <span className="text-xl">💡</span>
                      </div>
                      <span className="text-sm font-medium">INSIGHTS</span>
                    </NavigationMenuLink>
                  </Link>
                  <Link href="/printables">
                    <NavigationMenuLink className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-md">
                      <div className="h-12 w-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-2">
                        <span className="text-xl">🖨️</span>
                      </div>
                      <span className="text-sm font-medium">PRINTABLES</span>
                    </NavigationMenuLink>
                  </Link>
                  <Link href="/house-points">
                    <NavigationMenuLink className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-md">
                      <div className="h-12 w-12 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mb-2">
                        <span className="text-xl">🏠</span>
                      </div>
                      <span className="text-sm font-medium">HOUSE POINTS</span>
                    </NavigationMenuLink>
                  </Link>
                  <Link href="/qr-badges">
                    <NavigationMenuLink className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-md">
                      <div className="h-12 w-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-2">
                        <span className="text-xl">📱</span>
                      </div>
                      <span className="text-sm font-medium">QR BADGES</span>
                    </NavigationMenuLink>
                  </Link>
                  <Link href="/setup">
                    <NavigationMenuLink className="flex flex-col items-center p-3 hover:bg-gray-100 rounded-md">
                      <div className="h-12 w-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mb-2">
                        <span className="text-xl">⚙️</span>
                      </div>
                      <span className="text-sm font-medium">SETUP</span>
                    </NavigationMenuLink>
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
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