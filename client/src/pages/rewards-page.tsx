import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import RewardCard from '@/components/rewards/RewardCard';
import { Dialog } from '@/components/ui/dialog';
import RedeemRewardModal from '@/components/modals/RedeemRewardModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reward, BehaviorPoint, RewardRedemption } from '@shared/schema';
import { Loader2 } from 'lucide-react';

export default function RewardsPage() {
  const { user } = useAuth();
  const [redeemReward, setRedeemReward] = useState<Reward | null>(null);

  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  const { data: studentPoints, isLoading: isLoadingPoints } = useQuery<BehaviorPoint[]>({
    queryKey: ['/api/behavior-points/student/' + user?.id],
    enabled: !!user && user.role === 'student'
  });

  const { data: redemptions, isLoading: isLoadingRedemptions } = useQuery<any[]>({
    queryKey: ['/api/rewards/redemptions/student/' + user?.id],
    enabled: !!user && user.role === 'student'
  });

  // Calculate total points for the student
  const totalPoints = studentPoints?.reduce((sum, p) => sum + p.points, 0) || 0;

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-y-auto bg-neutral">
          <div className="p-4 md:p-8">
            <header className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-heading font-bold text-neutral-darker">Rewards Store</h1>
                  <p className="text-neutral-dark">Redeem your points for exciting rewards</p>
                </div>
                
                {user?.role === 'student' && (
                  <div className="mt-4 md:mt-0 bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-neutral-dark">Your Available Points</div>
                    <div className="text-2xl font-mono font-bold text-primary">
                      {isLoadingPoints ? (
                        <Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />
                      ) : (
                        totalPoints
                      )}
                    </div>
                  </div>
                )}
              </div>
            </header>

            {user?.role === 'student' ? (
              <Tabs defaultValue="available" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="available">Available Rewards</TabsTrigger>
                  <TabsTrigger value="redeemed">My Redemptions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="available" className="space-y-4">
                  {isLoadingRewards ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : rewards && rewards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rewards.map(reward => (
                        <RewardCard 
                          key={reward.id} 
                          reward={reward}
                          canAfford={totalPoints >= reward.pointCost}
                          onRedeem={() => setRedeemReward(reward)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                      <p className="text-neutral-dark">No rewards available at this time.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="redeemed" className="space-y-4">
                  {isLoadingRedemptions ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : redemptions && redemptions.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-neutral">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Reward</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Redeemed On</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Points Spent</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {redemptions.map(redemption => (
                            <tr key={redemption.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-neutral-darker">
                                  {redemption.reward?.name || 'Unnamed Reward'}
                                </div>
                                <div className="text-xs text-neutral-dark">
                                  {redemption.reward?.description || 'No description'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">
                                {new Date(redemption.timestamp).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-primary">
                                {redemption.pointsSpent}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={
                                  redemption.status === 'approved' ? 'bg-success' :
                                  redemption.status === 'delivered' ? 'bg-accent' :
                                  'bg-secondary'
                                }>
                                  {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                      <p className="text-neutral-dark">You haven't redeemed any rewards yet.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              // View for teachers, admins, parents
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRewards ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : rewards && rewards.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {rewards.map(reward => (
                          <div key={reward.id} className="border rounded-md p-4">
                            <h3 className="font-semibold text-neutral-darker">{reward.name}</h3>
                            <p className="text-sm text-neutral-dark mb-2">{reward.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-mono bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-full">
                                {reward.pointCost} points
                              </span>
                              <span className="text-xs text-neutral-dark">
                                {reward.quantity} remaining
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-dark">No rewards available at this time.</p>
                    )}
                  </CardContent>
                </Card>
                
                {user?.role === 'admin' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Reward Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-dark">Use the Admin panel to manage rewards.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <MobileNavbar />
      
      {/* Redemption Modal */}
      <Dialog open={redeemReward !== null} onOpenChange={(open) => !open && setRedeemReward(null)}>
        {redeemReward && (
          <RedeemRewardModal 
            reward={redeemReward} 
            availablePoints={totalPoints}
            onClose={() => setRedeemReward(null)} 
          />
        )}
      </Dialog>
    </div>
  );
}
