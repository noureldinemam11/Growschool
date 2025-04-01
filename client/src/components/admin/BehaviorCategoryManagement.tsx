import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BehaviorCategory } from '@shared/schema';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';

export default function BehaviorCategoryManagement() {
  const { data: categories, isLoading } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavior Categories</CardTitle>
        <CardDescription>
          Manage behavior categories and point values
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="view" className="w-full">
          <TabsList>
            <TabsTrigger value="view">View Categories</TabsTrigger>
            <TabsTrigger value="create">Create Category</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="space-y-4">
            <div className="flex justify-end">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Point Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(category => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>
                          <Badge className={category.isPositive ? 'bg-success' : 'bg-error'}>
                            {category.isPositive ? 'Positive' : 'Negative'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-mono font-semibold ${category.isPositive ? 'text-success' : 'text-error'}`}>
                            {category.isPositive ? '+' : '-'}{category.pointValue}
                          </span>
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
                <p className="text-neutral-dark">No behavior categories found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Category Name</label>
                <Input id="name" placeholder="Enter category name" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea id="description" placeholder="Enter a description of this behavior category" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category Type</label>
                  <div className="flex items-center space-x-2">
                    <Switch id="isPositive" defaultChecked />
                    <label htmlFor="isPositive" className="text-sm text-neutral-dark">
                      <span className="font-medium text-success">Positive</span> / <span className="text-error">Negative</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="pointValue" className="text-sm font-medium">Point Value</label>
                  <Input 
                    id="pointValue" 
                    type="number" 
                    min="1" 
                    max="10" 
                    placeholder="Enter point value" 
                  />
                  <p className="text-xs text-neutral-dark">
                    Value from 1-10. Points will be awarded or deducted based on category type.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline">Cancel</Button>
                <Button>Create Category</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
