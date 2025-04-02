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
        className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-semibold cursor-pointer"
        onClick={toggleDropdown}
      >
        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 shadow-lg bg-primary text-white z-50">
          {/* Close Button */}
          <div className="flex justify-end p-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-primary/20 p-1 h-auto"
              onClick={handleClose}
            >
              <X size={16} />
              <span className="ml-1">Close</span>
            </Button>
          </div>

          {/* Profile Info */}
          <div className="py-4 flex items-center justify-center flex-col">
            <div className="w-16 h-16 rounded-full bg-white text-primary flex items-center justify-center text-xl font-bold mb-3 relative">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 shadow-md">
                <Edit size={12} className="text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
          </div>

          {/* Menu Items */}
          <div className="border-t border-blue-600">
            <Button 
              variant="ghost" 
              className="w-full justify-start px-4 py-3 text-white hover:bg-blue-600"
              onClick={handleEditProfile}
            >
              <User className="h-5 w-5 mr-3" />
              Edit Profile
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start px-4 py-3 text-white hover:bg-blue-600 border-t border-blue-600"
              onClick={handleChangePassword}
            >
              <Lock className="h-5 w-5 mr-3" />
              Change Password
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start px-4 py-3 text-white hover:bg-blue-600 border-t border-blue-600"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}