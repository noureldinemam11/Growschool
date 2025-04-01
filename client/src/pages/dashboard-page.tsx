import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Dialog } from '@/components/ui/dialog';
import AwardPointsModal from '@/components/modals/AwardPointsModal';
import DeductPointsModal from '@/components/modals/DeductPointsModal';
import { useQuery } from '@tanstack/react-query';
import { BehaviorPoint, User, House } from '@shared/schema';

// Import icons
import { 
  PlusCircle, 
  MinusCircle, 
  Award, 
  FileText, 
  Lightbulb, 
  Printer, 
  Shield, 
  QrCode, 
  Settings,
  HelpCircle,
  User as UserIcon
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<'award' | 'deduct' | null>(null);
  const [, setLocation] = useLocation();
  
  // Get school name
  const schoolName = "School Behavior Management";
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-primary text-white py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-8 w-8"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
              }}
            />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Feature Cards */}
            <FeatureCard 
              title="Points" 
              icon={<PlusCircle size={36} className="text-green-500" />} 
              onClick={() => setActiveModal('award')}
            />
            
            <FeatureCard 
              title="Rewards" 
              icon={<Award size={36} className="text-amber-400" />} 
              onClick={() => setLocation('/rewards')}
            />
            
            <FeatureCard 
              title="Recaps" 
              icon={<FileText size={36} className="text-blue-500" />} 
              onClick={() => {
                // For now, both Recaps and Insights go to the reports page
                // This can be differentiated later with query parameters or tabs
                setLocation('/reports');
              }}
            />
            
            <FeatureCard 
              title="Insights" 
              icon={<Lightbulb size={36} className="text-amber-500" />} 
              onClick={() => setLocation('/reports')}
            />
            
            <FeatureCard 
              title="Printables" 
              icon={<Printer size={36} className="text-cyan-500" />} 
              onClick={() => {
                // Implement printables feature in the future
                alert("Printables feature will be available soon.");
              }}
            />
            
            <FeatureCard 
              title="House Points" 
              icon={<Shield size={36} className="text-purple-500" />} 
              onClick={() => setLocation('/house')}
            />
            
            <FeatureCard 
              title="QR Badges" 
              icon={<QrCode size={36} className="text-blue-500" />} 
              onClick={() => {
                // Implement QR badges feature in the future
                alert("QR Badges feature will be available soon.");
              }}
            />
            
            <FeatureCard 
              title="Setup" 
              icon={<Settings size={36} className="text-gray-500" />} 
              onClick={() => setLocation('/admin')}
            />
          </div>
        </div>
      </main>
      
      {/* Modals */}
      <Dialog open={activeModal === 'award'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <AwardPointsModal onClose={() => setActiveModal(null)} />
      </Dialog>
      
      <Dialog open={activeModal === 'deduct'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DeductPointsModal onClose={() => setActiveModal(null)} />
      </Dialog>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function FeatureCard({ title, icon, onClick }: FeatureCardProps) {
  return (
    <button 
      onClick={onClick}
      className="bg-white rounded-md shadow-sm p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="mb-3">
        {icon}
      </div>
      <h3 className="text-center text-gray-700">{title}</h3>
    </button>
  );
}
