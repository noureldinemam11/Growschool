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
    
    // Debug log to check if points data is coming through
    console.log('Points data for trend chart:', points);
    
    if (chartPeriod === 'week') {
      // Fix for the weekly display - show the current week properly
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday of current week
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const dateStr = dayNames[i];
        
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
      // Use the current date to determine which week we're in
      const currentDate = now.getDate();
      const currentMonth = now.getMonth();
      
      // Instead of using complex week calculations, show 4 weeks of the current month
      // Split the month into 4 parts
      const daysInMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();
      const weekSize = Math.ceil(daysInMonth / 4);
      
      for (let weekNum = 0; weekNum < 4; weekNum++) {
        const weekStart = weekNum * weekSize + 1;
        const weekEnd = Math.min((weekNum + 1) * weekSize, daysInMonth);
        
        const startDate = new Date(now.getFullYear(), currentMonth, weekStart);
        const endDate = new Date(now.getFullYear(), currentMonth, weekEnd);
        
        const dateStr = `${currentMonth + 1}/${weekStart}-${currentMonth + 1}/${weekEnd}`;
        
        // Find points assigned in this date range
        const weekPoints = points.filter(p => {
          const pointDate = new Date(p.timestamp);
          const pointDay = pointDate.getDate();
          const pointMonth = pointDate.getMonth();
          const pointYear = pointDate.getFullYear();
          
          // If the point is in the current month and within this week's range
          return pointMonth === currentMonth && 
                 pointYear === now.getFullYear() &&
                 pointDay >= weekStart && 
                 pointDay <= weekEnd;
        }).reduce((sum, p) => sum + p.points, 0);
        
        data.push({ date: dateStr, value: weekPoints });
      }
      
      // If we have no points in the chart but the student has points, check which week they should be in
      if (points.length > 0 && data.every(d => d.value === 0)) {
        // Identify the appropriate week for each point and add them to the chart
        points.forEach(point => {
          const pointDate = new Date(point.timestamp);
          const pointDay = pointDate.getDate();
          
          // Skip if not in current month/year
          if (pointDate.getMonth() !== currentMonth || pointDate.getFullYear() !== now.getFullYear()) {
            return;
          }
          
          // Figure out which week this point belongs to
          const weekIndex = Math.floor((pointDay - 1) / weekSize);
          if (weekIndex >= 0 && weekIndex < 4) {
            data[weekIndex].value += point.points;
          }
        });
      }
    } else { // year
      // Last 6 months display
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const dateStr = date.toLocaleDateString('en-US', { month: 'short' });
        
        // Find points assigned in this month
        const monthPoints = points.filter(p => {
          const pointDate = new Date(p.timestamp);
          return pointDate.getMonth() === monthIndex &&
                 pointDate.getFullYear() === year;
        }).reduce((sum, p) => sum + p.points, 0);
        
        data.push({ date: dateStr, value: monthPoints });
      }
    }
    
    // Global fallback: if we still have no points in the chart but the student has points
    if (points.length > 0 && data.every(d => d.value === 0)) {
      // Add all points to today/current period
      const totalPoints = points.reduce((sum, p) => sum + p.points, 0);
      if (totalPoints !== 0) {
        // Add to the last bar in the chart (representing the current period)
        data[data.length - 1].value = totalPoints;
      }
    }
    
    console.log('Trend data being displayed:', data);
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

  // Removing all action buttons from student detail as requested

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
          
          {/* Action buttons have been removed as requested */}
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
          {/* Enhanced chart visualization */}
          <div className="h-44 flex items-end justify-between gap-1 mt-3">
            {trendData.length > 0 ? (
              trendData.map((data, index) => {
                // Find the maximum value to scale properly
                const maxValue = Math.max(10, ...trendData.map(d => Math.abs(d.value)));
                // Scale height between 5% and 90% of the container
                const height = data.value 
                  ? Math.max(5, Math.min(90, (Math.abs(data.value) / maxValue) * 90)) 
                  : 5;
                
                return (
                  <div key={index} className="flex flex-col items-center justify-end flex-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 -translate-x-1/2 left-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {data.date}: {data.value > 0 ? '+' : ''}{data.value} points
                    </div>
                    
                    {/* Bar */}
                    <div className="w-full rounded-t-sm flex flex-col items-center">
                      {/* Value label */}
                      <div className="text-xs font-mono font-semibold mb-1">
                        {data.value > 0 ? '+' : ''}{data.value}
                      </div>
                      
                      {/* Actual bar */}
                      <div 
                        className={`w-full rounded-md ${data.value >= 0 ? 'bg-success' : 'bg-error'}`}
                        style={{ 
                          height: `${height}%`,
                          minHeight: '5px',
                          transition: 'height 0.3s ease'
                        }}
                      ></div>
                    </div>
                    
                    {/* Date label */}
                    <div className="text-xs text-neutral-dark mt-1 truncate w-full text-center">
                      {data.date}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full flex flex-col items-center justify-center h-44">
                <p className="text-neutral-dark">No data available for this time period</p>
              </div>
            )}
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
