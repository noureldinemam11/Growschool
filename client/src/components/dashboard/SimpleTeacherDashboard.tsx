import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { House, BehaviorPoint, BehaviorCategory, User as UserType } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  User,
  Trophy,
  Star,
  BarChart,
  Activity,
  BookOpen,
  PlusCircle,
  Calendar
} from 'lucide-react';

export default function SimpleTeacherDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Fetch necessary data
  const { data: houses = [] } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });
  
  const { data: recentPoints = [] } = useQuery<BehaviorPoint[]>({ 
    queryKey: ['/api/behavior-points/recent'],
  });
  
  const { data: teacherPoints = [] } = useQuery<BehaviorPoint[]>({
    queryKey: [`/api/behavior-points/teacher/${user?.id}`],
    enabled: !!user && !!user.id
  });
  
  const { data: students = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users/role/student'],
  });
  
  const { data: behaviorCategories = [] } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });
  
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
  
  return (
    <div className="space-y-6">
      {/* Teacher Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Students</p>
                <h3 className="text-3xl font-bold tracking-tight">{students.length}</h3>
              </div>
              <div className="p-3 rounded-full bg-blue-600 bg-opacity-10">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Points Given</p>
                <h3 className="text-3xl font-bold tracking-tight">{totalPointsGiven}</h3>
              </div>
              <div className="p-3 rounded-full bg-emerald-600 bg-opacity-10">
                <Star className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Today's Activity</p>
                <h3 className="text-3xl font-bold tracking-tight">{todayActivityCount}</h3>
              </div>
              <div className="p-3 rounded-full bg-purple-600 bg-opacity-10">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <h3 className="text-3xl font-bold tracking-tight">{behaviorCategories.length}</h3>
              </div>
              <div className="p-3 rounded-full bg-amber-600 bg-opacity-10">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Record student behavior and view classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate('/points/award')}
              variant="default"
              className="h-auto py-4 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500 to-emerald-700"
            >
              <PlusCircle className="h-8 w-8" />
              <span className="font-semibold">Award Points</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/points/deduct')}
              variant="default"
              className="h-auto py-4 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-rose-500 to-rose-700"
            >
              <PlusCircle className="h-8 w-8" />
              <span className="font-semibold">Deduct Points</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/students')}
              variant="default"
              className="h-auto py-4 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-500 to-blue-700"
            >
              <Users className="h-8 w-8" />
              <span className="font-semibold">View Students</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest behavior points recorded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentPoints.slice(0, 5).map((point, i) => {
                  const student = students.find(s => s.id === point.studentId);
                  const category = behaviorCategories.find(c => c.id === point.categoryId);
                  const isPositive = point.points > 0;
                  
                  return (
                    <div key={i} className="flex items-start space-x-4">
                      <div className={`mt-1 p-2 rounded-full ${isPositive ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        {isPositive ? (
                          <Star className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Activity className="h-4 w-4 text-rose-600" />
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                          </p>
                          <Badge variant={isPositive ? "outline" : "secondary"} className={
                            isPositive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700' : 
                            'bg-rose-50 text-rose-700 hover:bg-rose-50 hover:text-rose-700'
                          }>
                            {isPositive ? `+${point.points}` : point.points}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {category?.name || 'Unknown Category'} - {new Date(point.timestamp).toLocaleString()}
                        </p>
                        {point.notes && (
                          <p className="text-sm border-l-2 border-muted pl-2 mt-1 italic">
                            {point.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <Button variant="ghost" className="ml-auto" size="sm">
                View All Activity
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right column - House Points & Calendar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>House Points</CardTitle>
              <CardDescription>Current standings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {houses.sort((a, b) => b.points - a.points).map((house, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: house.color }}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <p className="text-sm font-medium">{house.name}</p>
                        <p className="text-sm font-medium">{house.points}</p>
                      </div>
                    </div>
                    <Progress value={(house.points / (houses[0]?.points || 1)) * 100} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>School calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-medium">House Competition</p>
                    <p className="text-sm text-muted-foreground">Next Friday - Main Hall</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-medium">End of Term Awards</p>
                    <p className="text-sm text-muted-foreground">December 15th</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <Button variant="ghost" className="ml-auto" size="sm">
                View Calendar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}