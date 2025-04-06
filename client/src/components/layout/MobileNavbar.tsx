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
  AlertTriangle,
  Star
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

  // Helper function to determine if a nav item is active
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Added extra bottom padding to accommodate the navbar */}
      <div className="md:hidden pb-16"></div>
      
      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-40 shadow-lg">
        <div className="grid grid-cols-5">
          <Link 
            href="/" 
            className={cn(
              "flex flex-col items-center justify-center py-2 touch-manipulation",
              isActive('/') ? "text-primary font-semibold" : "text-neutral-dark"
            )}
          >
            <Home className={cn(
              "h-5 w-5 mb-1",
              isActive('/') ? "text-primary" : "text-neutral-dark"
            )} />
            <span className="text-xs">Home</span>
          </Link>
          
          <Link 
            href="/students" 
            className={cn(
              "flex flex-col items-center justify-center py-2 touch-manipulation",
              isActive('/students') ? "text-primary font-semibold" : "text-neutral-dark"
            )}
          >
            <Users className={cn(
              "h-5 w-5 mb-1",
              isActive('/students') ? "text-primary" : "text-neutral-dark"
            )} />
            <span className="text-xs">Students</span>
          </Link>
          
          <Link
            href="/points"
            className={cn(
              "flex flex-col items-center justify-center py-2 touch-manipulation",
              isActive('/points') ? "text-primary font-semibold" : "text-neutral-dark"
            )}
            aria-label="Award Points"
          >
            <div className="bg-primary text-white rounded-full p-2.5 -mt-7 shadow-md">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1.5">Award Points</span>
          </Link>
          
          <Link 
            href="/incidents" 
            className={cn(
              "flex flex-col items-center justify-center py-2 touch-manipulation",
              isActive('/incidents') ? "text-primary font-semibold" : "text-neutral-dark"
            )}
          >
            <AlertTriangle className={cn(
              "h-5 w-5 mb-1",
              isActive('/incidents') ? "text-primary" : "text-neutral-dark"
            )} />
            <span className="text-xs">Incidents</span>
          </Link>
          
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                className="flex flex-col items-center justify-center py-2 text-neutral-dark touch-manipulation"
                aria-label="More Options"
              >
                <Menu className="h-5 w-5 mb-1" />
                <span className="text-xs">More</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh]">
              <DrawerHeader className="border-b pb-2">
                <DrawerTitle className="text-xl text-primary">More Options</DrawerTitle>
                <DrawerDescription>Access additional features</DrawerDescription>
              </DrawerHeader>
              <div className="grid grid-cols-2 gap-3 p-4">
                <Link href="/houses" onClick={() => setIsDrawerOpen(false)}>
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2 items-center justify-center shadow-sm">
                    <BarChart className="h-6 w-6 text-primary" />
                    <span>Houses</span>
                  </Button>
                </Link>
                <Link href="/rewards" onClick={() => setIsDrawerOpen(false)}>
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2 items-center justify-center shadow-sm">
                    <Star className="h-6 w-6 text-primary" />
                    <span>Rewards</span>
                  </Button>
                </Link>
                <Link href="/reports" onClick={() => setIsDrawerOpen(false)}>
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2 items-center justify-center shadow-sm">
                    <FileText className="h-6 w-6 text-primary" />
                    <span>Reports</span>
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsDrawerOpen(false)}>
                    <Button variant="outline" className="w-full h-24 flex flex-col gap-2 items-center justify-center shadow-sm">
                      <Settings className="h-6 w-6 text-primary" />
                      <span>Admin</span>
                    </Button>
                  </Link>
                )}
                <Link href="/profile" onClick={() => setIsDrawerOpen(false)}>
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2 items-center justify-center shadow-sm">
                    <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <span>Profile</span>
                  </Button>
                </Link>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">Close Menu</Button>
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
