import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Students', href: '/students' },
    { name: 'Houses', href: '/houses' },
    { name: 'Reports', href: '/reports' },
    { name: 'Rewards', href: '/rewards' }
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center">
                <div className="bg-primary p-1 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="ml-2 text-xl font-heading font-bold text-primary">LiveSchool</span>
              </div>
            </div>
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                {navItems.map(item => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      location === item.href 
                        ? "bg-primary bg-opacity-10 text-primary" 
                        : "text-neutral-dark hover:bg-neutral hover:text-primary",
                      "px-3 py-2 rounded-md text-sm font-medium"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                {user.role === 'admin' && (
                  <Link 
                    href="/admin"
                    className={cn(
                      location === '/admin' 
                        ? "bg-primary bg-opacity-10 text-primary" 
                        : "text-neutral-dark hover:bg-neutral hover:text-primary",
                      "px-3 py-2 rounded-md text-sm font-medium"
                    )}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button type="button" className="p-1 rounded-full text-neutral-dark hover:text-primary">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>

            <div className="ml-3 relative">
              <div>
                <button type="button" className="flex text-sm rounded-full focus:outline-none" id="user-menu-button">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                    <span className="font-semibold">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</span>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="ml-3 hidden md:block">
              <div className="text-sm">
                <div className="text-neutral-darker font-semibold">{user.firstName} {user.lastName}</div>
                <div className="text-neutral-dark text-xs capitalize">{user.role}</div>
              </div>
            </div>

            <div className="ml-4">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
