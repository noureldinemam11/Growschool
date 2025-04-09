import { FC, useState } from 'react';
import { Trophy, ArrowLeftCircle } from 'lucide-react';
import { Pod, Class } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PodLeaderboardProps {
  pods: Pod[];
}

interface ClassWithPoints extends Class {
  points: number;
}

const PodLeaderboard: FC<PodLeaderboardProps> = ({ pods }) => {
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  
  // Fetch classes for detailed view when a pod is selected
  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    enabled: !!selectedPod, // Only fetch when a pod is selected
  });
  
  // Fetch endpoint for class points
  // Note: You would need to implement this API endpoint that returns points per class
  const { data: classPoints } = useQuery<Record<number, number>>({
    queryKey: ['/api/classes/points'],
    enabled: !!selectedPod && !!classes,
  });
  
  // Sort pods by points in descending order
  const sortedPods = [...pods].sort((a, b) => b.points - a.points);
  
  // Filter and sort classes for the selected pod
  const podClasses: ClassWithPoints[] = selectedPod && classes 
    ? classes
      .filter(cls => cls.podId === selectedPod.id)
      .map(cls => {
        // Use real class points if available, otherwise default to 0
        return {
          ...cls,
          points: (classPoints && classPoints[cls.id]) || 0
        };
      })
      .sort((a, b) => b.points - a.points)
    : [];
  
  // Handle going back to the pods view
  const handleBackToPods = () => {
    setSelectedPod(null);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-secondary" />
          {selectedPod ? `${selectedPod.name} Classes Competition` : 'Pod Competition Leaderboard'}
          
          {selectedPod && (
            <Button 
              variant="ghost" 
              size="sm"
              className="ml-auto"
              onClick={handleBackToPods}
            >
              <ArrowLeftCircle className="h-4 w-4 mr-1" />
              Back to Pods
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedPod ? (
          // Main Pod Competition View
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedPods.map((pod, index) => (
              <div 
                key={pod.id}
                onClick={() => setSelectedPod(pod)} 
                className="relative bg-gradient-to-br rounded-lg shadow-sm p-6 flex flex-col items-center cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                style={{ 
                  backgroundImage: `linear-gradient(to bottom right, ${pod.color}50, ${pod.color}30)`,
                  borderLeft: `4px solid ${pod.color}`
                }}
              >
                {index === 0 && (
                  <div className="absolute -top-3 -left-3 bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center">
                    <Trophy className="h-4 w-4" />
                  </div>
                )}
                <div 
                  className="w-12 h-12 mb-2 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: pod.color }}
                >
                  {pod.name.charAt(0)}
                </div>
                <h3 className="font-heading font-bold text-lg text-neutral-dark">{pod.name}</h3>
                <div className="text-3xl font-mono font-bold" style={{ color: pod.color }}>
                  {pod.points.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-dark mt-1">
                  {index === 0 ? '1st Place' : 
                   index === 1 ? '2nd Place' :
                   index === 2 ? '3rd Place' :
                   `${index + 1}th Place`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Classes within selected Pod view
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoadingClasses ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-neutral-dark">Loading classes...</p>
              </div>
            ) : podClasses.length > 0 ? (
              podClasses.map((cls, index) => (
                <div 
                  key={cls.id} 
                  className="relative bg-white rounded-lg shadow-sm border-l-4 p-4 flex flex-col items-center"
                  style={{ borderLeftColor: selectedPod.color }}
                >
                  {index === 0 && (
                    <div className="absolute -top-3 -left-3 bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center">
                      <Trophy className="h-4 w-4" />
                    </div>
                  )}
                  <div 
                    className="w-12 h-12 rounded-full mb-2 flex items-center justify-center"
                    style={{ backgroundColor: selectedPod.color }}
                  >
                    <span className="text-white text-lg font-bold">{cls.name}</span>
                  </div>
                  <h3 className="font-heading font-bold text-lg">{cls.name}</h3>
                  <div className="text-2xl font-mono font-bold" style={{ color: selectedPod.color }}>
                    {cls.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-dark mt-1">
                    {cls.gradeLevel ? `Grade ${cls.gradeLevel}` : ''}
                    {index === 0 ? ' • 1st Place' : 
                     index === 1 ? ' • 2nd Place' :
                     index === 2 ? ' • 3rd Place' :
                     ` • ${index + 1}th Place`}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-neutral-dark">
                No classes found in this pod.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PodLeaderboard;