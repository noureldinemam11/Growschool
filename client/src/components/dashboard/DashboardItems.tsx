import React, { useState } from 'react';
import { 
  Award, 
  BarChart, 
  Settings,
  Trophy,
  Users,
  Star,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useLocation } from 'wouter';
import PointsModal from '../points/PointsModal';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { House } from '@shared/schema';

// Extend the BehaviorPoint interface to include student and category data
interface BehaviorPoint {
  id: number;
  studentId: number;
  teacherId: number;
  categoryId: number;
  points: number;
  notes: string;
  timestamp: string;
  student?: {
    firstName: string;
    lastName: string;
    gradeLevel?: string;
    section?: string;
  };
  teacher?: {
    firstName: string;
    lastName: string;
  };
  category?: {
    name: string;
  };
}

interface DashboardItemProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  gradient?: boolean;
  delay?: number;
}

function DashboardItem({ 
  icon, 
  title, 
  description, 
  onClick, 
  gradient = false,
  delay = 0 
}: DashboardItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
    >
      <Card 
        className={`h-full overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ${
          gradient ? 'bg-gradient-to-br from-primary/90 to-primary/60 text-white' : 'bg-white'
        }`}
        onClick={onClick}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full ${gradient ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'} mb-2`}>
            {icon}
          </div>
          <h3 className={`text-xl font-bold ${gradient ? 'text-white' : 'text-gray-800'}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-center text-sm ${gradient ? 'text-white/90' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardItems() {
  const [, navigate] = useLocation();
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Fetch recent behavior points
  const { data: recentPoints = [] } = useQuery<BehaviorPoint[]>({ 
    queryKey: ['/api/behavior-points/recent'],
    enabled: !!user
  });
  
  // Fetch all houses data
  const { data: houses = [] } = useQuery<House[]>({
    queryKey: ['/api/houses'],
    enabled: !!user
  });
  
  // Fetch teacher's own behavior points
  const { data: teacherPoints = [] } = useQuery<BehaviorPoint[]>({
    queryKey: [`/api/behavior-points/teacher/${user?.id}`],
    enabled: !!user && !!user.id
  });
  
  // Calculate stats
  console.log("Teacher points data:", teacherPoints);
  const totalPointsGiven = teacherPoints?.reduce((sum, point) => sum + Math.abs(point.points), 0) || 0;
  console.log("Total points given calculated:", totalPointsGiven);
  const totalHouses = houses?.length || 0;
  
  return (
    <TooltipProvider>
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            <span className="block">Welcome back, </span>
            <span className="block mt-1 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              {user?.firstName || 'Teacher'}
            </span>
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Track student progress and reward positive behavior
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-gray-500">Points Given by You</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>This shows the total points you have awarded. House total points include contributions from all educators.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalPointsGiven}</h3>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Houses</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalHouses}</h3>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Top House</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">
                      {houses && houses.length > 0 
                        ? [...houses].sort((a: House, b: House) => b.points - a.points)[0]?.name || 'N/A'
                        : 'N/A'
                      }
                    </h3>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <DashboardItem 
          icon={<Award size={32} />} 
          title="Assign Points" 
          description="Reward students for positive behavior"
          onClick={() => navigate('/points')}
          gradient={true}
          delay={0}
        />
        <DashboardItem 
          icon={<BarChart size={32} />} 
          title="View Insights" 
          description="Track behavior trends and progress"
          onClick={() => navigate('/reports')}
          delay={1}
        />
        <DashboardItem 
          icon={<Trophy size={32} />} 
          title="House Points" 
          description="Monitor house competition standings"
          onClick={() => navigate('/house-points')}
          delay={2}
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Points */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <span className="mr-2 p-1 rounded-full bg-success/10">
                  <Award className="h-4 w-4 text-success" />
                </span>
                Positive Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {recentPoints && recentPoints.filter(point => point.points > 0).length > 0 ? (
                <div className="space-y-4">
                  {recentPoints
                    .filter(point => point.points > 0)
                    .slice(0, 3)
                    .map((point: BehaviorPoint, index: number) => (
                      <div key={point.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center">
                          <div className="bg-success/10 p-2 rounded-full mr-4">
                            <Star className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {/* Display student name if available in the API response */}
                              {point.student 
                                ? `${point.student.firstName} ${point.student.lastName}` 
                                : `Student ${point.studentId}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {/* Display category name if available or extract from notes */}
                              {point.category?.name || point.notes?.split(' - ')[0] || 'Achievement'}: +{point.points} points
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Awarded by: {point.teacher ? `${point.teacher.firstName} ${point.teacher.lastName}` : `Teacher ${point.teacherId}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(point.timestamp).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No recent positive activities</p>
              )}
            </CardContent>
          </Card>
          
          {/* Negative Points */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <span className="mr-2 p-1 rounded-full bg-error/10">
                  <Award className="h-4 w-4 text-error" />
                </span>
                Behavior Concerns
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {recentPoints && recentPoints.filter(point => point.points < 0).length > 0 ? (
                <div className="space-y-4">
                  {recentPoints
                    .filter(point => point.points < 0)
                    .slice(0, 3)
                    .map((point: BehaviorPoint, index: number) => (
                      <div key={point.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center">
                          <div className="bg-error/10 p-2 rounded-full mr-4">
                            <Star className="h-5 w-5 text-error" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {/* Display student name if available in the API response */}
                              {point.student 
                                ? `${point.student.firstName} ${point.student.lastName}` 
                                : `Student ${point.studentId}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {/* Display category name if available or extract from notes */}
                              {point.category?.name || point.notes?.split(' - ')[0] || 'Concern'}: {point.points} points
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Awarded by: {point.teacher ? `${point.teacher.firstName} ${point.teacher.lastName}` : `Teacher ${point.teacherId}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(point.timestamp).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No recent behavior concerns</p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <PointsModal 
        isOpen={isPointsModalOpen} 
        onClose={() => setIsPointsModalOpen(false)} 
      />
    </TooltipProvider>
  );
}