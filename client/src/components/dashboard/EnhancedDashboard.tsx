import React, { useState, useMemo } from 'react';
import { 
  Award, 
  BarChart, 
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  LineChart,
  MessageSquare,
  PieChart,
  Settings,
  Star,
  Thermometer,
  Trophy,
  TrendingUp,
  Users,
  User,
  Clock10,
  UserPlus,
  ArrowDown,
  ArrowUp,
  List,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Smile,
  Activity,
  FileText,
  WifiOff, 
  Download,
  Maximize,
  Info,
  Repeat,
  PlusCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { House, BehaviorCategory, User as UserType } from '@shared/schema';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Define chart colors for consistent use
const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const POSITIVE_COLOR = '#16a34a';
const NEGATIVE_COLOR = '#ef4444';

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

// Helpers
function formatShortDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Common dashboard components
const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  trendLabel,
  color = 'bg-primary'
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendLabel?: string;
  color?: string;
}) => {
  return (
    <Card className="h-full">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-xl md:text-3xl font-bold tracking-tight">{value}</h3>
              {trendValue && (
                <span className="text-xs md:text-sm font-medium text-muted-foreground ml-1">
                  {trendValue}
                </span>
              )}
            </div>
            {trend && trendLabel && (
              <div className="flex items-center mt-1">
                {trend === 'up' ? (
                  <ArrowUp className="h-3 w-3 text-emerald-500 mr-1" />
                ) : trend === 'down' ? (
                  <ArrowDown className="h-3 w-3 text-rose-500 mr-1" />
                ) : (
                  <Repeat className="h-3 w-3 text-amber-500 mr-1" />
                )}
                <span className={`text-[10px] md:text-xs ${
                  trend === 'up' 
                    ? 'text-emerald-500' 
                    : trend === 'down' 
                      ? 'text-rose-500' 
                      : 'text-amber-500'
                }`}>
                  {trendLabel}
                </span>
              </div>
            )}
          </div>
          <div className={`p-2 md:p-3 rounded-full ${color} bg-opacity-10`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QuickActionButton = ({ 
  icon, 
  label, 
  onClick,
  highlight = false,
  className = ""
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  highlight?: boolean;
  className?: string;
}) => {
  return (
    <Button 
      variant={highlight ? "default" : "outline"} 
      className={`h-16 md:h-24 flex-col space-y-1 md:space-y-2 w-full ${className}`} 
      onClick={onClick}
    >
      {icon}
      <span className="text-[10px] md:text-xs">{label}</span>
    </Button>
  );
};

// Dashboard for admin users
function AdminDashboard() {
  const [, navigate] = useLocation();
  
  // Fetch necessary data
  const { 
    data: houses = [], 
    isLoading: isLoadingHouses 
  } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });
  
  const { 
    data: students = [], 
    isLoading: isLoadingStudents 
  } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/student'],
  });
  
  const { 
    data: teachers = [], 
    isLoading: isLoadingTeachers 
  } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/teacher'],
  });
  
  const { 
    data: allBehaviorPoints = [], 
    isLoading: isLoadingPoints 
  } = useQuery<BehaviorPoint[]>({
    queryKey: ['/api/behavior-points/recent'],
  });
  
  const { 
    data: behaviorCategories = [], 
    isLoading: isLoadingCategories 
  } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });
  
  // Overall loading state
  const isLoading = isLoadingHouses || isLoadingStudents || isLoadingTeachers || 
                   isLoadingPoints || isLoadingCategories;
  
  // Calculate admin metrics
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalHouses = houses.length;
  
  const today = new Date();
  const todayPoints = allBehaviorPoints.filter(p => {
    const pointDate = new Date(p.timestamp);
    return pointDate.toDateString() === today.toDateString();
  });
  const todayActivityCount = todayPoints.length;
  
  // Last 7 days data for trends
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toDateString();
  });
  
  const dailyActivity = last7Days.map(day => {
    const pointsForDay = allBehaviorPoints.filter(p => new Date(p.timestamp).toDateString() === day);
    const positive = pointsForDay.filter(p => p.points > 0).length;
    const negative = pointsForDay.filter(p => p.points < 0).length;
    return {
      date: formatShortDate(new Date(day).toISOString()),
      total: pointsForDay.length,
      positive,
      negative
    };
  }).reverse();
  
  // House points data
  const houseData = useMemo(() => 
    houses.map(house => ({
      name: house.name,
      points: house.points,
      color: house.color
    })).sort((a, b) => b.points - a.points),
  [houses]);
  
  // Category distribution data
  const categoryData = useMemo(() => {
    const countByCategory = allBehaviorPoints.reduce((acc, point) => {
      const categoryId = point.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = { positive: 0, negative: 0 };
      }
      
      if (point.points > 0) {
        acc[categoryId].positive += 1;
      } else {
        acc[categoryId].negative += 1;
      }
      
      return acc;
    }, {} as Record<number, { positive: number, negative: number }>);
    
    return Object.entries(countByCategory).map(([categoryId, counts]) => {
      const category = behaviorCategories.find(c => c.id === parseInt(categoryId));
      return {
        name: category?.name || `Category ${categoryId}`,
        positive: counts.positive,
        negative: counts.negative,
        total: counts.positive + counts.negative
      };
    }).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [allBehaviorPoints, behaviorCategories]);
  
  // Teacher engagement data
  const teacherEngagement = useMemo(() => {
    const pointsByTeacher = allBehaviorPoints.reduce((acc, point) => {
      const teacherId = point.teacherId;
      if (!acc[teacherId]) {
        acc[teacherId] = 0;
      }
      acc[teacherId]++;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.entries(pointsByTeacher)
      .map(([teacherId, count]) => {
        const teacher = teachers.find(t => t.id === parseInt(teacherId));
        return {
          name: teacher ? `${teacher.firstName} ${teacher.lastName}` : `Teacher ${teacherId}`,
          id: parseInt(teacherId),
          points: count
        };
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [allBehaviorPoints, teachers]);
  
  // Student metrics
  const topStudents = useMemo(() => {
    const pointsByStudent = allBehaviorPoints.reduce((acc, point) => {
      const studentId = point.studentId;
      if (!acc[studentId]) {
        acc[studentId] = 0;
      }
      acc[studentId] += point.points;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.entries(pointsByStudent)
      .map(([studentId, points]) => {
        const student = students.find(s => s.id === parseInt(studentId));
        return {
          name: student ? `${student.firstName} ${student.lastName}` : `Student ${studentId}`,
          id: parseInt(studentId),
          points: points
        };
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [allBehaviorPoints, students]);
  
  // Get students who need attention (most negative points recently)
  const studentsNeedingAttention = useMemo(() => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentNegativePoints = allBehaviorPoints
      .filter(p => p.points < 0 && new Date(p.timestamp) >= lastWeek)
      .reduce((acc, point) => {
        const studentId = point.studentId;
        if (!acc[studentId]) {
          acc[studentId] = { count: 0, points: 0 };
        }
        acc[studentId].count += 1;
        acc[studentId].points += point.points;
        return acc;
      }, {} as Record<number, { count: number, points: number }>);
    
    return Object.entries(recentNegativePoints)
      .map(([studentId, data]) => {
        const student = students.find(s => s.id === parseInt(studentId));
        return {
          id: parseInt(studentId),
          name: student ? `${student.firstName} ${student.lastName}` : `Student ${studentId}`,
          count: data.count,
          points: data.points
        };
      })
      .sort((a, b) => a.points - b.points) // Sort by most negative points
      .slice(0, 4);
  }, [allBehaviorPoints, students]);
  
  // Display loading skeleton when data is being fetched
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Executive Overview skeleton */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-neutral/20 rounded animate-pulse"></div>
                    <div className="h-7 w-16 bg-neutral/20 rounded animate-pulse"></div>
                  </div>
                  <div className="rounded-full w-12 h-12 bg-neutral/20 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Quick Actions skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-neutral/20 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-60 bg-neutral/20 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-neutral/10 rounded-lg h-24 animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Students Cards skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-6 w-48 bg-neutral/20 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-60 bg-neutral/20 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center space-x-3 pb-3 border-b">
                      <div className="rounded-full w-8 h-8 bg-neutral/20 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-neutral/20 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-24 bg-neutral/20 rounded animate-pulse"></div>
                      </div>
                      <div className="h-8 w-16 bg-neutral/20 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      {/* Executive Overview */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={totalStudents}
          icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />}
          color="bg-blue-600"
        />
        <StatsCard
          title="Total Teachers"
          value={totalTeachers}
          icon={<User className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />}
          color="bg-indigo-600"
        />
        <StatsCard
          title="Activity Today"
          value={todayActivityCount}
          icon={<Activity className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />}
          trend={todayActivityCount > 20 ? 'up' : todayActivityCount < 10 ? 'down' : 'neutral'}
          trendLabel={todayActivityCount > 20 ? 'Above target' : todayActivityCount < 10 ? 'Below target' : 'On target'}
          color="bg-emerald-600"
        />
        <StatsCard
          title="Houses"
          value={totalHouses}
          icon={<Trophy className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />}
          color="bg-amber-600"
        />
      </div>
      
      {/* Administrative Actions - Mobile Carousel, Desktop Grid */}
      <Card>
        <CardHeader className="py-3 md:py-4">
          <CardTitle className="text-lg md:text-xl">Administrative Actions</CardTitle>
          <CardDescription>Quick access to administrative functions</CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          {/* Mobile view with Carousel */}
          <div className="block md:hidden w-full">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <div className="min-w-[140px] flex-shrink-0">
                <QuickActionButton
                  icon={<PlusCircle className="h-5 w-5" />}
                  label="Award Points"
                  onClick={() => navigate('/points')}
                  highlight={true}
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-[140px] flex-shrink-0">
                <QuickActionButton
                  icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                  label="Incident Reports"
                  onClick={() => navigate('/incidents')}
                  highlight={true}
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-[140px] flex-shrink-0">
                <QuickActionButton
                  icon={<Trophy className="h-5 w-5" />}
                  label="House Points"
                  onClick={() => navigate('/house/dashboard')}
                  highlight={true}
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-[140px] flex-shrink-0">
                <QuickActionButton
                  icon={<Settings className="h-5 w-5" />}
                  label="Admin"
                  onClick={() => {
                    navigate('/admin');
                    // Set activeTab to 'overview' through URL parameter
                    setTimeout(() => { 
                      const urlParams = new URLSearchParams(window.location.search);
                      urlParams.set('tab', 'overview');
                      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
                      // Trigger a reload to ensure tab change
                      window.location.reload();
                    }, 50);
                  }}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
          
          {/* Desktop view with Grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<PlusCircle className="h-6 w-6" />}
              label="Award Points"
              onClick={() => navigate('/points')}
              highlight={true}
              className="w-full h-full"
            />
            <QuickActionButton
              icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
              label="Incident Reports"
              onClick={() => navigate('/incidents')}
              highlight={true}
              className="w-full h-full"
            />
            <QuickActionButton
              icon={<Trophy className="h-6 w-6" />}
              label="House Points"
              onClick={() => navigate('/house/dashboard')}
              highlight={true}
              className="w-full h-full"
            />
            <QuickActionButton
              icon={<Settings className="h-6 w-6" />}
              label="Admin"
              onClick={() => {
                navigate('/admin');
                // Set activeTab to 'overview' through URL parameter
                setTimeout(() => { 
                  const urlParams = new URLSearchParams(window.location.search);
                  urlParams.set('tab', 'overview');
                  window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
                  // Trigger a reload to ensure tab change
                  window.location.reload();
                }, 50);
              }}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Students Needing Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Left column - Students that need attention */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Students Needing Attention</CardTitle>
            <CardDescription>Based on recent behavior concerns</CardDescription>
          </CardHeader>
          <CardContent>
            {studentsNeedingAttention.length > 0 ? (
              <div className="space-y-4">
                {studentsNeedingAttention.map((student, i) => (
                  <div key={i} className="flex items-center space-x-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="bg-amber-100 text-amber-700 w-8 h-8 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.count} incidents, {student.points} points
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/student?id=${student.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Smile className="h-10 w-10 text-emerald-500 mb-2" />
                <h3 className="text-lg font-medium">No concerns detected</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  All students appear to be doing well! No significant behavior concerns in the past week.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Right column - Top performing students */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top Performing Students</CardTitle>
            <CardDescription>Highest point earners</CardDescription>
          </CardHeader>
          <CardContent>
            {topStudents.length > 0 ? (
              <div className="space-y-4">
                {topStudents.map((student, i) => (
                  <div key={i} className="flex items-center space-x-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.points} total points earned
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/student?id=${student.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Award className="h-10 w-10 text-muted-foreground mb-2 opacity-40" />
                <h3 className="text-lg font-medium">No data available</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Student performance data will appear here once points are assigned.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activities - Split by Positive and Negative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Positive Behavior */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-emerald-500" />
                  <span>Positive Behavior</span>
                </CardTitle>
                <CardDescription>Recent positive behavior records</CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 font-normal">
                {allBehaviorPoints.filter(p => p.points > 0).length} Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-4 max-h-[350px] overflow-y-auto">
              {allBehaviorPoints
                .filter(p => p.points > 0)
                .slice(0, 8)
                .map((point, i) => (
                  <div key={i} className="flex items-center space-x-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full">
                      <Star className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {point.student 
                          ? `${point.student.firstName} ${point.student.lastName}` 
                          : `Student ${point.studentId}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span className="truncate max-w-[150px]">
                          {point.category?.name || point.notes?.split(' - ')[0] || 'Behavior record'}:
                          <span className="text-emerald-600 ml-1">+{point.points}</span>
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatShortDate(point.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        By: {point.teacher 
                          ? `${point.teacher.firstName} ${point.teacher.lastName}` 
                          : `Teacher ${point.teacherId}`}
                      </div>
                    </div>
                  </div>
                ))}
              
              {allBehaviorPoints.filter(p => p.points > 0).length === 0 && (
                <div className="text-center py-8">
                  <Star className="h-8 w-8 text-muted-foreground mb-2 mx-auto opacity-40" />
                  <p className="text-sm text-muted-foreground">No positive behavior records found.</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/reports')}>
              <Activity className="h-4 w-4 mr-2" />
              View All Positive Records
            </Button>
          </CardFooter>
        </Card>
        
        {/* Negative Behavior */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  <span>Behavior Concerns</span>
                </CardTitle>
                <CardDescription>Recent behavior concerns</CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 font-normal">
                {allBehaviorPoints.filter(p => p.points < 0).length} Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-4 max-h-[350px] overflow-y-auto">
              {allBehaviorPoints
                .filter(p => p.points < 0)
                .slice(0, 8)
                .map((point, i) => (
                  <div key={i} className="flex items-center space-x-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="bg-rose-100 text-rose-700 p-2 rounded-full">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {point.student 
                          ? `${point.student.firstName} ${point.student.lastName}` 
                          : `Student ${point.studentId}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span className="truncate max-w-[150px]">
                          {point.category?.name || point.notes?.split(' - ')[0] || 'Behavior record'}:
                          <span className="text-rose-600 ml-1">{point.points}</span>
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatShortDate(point.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        By: {point.teacher 
                          ? `${point.teacher.firstName} ${point.teacher.lastName}` 
                          : `Teacher ${point.teacherId}`}
                      </div>
                    </div>
                  </div>
                ))}
              
              {allBehaviorPoints.filter(p => p.points < 0).length === 0 && (
                <div className="text-center py-8">
                  <Smile className="h-8 w-8 text-muted-foreground mb-2 mx-auto opacity-40" />
                  <p className="text-sm text-muted-foreground">No behavior concerns recorded yet.</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/reports')}>
              <Activity className="h-4 w-4 mr-2" />
              View All Concerns
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - House & School Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>School Activity Metrics</CardTitle>
                <CardDescription>
                  Daily behavior point activity across the school
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  Last 7 Days
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Full Report</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyActivity}>
                    <defs>
                      <linearGradient id="positive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={POSITIVE_COLOR} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={POSITIVE_COLOR} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="negative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={NEGATIVE_COLOR} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={NEGATIVE_COLOR} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="positive" stroke={POSITIVE_COLOR} fillOpacity={1} fill="url(#positive)" />
                    <Area type="monotone" dataKey="negative" stroke={NEGATIVE_COLOR} fillOpacity={1} fill="url(#negative)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <div className="grid grid-cols-3 border-t border-border">
              <div className="p-4 text-center">
                <div className="text-3xl font-bold">{allBehaviorPoints.filter(p => p.points > 0).length}</div>
                <div className="text-xs text-muted-foreground mt-1">Positive Records</div>
              </div>
              <div className="p-4 text-center border-l border-r border-border">
                <div className="text-3xl font-bold">{allBehaviorPoints.filter(p => p.points < 0).length}</div>
                <div className="text-xs text-muted-foreground mt-1">Behavior Concerns</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-3xl font-bold">{allBehaviorPoints.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Records</div>
              </div>
            </div>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Behavior Categories</CardTitle>
                <CardDescription>Most frequently recorded behaviors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">{category.name}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="text-emerald-500">{category.positive} positive</span>
                            <span className="mx-1">·</span>
                            <span className="text-rose-500">{category.negative} negative</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium">{category.total}</span>
                      </div>
                      <Progress value={(category.total / (categoryData[0]?.total || 1)) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Teacher Engagement</CardTitle>
                <CardDescription>Most active teachers this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherEngagement.map((teacher, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{i+1}.</span>
                          <span className="font-medium">{teacher.name}</span>
                        </div>
                        <span className="text-sm font-medium">{teacher.points} entries</span>
                      </div>
                      <Progress value={(teacher.points / (teacherEngagement[0]?.points || 1)) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Right column - House Rankings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>House Competition</CardTitle>
              <CardDescription>Current house point standings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {houseData.map((house, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: house.color }}>
                          <span className="text-white font-bold">{i+1}</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-semibold">{house.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {i === 0 ? (
                              <span className="text-amber-500 font-medium">Currently in the lead</span>
                            ) : (
                              <span>{house.points} points behind leader</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-lg font-bold">{house.points}</span>
                    </div>
                    <Progress 
                      value={(house.points / (houseData[0]?.points || 1)) * 100} 
                      className="h-2"
                      style={{ 
                        backgroundColor: `${house.color}20`,
                        '--progress-foreground': house.color
                      } as React.CSSProperties}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Dashboard for teacher users
function TeacherDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Fetch necessary data
  const { 
    data: houses = [], 
    isLoading: isLoadingHouses 
  } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });
  
  const { 
    data: recentPoints = [], 
    isLoading: isLoadingRecentPoints 
  } = useQuery<BehaviorPoint[]>({ 
    queryKey: ['/api/behavior-points/recent'],
    refetchInterval: 10000 // Refresh data every 10 seconds
  });
  
  const { 
    data: teacherPoints = [], 
    isLoading: isLoadingTeacherPoints 
  } = useQuery<BehaviorPoint[]>({
    queryKey: [`/api/behavior-points/teacher/${user?.id}`],
    enabled: !!user && !!user.id
  });
  
  const { 
    data: students = [], 
    isLoading: isLoadingStudents 
  } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/student'],
  });
  
  const { 
    data: behaviorCategories = [],
    isLoading: isLoadingCategories
  } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });
  
  // Overall loading state
  const isLoading = isLoadingHouses || isLoadingRecentPoints || isLoadingTeacherPoints || 
                   isLoadingStudents || isLoadingCategories;
  
  // Calculate metrics
  const totalPointsGiven = teacherPoints.reduce((sum, point) => sum + Math.abs(point.points), 0) || 0;
  const positivePoints = teacherPoints.filter(p => p.points > 0).length;
  const negativePoints = teacherPoints.filter(p => p.points < 0).length;
  
  // Calculate today's activity
  const today = new Date();
  const todayPoints = teacherPoints.filter(p => {
    const pointDate = new Date(p.timestamp);
    return pointDate.toDateString() === today.toDateString();
  });
  const todayActivityCount = todayPoints.length;
  
  // Create data for visualization of teacher's points by category
  const categoryDistribution = useMemo(() => {
    const countByCategory = teacherPoints.reduce((acc, point) => {
      const categoryId = point.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = { positive: 0, negative: 0 };
      }
      
      if (point.points > 0) {
        acc[categoryId].positive += 1;
      } else {
        acc[categoryId].negative += 1;
      }
      
      return acc;
    }, {} as Record<number, { positive: number, negative: number }>);
    
    return Object.entries(countByCategory).map(([categoryId, counts]) => {
      const category = behaviorCategories.find(c => c.id === parseInt(categoryId));
      return {
        name: category?.name || `Category ${categoryId}`,
        positive: counts.positive,
        negative: counts.negative,
        total: counts.positive + counts.negative
      };
    }).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [teacherPoints, behaviorCategories]);
  
  // Get students who need attention (most negative points recently)
  const studentsNeedingAttention = useMemo(() => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentNegativePoints = recentPoints
      .filter(p => p.points < 0 && new Date(p.timestamp) >= lastWeek)
      .reduce((acc, point) => {
        const studentId = point.studentId;
        if (!acc[studentId]) {
          acc[studentId] = { count: 0, points: 0 };
        }
        acc[studentId].count += 1;
        acc[studentId].points += point.points;
        return acc;
      }, {} as Record<number, { count: number, points: number }>);
    
    return Object.entries(recentNegativePoints)
      .map(([studentId, data]) => {
        const student = students.find(s => s.id === parseInt(studentId));
        return {
          id: parseInt(studentId),
          name: student ? `${student.firstName} ${student.lastName}` : `Student ${studentId}`,
          count: data.count,
          points: data.points
        };
      })
      .sort((a, b) => a.points - b.points) // Sort by most negative points
      .slice(0, 4);
  }, [recentPoints, students]);
  
  // Last 7 days activity for teacher
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toDateString();
  });
  
  const teacherDailyActivity = last7Days.map(day => {
    const pointsForDay = teacherPoints.filter(p => new Date(p.timestamp).toDateString() === day);
    const positive = pointsForDay.filter(p => p.points > 0).length;
    const negative = pointsForDay.filter(p => p.points < 0).length;
    return {
      date: formatShortDate(new Date(day).toISOString()),
      positive,
      negative,
      total: pointsForDay.length
    };
  }).reverse();
  
  // Loading state for teacher dashboard
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Teacher Stats Overview skeleton */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 space-y-2">
              <Skeleton className="h-5 w-24" />
              <div className="flex justify-between items-center mt-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
        
        {/* Quick Actions skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Main dashboard skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-52" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[250px] w-full" />
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-6" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-6 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 pb-3 border-b last:border-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Teacher Stats Overview */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <StatsCard
          title="Points Awarded"
          value={totalPointsGiven}
          icon={<Award className="h-6 w-6 text-primary" />}
          color="bg-primary"
        />
        <StatsCard
          title="Activity Today"
          value={todayActivityCount}
          icon={<Clock className="h-6 w-6 text-emerald-600" />}
          trend={todayActivityCount > 5 ? 'up' : todayActivityCount === 0 ? 'down' : 'neutral'}
          trendLabel={todayActivityCount > 5 ? 'Active' : todayActivityCount === 0 ? 'No activity' : 'Normal'}
          color="bg-emerald-600"
        />
        <StatsCard
          title="Positive Behaviors"
          value={positivePoints}
          trendValue={`${Math.round((positivePoints / (positivePoints + negativePoints || 1)) * 100)}%`}
          icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
          color="bg-emerald-600"
        />
        <StatsCard
          title="Behavior Concerns"
          value={negativePoints}
          trendValue={`${Math.round((negativePoints / (positivePoints + negativePoints || 1)) * 100)}%`}
          icon={<AlertTriangle className="h-6 w-6 text-rose-600" />}
          color="bg-rose-600"
        />
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used tools and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <QuickActionButton
              icon={<PlusCircle className="h-6 w-6" />}
              label="Award Points"
              onClick={() => navigate('/points')}
              highlight={true}
            />
            <QuickActionButton
              icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
              label="Incident Reports"
              onClick={() => navigate('/incidents')}
              highlight={true}
            />
            <QuickActionButton
              icon={<BarChart className="h-6 w-6" />}
              label="View Reports"
              onClick={() => navigate('/reports')}
            />
            <QuickActionButton
              icon={<Trophy className="h-6 w-6" />}
              label="House Standings"
              onClick={() => navigate('/house/dashboard')}
            />
            <QuickActionButton
              icon={<List className="h-6 w-6" />}
              label="Student List"
              onClick={() => navigate('/students')}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Activity & Categories */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Your Recent Activity</CardTitle>
              <CardDescription>Points awarded over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={teacherDailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="positive" name="Positive Points" fill={POSITIVE_COLOR} />
                    <Bar dataKey="negative" name="Behavior Concerns" fill={NEGATIVE_COLOR} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Top Categories</CardTitle>
                <CardDescription>Most frequently used behavior categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryDistribution.map((category, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">{category.name}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="text-emerald-500">{category.positive} positive</span>
                            {category.negative > 0 && (
                              <>
                                <span className="mx-1">·</span>
                                <span className="text-rose-500">{category.negative} concerns</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium">{category.total}</span>
                      </div>
                      <Progress value={(category.total / (categoryDistribution[0]?.total || 1)) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Students Needing Attention</CardTitle>
                <CardDescription>Based on recent behavior concerns</CardDescription>
              </CardHeader>
              <CardContent>
                {studentsNeedingAttention.length > 0 ? (
                  <div className="space-y-4">
                    {studentsNeedingAttention.map((student, i) => (
                      <div key={i} className="flex items-center space-x-3 pb-3 border-b last:border-0 last:pb-0">
                        <div className="bg-amber-100 text-amber-700 w-8 h-8 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.count} incidents, {student.points} points
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/student?id=${student.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Smile className="h-10 w-10 text-emerald-500 mb-2" />
                    <h3 className="text-lg font-medium">No concerns detected</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      All students appear to be doing well! No significant behavior concerns in the past week.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Right column - House Competition & Recent Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>House Competition</CardTitle>
              <CardDescription>Current standings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {houses
                  .sort((a, b) => b.points - a.points)
                  .map((house, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-12 rounded-l-full mr-3" 
                            style={{ backgroundColor: house.color }}
                          />
                          <div>
                            <div className="font-medium">{house.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {i === 0 ? 'Currently leading' : `${house.points - houses[i-1].points} points behind ${houses[i-1].name}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold">{house.points}</div>
                      </div>
                      <Progress 
                        value={(house.points / (houses[0]?.points || 1)) * 100} 
                        className="h-2"
                        style={{ 
                          backgroundColor: `${house.color}20`,
                          '--progress-foreground': house.color
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/house/dashboard')}>
                <Trophy className="h-4 w-4 mr-2" />
                View House Dashboard
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest behavior records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPoints.slice(0, 5).map((point, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 last:pb-0 last:pt-2">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${point.points > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {point.points > 0 ? (
                          <Star className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {point.student 
                            ? `${point.student.firstName} ${point.student.lastName}` 
                            : `Student ${point.studentId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {point.category?.name || point.notes?.split(' - ')[0] || 'Behavior record'}:
                          {point.points > 0 ? (
                            <span className="text-emerald-600 ml-1">+{point.points}</span>
                          ) : (
                            <span className="text-rose-600 ml-1">{point.points}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatShortDate(point.timestamp)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/reports')}>
                <Activity className="h-4 w-4 mr-2" />
                View All Activity
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Main component that decides which dashboard to render based on user role
export default function EnhancedDashboard() {
  const { user } = useAuth();
  
  return (
    <TooltipProvider>
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            <span className="block">{getGreeting()}, </span>
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
        
        {user?.role === 'admin' ? <AdminDashboard /> : <TeacherDashboard />}
      </div>
    </TooltipProvider>
  );
}