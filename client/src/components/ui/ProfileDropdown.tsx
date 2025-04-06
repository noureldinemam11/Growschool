import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { User, Lock, LogOut, X, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

interface ProfileDropdownProps {
  onClose?: () => void;
}

export default function ProfileDropdown({ onClose }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setIsOpen(false);
    navigate('/auth');
  };

  const handleEditProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleChangePassword = () => {
    navigate('/change-password');
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <div 
        className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-semibold cursor-pointer shadow-sm"
        onClick={toggleDropdown}
      >
        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[280px] sm:w-64 shadow-lg bg-primary text-white z-50 rounded-md overflow-hidden">
          {/* Close Button */}
          <div className="flex justify-between items-center p-2 bg-primary/90">
            <div className="text-xs font-medium opacity-75 pl-2">User Menu</div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-primary/30 p-1 h-7 w-7"
              onClick={handleClose}
            >
              <X size={16} />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Profile Info */}
          <div className="py-3 flex items-center justify-center flex-col">
            <div className="w-14 h-14 rounded-full bg-white text-primary flex items-center justify-center text-lg font-bold mb-2 relative">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 shadow-md">
                <Edit size={10} className="text-white" />
              </div>
            </div>
            <h3 className="text-base font-semibold">{user.firstName} {user.lastName}</h3>
            <p className="text-xs opacity-75">{user.role}</p>
          </div>

          {/* Menu Items */}
          <div className="border-t border-blue-600">
            <Button 
              variant="ghost" 
              className="w-full justify-start px-4 py-2.5 text-white hover:bg-blue-600"
              onClick={handleEditProfile}
            >
              <User className="h-4 w-4 mr-3" />
              Edit Profile
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start px-4 py-2.5 text-white hover:bg-blue-600 border-t border-blue-600"
              onClick={handleChangePassword}
            >
              <Lock className="h-4 w-4 mr-3" />
              Change Password
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start px-4 py-2.5 text-white hover:bg-blue-600 border-t border-blue-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}