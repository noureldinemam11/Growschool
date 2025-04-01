import { useQuery } from '@tanstack/react-query';
import { House } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

export default function HouseStandingsCard() {
  const { data: houses, isLoading } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading text-neutral-dark">House Standings</h3>
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

  const sortedHouses = houses ? [...houses].sort((a, b) => b.points - a.points) : [];
  const maxPoints = sortedHouses.length > 0 ? sortedHouses[0].points : 0;

  // Color coding for houses (adjust these as needed)
  const houseColors = {
    Phoenix: { bg: 'bg-blue-700', bgLight: 'bg-blue-100', text: 'text-blue-700' },
    Griffin: { bg: 'bg-green-700', bgLight: 'bg-green-100', text: 'text-green-700' },
    Dragon: { bg: 'bg-yellow-700', bgLight: 'bg-yellow-100', text: 'text-yellow-700' },
    Pegasus: { bg: 'bg-red-700', bgLight: 'bg-red-100', text: 'text-red-700' }
  };

  // Default colors if house name doesn't match predefined colors
  const defaultColor = { bg: 'bg-gray-700', bgLight: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-heading text-neutral-dark">House Standings</h3>
        <span className="bg-secondary bg-opacity-10 text-secondary text-xs px-2 py-1 rounded-full">Updated</span>
      </div>
      <div className="space-y-3">
        {sortedHouses.map((house) => {
          const colorScheme = houseColors[house.name as keyof typeof houseColors] || defaultColor;
          const percentage = maxPoints > 0 ? Math.floor((house.points / maxPoints) * 100) : 0;
          
          return (
            <div key={house.id}>
              <div className="flex justify-between mb-1">
                <span className={`text-sm font-semibold ${colorScheme.text}`}>{house.name}</span>
                <span className="text-xs font-mono">{house.points.toLocaleString()}</span>
              </div>
              <div className={`w-full ${colorScheme.bgLight} rounded-full h-2.5`}>
                <div className={`${colorScheme.bg} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
