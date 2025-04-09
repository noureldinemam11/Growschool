import { useQuery } from '@tanstack/react-query';
import { Pod } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';

// Define color schemes for pods
interface ColorScheme {
  bg: string;
  bgLight: string;
  text: string;
}

const defaultColor: ColorScheme = {
  bg: 'bg-gray-500',
  bgLight: 'bg-gray-200',
  text: 'text-gray-700'
};

export default function PodStandingsCard() {
  const [_, setLocation] = useLocation();
  
  // Fetch pods data for the standings
  const { data: pods, isLoading } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading text-neutral-dark">Pod Standings</h3>
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sortedPods = pods ? [...pods].sort((a, b) => b.points - a.points) : [];
  const maxPoints = sortedPods.length > 0 ? sortedPods[0].points : 0;

  // Handle click to view detailed pod leaderboard
  const handleViewLeaderboard = () => {
    setLocation('/leaderboard');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-heading text-neutral-dark">Pod Standings</h3>
        <span 
          className="bg-secondary bg-opacity-10 text-secondary text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-opacity-20 transition-all"
          onClick={handleViewLeaderboard}
        >
          View All
        </span>
      </div>
      <div className="space-y-3">
        {sortedPods.map((pod) => {
          const percentage = maxPoints > 0 ? Math.floor((pod.points / maxPoints) * 100) : 0;
          
          return (
            <div key={pod.id}>
              <div className="flex justify-between mb-1">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: pod.color }}
                  ></div>
                  <span className="text-sm font-semibold" style={{ color: pod.color }}>
                    {pod.name}
                  </span>
                </div>
                <span className="text-xs font-mono">{pod.points.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: pod.color
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}