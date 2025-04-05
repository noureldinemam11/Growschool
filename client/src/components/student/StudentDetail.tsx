import { FC, useState, useEffect } from 'react';
import { User, BehaviorPoint } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, TrendingUp, TrendingDown, Medal, Award, Calendar, 
  BookOpen, Users, Clock, ArrowUp, ArrowDown, Star, Plus, Minus, Mail
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface StudentDetailProps {
  student: Partial<User>;
  points: BehaviorPoint[];
  isLoading: boolean;
}

const StudentDetail: FC<StudentDetailProps> = ({ student, points, isLoading }) => {
  const { toast } = useToast();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [trendData, setTrendData] = useState<{date: string, value: number}[]>([]);
  
  // Fetch data about houses for house context
  const { data: houses } = useQuery<any[]>({
    queryKey: ['/api/houses'],
  });

  // Get behavior categories to map category IDs to names
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/behavior-categories'],
  });
  
  // Get teacher information to map teacher IDs to names
  const { data: teachers } = useQuery<any[]>({
    queryKey: ['/api/users/role/teacher'],
  });

  useEffect(() => {
    // Create trend data for the selected time period
    const now = new Date();
    const data: {date: string, value: number}[] = [];
    
    if (chartPeriod === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Find points assigned on this day
        const dayPoints = points.filter(p => {
          const pointDate = new Date(p.timestamp);
          return pointDate.getDate() === date.getDate() &&
                 pointDate.getMonth() === date.getMonth() &&
                 pointDate.getFullYear() === date.getFullYear();
        }).reduce((sum, p) => sum + p.points, 0);
        
        data.push({ date: dateStr, value: dayPoints });
      }
    } else if (chartPeriod === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const dateStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
        
        // Find points assigned in this week
        const weekPoints = points.filter(p => {
          const pointDate = new Date(p.timestamp);
          return pointDate >= weekStart && pointDate <= weekEnd;
        }).reduce((sum, p) => sum + p.points, 0);
        
        data.push({ date: dateStr, value: weekPoints });
      }
    } else { // year
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short' });
        
        // Find points assigned in this month
        const monthPoints = points.filter(p => {
          const pointDate = new Date(p.timestamp);
          return pointDate.getMonth() === date.getMonth() &&
                 pointDate.getFullYear() === date.getFullYear();
        }).reduce((sum, p) => sum + p.points, 0);
        
        data.push({ date: dateStr, value: monthPoints });
      }
    }
    
    setTrendData(data);
  }, [points, chartPeriod]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Calculate total points and categorize them for display
  const totalPoints = points.reduce((sum, point) => sum + point.points, 0);
  const positivePoints = points.filter(p => p.points > 0).reduce((sum, p) => sum + p.points, 0);
  const negativePoints = points.filter(p => p.points < 0).reduce((sum, p) => sum + Math.abs(p.points), 0);
  
  // Goal for points total - students should aim for 200 points
  const goalPoints = 200;
  const goalPercentage = Math.min(100, Math.round((totalPoints / goalPoints) * 100));

  // Get recent activity - last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentPoints = points
    .filter(p => new Date(p.timestamp) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const recentActivity = recentPoints.length > 0;
  const pointsThisMonth = recentPoints.reduce((sum, p) => sum + p.points, 0);

  // Detect trend direction
  const lastMonth = points.filter(p => {
    const date = new Date(p.timestamp);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    return date >= twoMonthsAgo && date < oneMonthAgo;
  }).reduce((sum, p) => sum + p.points, 0);

  const trend = pointsThisMonth > lastMonth ? 'up' : pointsThisMonth < lastMonth ? 'down' : 'same';

  // Calculate category breakdown
  const categoryBreakdown: Record<number, number> = {};
  
  points.filter(p => p.points > 0).forEach(point => {
    if (!categoryBreakdown[point.categoryId]) {
      categoryBreakdown[point.categoryId] = 0;
    }
    categoryBreakdown[point.categoryId] += point.points;
  });
  
  // Sort categories by points
  const sortedCategories = Object.keys(categoryBreakdown)
    .map(id => ({ id: parseInt(id), points: categoryBreakdown[parseInt(id)] }))
    .sort((a, b) => b.points - a.points);

  const handlePointsAction = (action: 'add' | 'deduct') => {
    // Save current student to localStorage for points assignment
    localStorage.setItem('batchSelectedStudentIds', JSON.stringify([student.id]));
    
    // Navigate to points page - when implemented will open the appropriate modal
    window.location.href = `/points?action=${action}`;
  };

  const handleParentContact = () => {
    // Example of what would happen if we were to contact the parent
    toast({
      title: "Contact feature",
      description: "This feature would allow you to send a message to the student's parent.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-4">
      {/* Student profile card with quick action buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex items-center">
              <div className="relative">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white">
                  <span className="text-xl font-semibold">
                    {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                  </span>
                </div>
                {houses && student.houseId && (
                  <div 
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
                    style={{ backgroundColor: houses.find(h => h.id === student.houseId)?.color || '#ccc' }}
                  >
                    <Medal className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-heading font-bold text-neutral-darker">
                  {student.firstName} {student.lastName}
                </h2>
                <div className="text-neutral-dark flex items-center gap-2">
                  <div className="flex items-center">
                    <BookOpen className="h-3.5 w-3.5 mr-1" />
                    {student.gradeLevel && student.section 
                      ? `Grade ${student.gradeLevel}${student.section}` 
                      : 'No Grade'}
                  </div>
                  
                  {houses && student.houseId && (
                    <div className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      <span className="flex items-center">
                        <span>{houses.find(h => h.id === student.houseId)?.name}</span>
                        <div 
                          className="w-2 h-2 rounded-full ml-1" 
                          style={{ backgroundColor: houses.find(h => h.id === student.houseId)?.color || '#ccc' }}
                        ></div>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center gap-3 bg-neutral-light p-4 rounded-lg">
              <div>
                <div className="text-sm text-neutral-dark">Total Points</div>
                <div className="text-3xl font-mono font-bold text-primary">{totalPoints}</div>
              </div>
              {trend !== 'same' && (
                <div className={`bg-${trend === 'up' ? 'success' : 'error'}/10 p-1.5 rounded-full text-${trend === 'up' ? 'success' : 'error'}`}>
                  {trend === 'up' ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-neutral-dark">Progress to Goal ({goalPoints} pts)</span>
              <span className="text-sm font-semibold">{goalPercentage}%</span>
            </div>
            <Progress value={goalPercentage} className="h-2" />
          </div>
          
          {/* Quick action buttons */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={() => handlePointsAction('add')}>
              <Plus className="h-3.5 w-3.5" />
              Award Points
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => handlePointsAction('deduct')}>
              <Minus className="h-3.5 w-3.5" />
              Deduct Points
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={handleParentContact}>
              <Mail className="h-3.5 w-3.5" />
              Contact Parent
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Points statistics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-success" />
              Positive Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-success">+{positivePoints}</div>
            <div className="text-xs text-neutral-dark mt-1">
              {points.filter(p => p.points > 0).length} positive behaviors recorded
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <TrendingDown className="h-4 w-4 mr-1 text-error" />
              Negative Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-error">-{negativePoints}</div>
            <div className="text-xs text-neutral-dark mt-1">
              {points.filter(p => p.points < 0).length} negative behaviors recorded
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold">
              {pointsThisMonth > 0 && '+'}{pointsThisMonth}
            </div>
            <div className="text-xs text-neutral-dark mt-1">
              {recentActivity 
                ? `${recentPoints.length} activities in last 30 days` 
                : 'No recent activity'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Point trends visualization */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Point Trends</CardTitle>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant={chartPeriod === 'week' ? 'default' : 'outline'} 
                className="h-7 text-xs px-2"
                onClick={() => setChartPeriod('week')}
              >
                Week
              </Button>
              <Button 
                size="sm" 
                variant={chartPeriod === 'month' ? 'default' : 'outline'} 
                className="h-7 text-xs px-2"
                onClick={() => setChartPeriod('month')}
              >
                Month
              </Button>
              <Button 
                size="sm" 
                variant={chartPeriod === 'year' ? 'default' : 'outline'} 
                className="h-7 text-xs px-2"
                onClick={() => setChartPeriod('year')}
              >
                Year
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {/* Simple chart visualization */}
          <div className="h-44 flex items-end justify-between gap-1">
            {trendData.map((data, index) => {
              const height = data.value ? Math.max(10, Math.min(100, (data.value / 20) * 100)) : 5;
              const opacity = data.value > 0 ? 1 : (data.value < 0 ? 0.8 : 0.2);
              return (
                <div key={index} className="flex flex-col items-center justify-end flex-1">
                  <div 
                    className={`w-full rounded-t-sm ${data.value >= 0 ? 'bg-success' : 'bg-error'}`}
                    style={{ 
                      height: `${height}%`, 
                      opacity: opacity,
                      minHeight: '5px'
                    }}
                  ></div>
                  <div className="text-xs text-neutral-dark mt-1 truncate w-full text-center">
                    {data.date}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Top categories and recent points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Star className="h-4 w-4 mr-1 text-primary" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {sortedCategories.slice(0, 3).map((category) => (
                <div key={category.id}>
                  <div className="flex justify-between items-center">
                    <span>
                      {categories?.find(c => c.id === category.id)?.name || `Category ${category.id}`}
                    </span>
                    <span className="font-mono font-medium text-success">+{category.points}</span>
                  </div>
                  <Progress 
                    value={(category.points / positivePoints) * 100} 
                    className="h-1 mt-1" 
                  />
                </div>
              ))}
              
              {sortedCategories.length === 0 && (
                <div className="text-center text-neutral-dark py-3">
                  No categories with positive points yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent points activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Clock className="h-4 w-4 mr-1 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-52 overflow-y-auto">
            {recentPoints.slice(0, 5).map((point, index) => (
              <div key={point.id} className="py-2">
                {index > 0 && <Separator className="my-2" />}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {categories?.find(c => c.id === point.categoryId)?.name || `Category ${point.categoryId}`}
                    </div>
                    <div className="text-xs text-neutral-dark">
                      {new Date(point.timestamp).toLocaleDateString()} • 
                      {teachers?.find(t => t.id === point.teacherId)?.firstName || `Teacher ${point.teacherId}`}
                    </div>
                    {point.notes && (
                      <div className="text-xs text-neutral-dark mt-1 italic">
                        "{point.notes}"
                      </div>
                    )}
                  </div>
                  <Badge 
                    className={point.points > 0 ? 'bg-success' : 'bg-error'}
                  >
                    {point.points > 0 ? `+${point.points}` : point.points}
                  </Badge>
                </div>
              </div>
            ))}
            
            {recentPoints.length === 0 && (
              <div className="text-center text-neutral-dark py-6">
                No recent activity in the last 30 days
              </div>
            )}
          </CardContent>
          {recentPoints.length > 5 && (
            <CardFooter className="pt-0">
              <Button variant="link" className="w-full text-xs" onClick={() => {}}>
                View all {recentPoints.length} activities
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDetail;
