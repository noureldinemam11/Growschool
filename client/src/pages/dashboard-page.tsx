import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import PointsModal from '@/components/points/PointsModal';
import { useQuery } from '@tanstack/react-query';
import { BehaviorPoint, User, House } from '@shared/schema';

// Import icons
import { 
  Award, 
  FileText, 
  Lightbulb, 
  Printer, 
  Shield, 
  QrCode, 
  Settings,
  HelpCircle,
  User as UserIcon,
  Phone
} from 'lucide-react';

// Import the five icon layout from the dashboard items
import DashboardItems from '@/components/dashboard/DashboardItems';

export default function DashboardPage() {
  const { user } = useAuth();
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Get school name
  const schoolName = "School Behavior Management";
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-primary text-white py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Phone className="h-8 w-8" />
            <div>
              <div className="text-xs text-white/70">Welcome</div>
              <div className="font-bold">{schoolName}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-md hover:bg-primary-dark text-white/90 hover:text-white">
              <HelpCircle size={20} />
            </button>
            <button className="p-2 rounded-md hover:bg-primary-dark text-white/90 hover:text-white">
              <UserIcon size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 bg-slate-50 p-6">
        <div className="container mx-auto">
          {/* Using the new dashboard layout */}
          <DashboardItems />
        </div>
      </main>
      
      {/* Points Modal */}
      <PointsModal 
        isOpen={isPointsModalOpen} 
        onClose={() => setIsPointsModalOpen(false)} 
      />
    </div>
  );
}
