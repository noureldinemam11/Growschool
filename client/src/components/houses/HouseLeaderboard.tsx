import { FC } from 'react';
import { House } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface HouseLeaderboardProps {
  houses: House[];
}

const HouseLeaderboard: FC<HouseLeaderboardProps> = ({ houses }) => {
  // Sort houses by points in descending order
  const sortedHouses = [...houses].sort((a, b) => b.points - a.points);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-secondary" />
          House Competition Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {sortedHouses.map((house, index) => (
              <div 
                key={house.id} 
                className="relative bg-white rounded-lg shadow-sm border p-4 flex flex-col items-center"
              >
                {index === 0 && (
                  <div className="absolute -top-3 -left-3 bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center">
                    <Trophy className="h-4 w-4" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full mb-2" style={{ backgroundColor: house.color }}></div>
                <h3 className="font-heading font-bold text-lg">{house.name}</h3>
                <div className="text-2xl font-mono font-bold text-primary">{house.points.toLocaleString()}</div>
                <div className="text-xs text-neutral-dark mt-1">
                  {index === 0 ? '1st Place' : 
                   index === 1 ? '2nd Place' : 
                   index === 2 ? '3rd Place' : 
                   `${index + 1}th Place`}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-neutral-dark">
            <p>
              Houses earn points when their members receive positive behavior points. 
              The house with the most points at the end of the semester wins the House Cup!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HouseLeaderboard;
