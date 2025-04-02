import React, { useState } from 'react';
import { 
  Award, 
  BarChart, 
  Settings,
  Trophy
} from 'lucide-react';
import { useLocation } from 'wouter';
import PointsModal from '../points/PointsModal';

interface DashboardItemProps {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}

function DashboardItem({ icon, title, onClick }: DashboardItemProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
      onClick={onClick}
    >
      <div className="text-primary mb-3">
        {icon}
      </div>
      <div className="text-center font-medium">{title}</div>
    </div>
  );
}

export default function DashboardItems() {
  const [, navigate] = useLocation();
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardItem 
          icon={<Award size={48} />} 
          title="Points" 
          onClick={() => navigate('/points')}
        />
        <DashboardItem 
          icon={<BarChart size={48} />} 
          title="Insights" 
          onClick={() => navigate('/reports')}
        />
        <DashboardItem 
          icon={<Trophy size={48} />} 
          title="House Points" 
          onClick={() => navigate('/house-points')}
        />
        <DashboardItem 
          icon={<Settings size={48} />} 
          title="Setup" 
          onClick={() => navigate('/admin')}
        />
      </div>

      <PointsModal 
        isOpen={isPointsModalOpen} 
        onClose={() => setIsPointsModalOpen(false)} 
      />
    </>
  );
}