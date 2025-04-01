import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Reward, RewardRedemption } from '@shared/schema';
import { Loader2, Plus, Edit, Trash2, Package } from 'lucide-react';

export default function RewardManagement() {
  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  // In a real implementation, we'd have an API endpoint for all redemptions
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const isLoadingRedemptions = false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reward Management</CardTitle>
        <CardDescription>
          Manage rewards and track redemptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rewards" className="w-full">
          <TabsList>
            <TabsTrigger value="rewards">Manage Rewards</TabsTrigger>
            <TabsTrigger value="redemptions">Redemption Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rewards" className="space-y-4">
            <Tabs defaultValue="view" className="w-full">
              <TabsList>
                <TabsTrigger value="view">View Rewards</TabsTrigger>
                <TabsTrigger value="create">Create Reward</TabsTrigger>
              </TabsList>
              
              <TabsContent value="view" className="space-y-4 pt-4">
                <div className="flex justify-end">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reward
                  </Button>
                </div>
                
                {isLoadingRewards ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : rewards && rewards.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Point Cost</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rewards.map(reward => (
                          <TableRow key={reward.id}>
                            <TableCell className="font-medium">{reward.name}</TableCell>
                            <TableCell>{reward.description || '-'}</TableCell>
                            <TableCell>
                              <span className="font-mono font-semibold">{reward.pointCost}</span>
                            </TableCell>
                            <TableCell>
                              <span className={reward.quantity <= 0 ? 'text-error' : ''}>{reward.quantity}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border rounded-md">
                    <p className="text-neutral-dark">No rewards found</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="create">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="rewardName" className="text-sm font-medium">Reward Name</label>
                    <Input id="rewardName" placeholder="Enter reward name" />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="rewardDescription" className="text-sm font-medium">Description</label>
                    <Textarea id="rewardDescription" placeholder="Enter a description of this reward" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="pointCost" className="text-sm font-medium">Point Cost</label>
                      <Input 
                        id="pointCost" 
                        type="number" 
                        min="1" 
                        placeholder="Enter point cost" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="quantity" className="text-sm font-medium">Quantity Available</label>
                      <Input 
                        id="quantity" 
                        type="number" 
                        min="0" 
                        placeholder="Enter quantity available" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="imageUrl" className="text-sm font-medium">Image URL (Optional)</label>
                    <Input id="imageUrl" placeholder="Enter image URL" />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button>Create Reward</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="redemptions" className="space-y-4 pt-4">
            {isLoadingRedemptions ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : redemptions && redemptions.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map(redemption => (
                      <TableRow key={redemption.id}>
                        <TableCell className="font-medium">{redemption.studentName}</TableCell>
                        <TableCell>{redemption.rewardName}</TableCell>
                        <TableCell>{new Date(redemption.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell>{redemption.status}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Package className="h-4 w-4 mr-1" />
                            Update Status
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border rounded-md">
                <p className="text-neutral-dark">No pending redemption requests</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
