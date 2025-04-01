import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import ActionCard from '@/components/dashboard/ActionCard';
import OverviewCard from '@/components/dashboard/OverviewCard';
import HouseStandingsCard from '@/components/dashboard/HouseStandingsCard';
import ActivityTable from '@/components/dashboard/ActivityTable';
import StudentCard from '@/components/dashboard/StudentCard';
import { Plus, Minus, Users, Shield } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import AwardPointsModal from '@/components/modals/AwardPointsModal';
import DeductPointsModal from '@/components/modals/DeductPointsModal';
import { useQuery } from '@tanstack/react-query';
import { BehaviorPoint, User, House } from '@shared/schema';

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<'award' | 'deduct' | null>(null);
  
  const { data: recentPoints } = useQuery<BehaviorPoint[]>({
    queryKey: ['/api/behavior-points/recent?limit=100'],
    enabled: !!user
  });

  // Mock data for top students - in a real app, would come from API
  const topStudents = [
    {
      name: 'Emma Martinez',
      gradeAndHouse: 'Grade 8A - Phoenix House',
      totalPoints: 185,
      goalPercentage: 85,
      categoryPoints: {
        academic: 65,
        behavior: 82,
        extra: 38
      }
    },
    {
      name: 'James Kim',
      gradeAndHouse: 'Grade 7C - Griffin House',
      totalPoints: 172,
      goalPercentage: 78,
      categoryPoints: {
        academic: 58,
        behavior: 76,
        extra: 38
      }
    },
    {
      name: 'Lisa Johnson',
      gradeAndHouse: 'Grade 8B - Dragon House',
      totalPoints: 168,
      goalPercentage: 76,
      categoryPoints: {
        academic: 72,
        behavior: 62,
        extra: 34
      }
    }
  ];

  // Calculate dashboard metrics
  const pointsAwarded = recentPoints?.filter(p => p.points > 0).reduce((sum, p) => sum + p.points, 0) || 0;
  const pointsDeducted = recentPoints?.filter(p => p.points < 0).reduce((sum, p) => sum + Math.abs(p.points), 0) || 0;
  const studentsAwarded = new Set(recentPoints?.filter(p => p.points > 0).map(p => p.studentId)).size || 0;
  const studentsDeducted = new Set(recentPoints?.filter(p => p.points < 0).map(p => p.studentId)).size || 0;

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-y-auto bg-neutral">
          <div className="p-4 md:p-8">
            <header className="mb-6">
              <h1 className="text-2xl font-heading font-bold text-neutral-darker">
                {user?.role === 'teacher' ? 'Teacher Dashboard' : 
                 user?.role === 'admin' ? 'Admin Dashboard' : 
                 user?.role === 'student' ? 'Student Dashboard' : 
                 'Parent Dashboard'}
              </h1>
              <p className="text-neutral-dark">Welcome back, {user?.firstName}. Here's what's happening today.</p>
            </header>

            {/* Quick Actions Section - Only for teachers and admins */}
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <section className="mb-8">
                <h2 className="text-lg font-heading font-bold text-neutral-darker mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ActionCard 
                    title="Award Points" 
                    description="Recognize positive behavior" 
                    icon={<Plus className="h-6 w-6" />}
                    color="primary"
                    onClick={() => setActiveModal('award')}
                  />
                  
                  <ActionCard 
                    title="Deduct Points" 
                    description="Address behavioral issues" 
                    icon={<Minus className="h-6 w-6" />}
                    color="error"
                    onClick={() => setActiveModal('deduct')}
                  />
                  
                  <ActionCard 
                    title="Class View" 
                    description="Manage an entire class" 
                    icon={<Users className="h-6 w-6" />}
                    color="secondary"
                    onClick={() => {}}
                  />
                  
                  <ActionCard 
                    title="House Points" 
                    description="Update house standings" 
                    icon={<Shield className="h-6 w-6" />}
                    color="accent"
                    onClick={() => {}}
                  />
                </div>
              </section>
            )}

            {/* Today's Overview */}
            <section className="mb-8">
              <h2 className="text-lg font-heading font-bold text-neutral-darker mb-4">Today's Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OverviewCard
                  title="Points Awarded"
                  value={pointsAwarded}
                  changeText="+8% today"
                  changeType="positive"
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>}
                  subtitle="students received points today"
                  subtitleValue={studentsAwarded.toString()}
                />
                
                <OverviewCard
                  title="Points Deducted"
                  value={pointsDeducted}
                  changeText="-12% today"
                  changeType="negative"
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>}
                  subtitle="students lost points today"
                  subtitleValue={studentsDeducted.toString()}
                />
                
                <HouseStandingsCard />
              </div>
            </section>

            {/* Recent Activity */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-heading font-bold text-neutral-darker">Recent Activity</h2>
                <a href="#" className="text-primary text-sm font-semibold hover:underline">View all</a>
              </div>
              <ActivityTable />
            </section>

            {/* Top Performing Students */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-heading font-bold text-neutral-darker">Top Performing Students</h2>
                <a href="#" className="text-primary text-sm font-semibold hover:underline">View all students</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topStudents.map((student, index) => (
                  <StudentCard
                    key={index}
                    name={student.name}
                    gradeAndHouse={student.gradeAndHouse}
                    totalPoints={student.totalPoints}
                    goalPercentage={student.goalPercentage}
                    categoryPoints={student.categoryPoints}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
      
      <MobileNavbar />

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
