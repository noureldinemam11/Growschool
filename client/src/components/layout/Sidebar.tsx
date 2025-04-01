import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Home, Users, Building, FileText, Gift, Settings, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      allowedRoles: ['admin', 'teacher', 'student', 'parent']
    },
    {
      name: 'Students',
      href: '/students',
      icon: Users,
      allowedRoles: ['admin', 'teacher', 'parent']
    },
    {
      name: 'Roster',
      href: '/roster',
      icon: ClipboardList,
      allowedRoles: ['admin', 'teacher']
    },
    {
      name: 'Houses',
      href: '/houses',
      icon: Building,
      allowedRoles: ['admin', 'teacher', 'student', 'parent']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      allowedRoles: ['admin', 'teacher', 'parent']
    },
    {
      name: 'Rewards',
      href: '/rewards',
      icon: Gift,
      allowedRoles: ['admin', 'teacher', 'student']
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: Settings,
      allowedRoles: ['admin']
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    item.allowedRoles.includes(user.role)
  );

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="h-0 flex-1 flex flex-col overflow-y-auto">
          {/* User info */}
          <div className="px-4 py-6 bg-primary text-white">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-white text-primary flex items-center justify-center">
                <span className="font-bold text-lg">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-base font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-sm font-medium text-primary-light capitalize">{user.role}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {filteredNavItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  location === item.href 
                    ? "bg-primary text-white" 
                    : "text-neutral-dark hover:bg-neutral hover:text-primary",
                  "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                )}
              >
                <item.icon className="h-6 w-6 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
