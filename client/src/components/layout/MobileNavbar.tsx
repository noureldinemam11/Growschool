import { Link, useLocation } from 'wouter';
import { Home, Users, BarChart, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Dialog } from '@/components/ui/dialog';
import AwardPointsModal from '../modals/AwardPointsModal';

export default function MobileNavbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  // Only show for teachers and admins
  if (!['admin', 'teacher'].includes(user.role)) return null;

  return (
    <>
      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
        <div className="grid grid-cols-6">
          <Link 
            href="/" 
            className={cn(
              "flex flex-col items-center justify-center py-2",
              location === '/' ? "text-primary font-semibold" : "text-neutral-dark"
            )}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </Link>
          
          <Link 
            href="/students" 
            className={cn(
              "flex flex-col items-center justify-center py-2",
              location === '/students' ? "text-primary font-semibold" : "text-neutral-dark"
            )}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs">Students</span>
          </Link>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center py-2 text-neutral-dark"
          >
            <div className="bg-primary text-white rounded-full p-2 -mt-5">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-xs mt-1">Add Points</span>
          </button>
          
          <Link 
            href="/reports" 
            className={cn(
              "flex flex-col items-center justify-center py-2",
              location === '/reports' ? "text-primary font-semibold" : "text-neutral-dark"
            )}
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs">Reports</span>
          </Link>
          
          <Link 
            href="/houses" 
            className={cn(
              "flex flex-col items-center justify-center py-2",
              location === '/houses' ? "text-primary font-semibold" : "text-neutral-dark"
            )}
          >
            <BarChart className="h-6 w-6" />
            <span className="text-xs">Houses</span>
          </Link>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AwardPointsModal onClose={() => setIsModalOpen(false)} />
      </Dialog>
    </>
  );
}
