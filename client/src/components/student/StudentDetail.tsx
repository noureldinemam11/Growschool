import { FC } from 'react';
import { User, BehaviorPoint } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface StudentDetailProps {
  student: Partial<User>;
  points: BehaviorPoint[];
  isLoading: boolean;
}

const StudentDetail: FC<StudentDetailProps> = ({ student, points, isLoading }) => {
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
  
  // Pretend the goal is 200 points for example purposes
  const goalPoints = 200;
  const goalPercentage = Math.min(100, Math.round((totalPoints / goalPoints) * 100));

  // Mock data for category breakdown
  const categoryBreakdown = {
    academic: Math.round(positivePoints * 0.4),
    behavior: Math.round(positivePoints * 0.5),
    extra: Math.round(positivePoints * 0.1)
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="text-xl font-semibold">
                  {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-heading font-bold text-neutral-darker">
                  {student.firstName} {student.lastName}
                </h2>
                <div className="text-neutral-dark">
                  {student.gradeLevel && student.section 
                    ? `Grade ${student.gradeLevel}${student.section}` 
                    : ''}
                  {student.houseId && ` • House #${student.houseId}`}
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 bg-neutral-light p-4 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-neutral-dark">Total Points</div>
                <div className="text-3xl font-mono font-bold text-primary">{totalPoints}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-neutral-dark">Progress to Goal</span>
              <span className="text-sm font-semibold">{goalPercentage}%</span>
            </div>
            <Progress value={goalPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
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
            <CardTitle className="text-sm">Point Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <div className="flex justify-between">
                  <span>Academic</span>
                  <span className="font-mono">{categoryBreakdown.academic}</span>
                </div>
                <Progress value={(categoryBreakdown.academic / positivePoints) * 100} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Behavior</span>
                  <span className="font-mono">{categoryBreakdown.behavior}</span>
                </div>
                <Progress value={(categoryBreakdown.behavior / positivePoints) * 100} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Extra</span>
                  <span className="font-mono">{categoryBreakdown.extra}</span>
                </div>
                <Progress value={(categoryBreakdown.extra / positivePoints) * 100} className="h-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDetail;
