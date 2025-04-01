import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  PlusCircle, 
  Award, 
  FileText, 
  Lightbulb, 
  Printer, 
  Shield, 
  QrCode, 
  Settings,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  color?: string;
}

export default function NavigationMenu({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const menuItems: MenuItem[] = [
    { 
      icon: <PlusCircle className="h-12 w-12 text-primary bg-green-100 p-2 rounded-full" />, 
      label: 'POINTS', 
      path: '/points' 
    },
    { 
      icon: <Award className="h-12 w-12 text-yellow-500 bg-yellow-100 p-2 rounded-full" />, 
      label: 'REWARDS', 
      path: '/rewards' 
    },
    { 
      icon: <FileText className="h-12 w-12 text-blue-500 bg-blue-100 p-2 rounded-full" />, 
      label: 'RECAPS', 
      path: '/recaps' 
    },
    { 
      icon: <Lightbulb className="h-12 w-12 text-yellow-500 bg-yellow-100 p-2 rounded-full" />, 
      label: 'INSIGHTS', 
      path: '/insights' 
    },
    { 
      icon: <Printer className="h-12 w-12 text-blue-500 bg-blue-100 p-2 rounded-full" />, 
      label: 'PRINTABLES', 
      path: '/printables' 
    },
    { 
      icon: <Shield className="h-12 w-12 text-purple-500 bg-purple-100 p-2 rounded-full" />, 
      label: 'HOUSE POINTS', 
      path: '/house-points' 
    },
    { 
      icon: <QrCode className="h-12 w-12 text-blue-500 bg-blue-100 p-2 rounded-full" />, 
      label: 'QR BADGES', 
      path: '/qr-badges' 
    },
    { 
      icon: <Settings className="h-12 w-12 text-gray-500 bg-gray-100 p-2 rounded-full" />, 
      label: 'SETUP', 
      path: '/setup' 
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-10" onClick={onClose}>
      <div 
        className="absolute top-16 left-0 right-0 mx-auto max-w-md bg-white rounded-lg shadow-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="grid grid-cols-3 gap-px bg-gray-100">
          {menuItems.map((item, index) => (
            <div key={index} className="flex flex-col items-center justify-center p-6 bg-white hover:bg-gray-50 transition-colors border-b border-r border-gray-100">
              <Link 
                href={item.path}
                onClick={onClose}
              >
                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {item.label}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="p-4 flex justify-center border-t border-gray-100">
          <Button 
            variant="ghost" 
            className="text-blue-600 flex items-center"
            onClick={onClose}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}