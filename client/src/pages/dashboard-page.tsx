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
      {/* Header is now provided globally in App.tsx */}
      
      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white py-8 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
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
