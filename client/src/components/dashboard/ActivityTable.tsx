import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { BehaviorPoint, BehaviorCategory, User } from '@shared/schema';
import { format } from 'date-fns';

interface EnrichedBehaviorPoint extends BehaviorPoint {
  student: Pick<User, 'id' | 'firstName' | 'lastName' | 'gradeLevel' | 'section'> | null;
  teacher: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
  category: BehaviorCategory | null;
}

export default function ActivityTable() {
  const { data: activityData, isLoading } = useQuery<EnrichedBehaviorPoint[]>({
    queryKey: ['/api/behavior-points/recent?limit=10'],
    refetchInterval: 10000, // Refresh data every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-neutral">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Student</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Action</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Category</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Points</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Teacher</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Time</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activityData && activityData.length > 0 ? (
            activityData.map((activity) => (
              <tr key={activity.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-neutral-light flex items-center justify-center">
                      <span className="font-semibold text-neutral-dark">
                        {activity.student ? 
                          `${activity.student.firstName.charAt(0)}${activity.student.lastName.charAt(0)}` : 
                          'N/A'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-neutral-darker">
                        {activity.student ? 
                          `${activity.student.firstName} ${activity.student.lastName}` : 
                          'Unknown Student'}
                      </div>
                      <div className="text-xs text-neutral-dark">
                        {activity.student ? 
                          `Grade ${activity.student.gradeLevel}${activity.student.section}` : 
                          'Unknown Grade'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    activity.points > 0 
                      ? 'bg-success bg-opacity-10 text-success' 
                      : 'bg-error bg-opacity-10 text-error'
                  }`}>
                    {activity.points > 0 ? 'Awarded' : 'Deducted'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-darker">
                    {activity.category ? activity.category.name : 'Unknown Category'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-mono font-semibold ${
                    activity.points > 0 ? 'text-success' : 'text-error'
                  }`}>
                    {activity.points > 0 ? `+${activity.points}` : activity.points}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                  {activity.teacher ? 
                    `${activity.teacher.firstName} ${activity.teacher.lastName}` : 
                    'Unknown Teacher'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
                  {format(new Date(activity.timestamp), 'h:mm a')}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-neutral-dark">
                No recent activity to display
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
