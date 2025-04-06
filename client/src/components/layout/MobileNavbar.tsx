import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Users, 
  BarChart, 
  FileText, 
  Plus, 
  Award, 
  Settings, 
  Menu,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Dialog } from '@/components/ui/dialog';
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import AwardPointsModal from '../modals/AwardPointsModal';

export default function MobileNavbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!user) return null;

  // Only show for teachers and admins
  if (!['admin', 'teacher'].includes(user.role)) return null;

  const isAdmin = user.role === 'admin';

  return (
    <>
      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-40 shadow-lg">
        <div className="grid grid-cols-5">
          <Link 
            href="/" 
            className={cn(
              "flex flex-col items-center justify-center py-2",
              location === '/' ? "text-primary font-semibold" : "text-neutral-dark"
            )}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          
          <Link 
            href="/students" 
            className={cn(
              "flex flex-col items-center justify-center py-2",
              location === '/students' || location.startsWith('/student/') 
                ? "text-primary font-semibold" 
                : "text-neutral-dark"
            )}
          >
            <Users className="h-5 w-5 mb-1" />
            <span className="text-xs">Students</span>
          </Link>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center py-2 text-neutral-dark"
          >
            <div className="bg-primary text-white rounded-full p-2 -mt-6 shadow-md">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-xs mt-1">Points</span>
          </button>
          
          <Link 
            href="/houses" 
            className={cn(
              "flex flex-col items-center justify-center py-2",
              location === '/houses' || location.startsWith('/house/') 
                ? "text-primary font-semibold" 
                : "text-neutral-dark"
            )}
          >
            <BarChart className="h-5 w-5 mb-1" />
            <span className="text-xs">Houses</span>
          </Link>
          
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                className="flex flex-col items-center justify-center py-2 text-neutral-dark"
              >
                <Menu className="h-5 w-5 mb-1" />
                <span className="text-xs">More</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>Menu</DrawerTitle>
                <DrawerDescription>Quick access to features</DrawerDescription>
              </DrawerHeader>
              <div className="grid grid-cols-2 gap-2 p-4">
                <Link href="/rewards" onClick={() => setIsDrawerOpen(false)}>
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2 items-center justify-center">
                    <Award className="h-6 w-6 text-primary" />
                    <span>Rewards</span>
                  </Button>
                </Link>
                <Link href="/reports" onClick={() => setIsDrawerOpen(false)}>
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2 items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                    <span>Reports</span>
                  </Button>
                </Link>
                <Link href="/incidents" onClick={() => setIsDrawerOpen(false)}>
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2 items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-primary" />
                    <span>Incidents</span>
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsDrawerOpen(false)}>
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2 items-center justify-center">
                      <Settings className="h-6 w-6 text-primary" />
                      <span>Admin</span>
                    </Button>
                  </Link>
                )}
                <Link href="/profile" onClick={() => setIsDrawerOpen(false)}>
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2 items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <span>Profile</span>
                  </Button>
                </Link>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Close Menu</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AwardPointsModal onClose={() => setIsModalOpen(false)} />
      </Dialog>
    </>
  );
}
