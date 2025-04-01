import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BehaviorCategory, InsertBehaviorPoint } from '@shared/schema';
import { ChevronLeft, Plus, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface BehaviorCategoryGroupProps {
  title: string;
  children: React.ReactNode;
  onToggle?: () => void;
  isHidden?: boolean;
}

function BehaviorCategoryGroup({ title, children, onToggle, isHidden = false }: BehaviorCategoryGroupProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">{title}</h2>
        {onToggle && (
          <Button 
            variant="link" 
            className="text-blue-500 font-medium" 
            onClick={onToggle}
          >
            {isHidden ? 'show' : 'hide'}
          </Button>
        )}
      </div>
      {!isHidden && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {children}
        </div>
      )}
    </div>
  );
}

interface PointOptionProps {
  icon?: React.ReactNode;
  title: string;
  points: number;
  description?: string;
  onClick: () => void;
}

function PointOption({ icon, title, points, description, onClick }: PointOptionProps) {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-100 p-4 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="text-center mb-2">
        {icon || (
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-1">
            <Plus size={20} />
          </div>
        )}
        <div className="text-sm font-medium">{title}</div>
      </div>
      {description && <div className="text-xs text-gray-500 mb-1">{description}</div>}
      <div className="text-xs text-gray-500">{points} {points === 1 ? 'point' : 'points'}</div>
    </div>
  );
}

interface BehaviorCategoriesViewProps {
  studentId: number;
  studentName: string;
  onBack: () => void;
  onComplete: () => void;
}

export default function BehaviorCategoriesView({ 
  studentId, 
  studentName,
  onBack,
  onComplete
}: BehaviorCategoriesViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryGroups, setSelectedCategoryGroups] = useState<{[key: string]: boolean}>({});
  
  // Fetch behavior categories
  const { data: categories, isLoading } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });

  // Group categories by type - note: the API doesn't provide a type field yet, so we'll use a dummy implementation
  const groupedCategories = categories?.reduce<{[key: string]: BehaviorCategory[]}>((groups, category) => {
    // Since the behavior categories don't have a type field yet, we'll assign them to groups
    // based on their name for demo purposes
    let groupName = 'Other';
    
    if (category.name.toLowerCase().includes('academic')) {
      groupName = 'Academic Excellence';
    } else if (category.name.toLowerCase().includes('behavior')) {
      groupName = 'Behavior';
    } else if (category.name.toLowerCase().includes('transition')) {
      groupName = 'Transitions';
    }
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(category);
    return groups;
  }, {}) || {};
  
  // For demonstration, we'll use some example groups if we don't have proper categories with types
  const demoGroups = {
    'Transitions': [
      { id: 101, name: '1 minute', points: 3, type: 'Transitions' },
      { id: 102, name: '2 minutes', points: 2, type: 'Transitions' },
      { id: 103, name: '3 minutes', points: 1, type: 'Transitions' },
      { id: 104, name: 'Bonus Points', points: 2, type: 'Transitions' },
    ],
    'Seated in the class and ready': [
      { id: 201, name: '1 minute', points: 3, type: 'Seated' },
      { id: 202, name: '2 minutes', points: 2, type: 'Seated' },
      { id: 203, name: '3 minutes', points: 1, type: 'Seated' },
      { id: 204, name: 'Bonus Points', points: 2, type: 'Seated' },
    ],
    'Achieve3000 Reading Competition': [
      { id: 301, name: '75 percent or above', points: 2, type: 'Reading' },
      { id: 302, name: 'Met target', points: 1, type: 'Reading' },
      { id: 303, name: '90 percent', points: 3, type: 'Reading' },
    ],
  };

  // Use the API groups if available, otherwise fall back to demo groups
  const displayGroups = Object.keys(groupedCategories).length > 0 ? groupedCategories : demoGroups;

  const toggleCategoryGroup = (groupName: string) => {
    setSelectedCategoryGroups({
      ...selectedCategoryGroups,
      [groupName]: !selectedCategoryGroups[groupName]
    });
  };

  // Mutation for adding behavior points
  const addPointsMutation = useMutation({
    mutationFn: async (data: InsertBehaviorPoint) => {
      const res = await apiRequest('POST', '/api/behavior-points', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Points Added",
        description: "The behavior points have been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] }); // Invalidate house points data
      onComplete(); // Move back to student selection view
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add behavior points. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePointOptionClick = (category: any) => {
    // For the actual points value, use either the points from demo data or pointValue from real data
    const pointsValue = category.points || category.pointValue || 1;

    // Add points for the selected student and category
    addPointsMutation.mutate({
      studentId,
      categoryId: category.id,
      points: pointsValue,
      // If the user is not authenticated as teacher or admin, this will be handled server-side
      teacherId: user?.id || 1, // Default to first teacher if none specified
      notes: `${category.name} - ${pointsValue} points`,
    });
  };

  return (
    <div className="py-4">
      {/* Back button and student name */}
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          className="text-blue-500"
          onClick={onBack}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> 
          {studentName}
        </Button>
      </div>

      {/* Category groups */}
      {Object.entries(displayGroups).map(([groupName, categories], index) => (
        <BehaviorCategoryGroup 
          key={groupName} 
          title={`${index + 1}. ${groupName}`}
          onToggle={() => toggleCategoryGroup(groupName)}
          isHidden={selectedCategoryGroups[groupName]}
        >
          {categories.map((category: any) => (
            <PointOption 
              key={category.id}
              title={category.name}
              points={category.points}
              onClick={() => handlePointOptionClick(category)}
            />
          ))}
        </BehaviorCategoryGroup>
      ))}

      {/* Bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-center">
        <div className="bg-white rounded-full shadow-md flex divide-x">
          <Button 
            variant="ghost" 
            className="rounded-l-full" 
            onClick={onBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <Button 
            variant="ghost"
          >
            <Calendar className="mr-1 h-4 w-4" />
            Comment
          </Button>
          <Button 
            variant="ghost"
          >
            <Calendar className="mr-1 h-4 w-4" />
            Today
          </Button>
          <Button 
            variant="ghost"
          >
            <Clock className="mr-1 h-4 w-4" />
            12:30 a.m.
          </Button>
          <Button 
            variant="ghost" 
            className="rounded-r-full"
            onClick={onComplete}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}