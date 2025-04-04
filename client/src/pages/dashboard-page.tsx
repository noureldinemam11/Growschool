import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import PointsModal from '@/components/points/PointsModal';
import { useQuery } from '@tanstack/react-query';
import { BehaviorPoint, User, House } from '@shared/schema';
import { TooltipProvider } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

// Import components
import SimpleTeacherDashboard from '@/components/dashboard/SimpleTeacherDashboard';
import { IntegratedAdminPanel } from '@/components/admin/IntegratedAdminPanel';

export default function DashboardPage() {
  const { user } = useAuth();
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is now provided globally in App.tsx */}
      
      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white py-8 px-4 md:px-8">
        <div className="container mx-auto max-w-7xl">
          <TooltipProvider>
            <div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
                  <span className="block">Hello, </span>
                  <span className="block mt-1 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                    {user?.firstName || 'User'}
                  </span>
                </h1>
                <p className="mt-3 text-xl text-gray-500">
                  {user?.role === 'admin' 
                    ? 'School administration dashboard and analytics'
                    : 'Track student progress and reward positive behavior'}
                </p>
              </motion.div>
              
              {user?.role === 'admin' ? <IntegratedAdminPanel /> : <SimpleTeacherDashboard />}
            </div>
          </TooltipProvider>
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
