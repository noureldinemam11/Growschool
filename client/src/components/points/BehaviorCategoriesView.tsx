import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BehaviorCategory, InsertBehaviorPoint } from '@shared/schema';
import { ChevronLeft, Plus, Check, Calendar, Clock } from 'lucide-react';
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
    <div className="mb-8 bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-medium text-gray-700">{title}</h2>
        {onToggle && (
          <Button 
            variant="link" 
            className="text-blue-500 font-medium text-sm" 
            onClick={onToggle}
          >
            {isHidden ? 'show' : 'hide'}
          </Button>
        )}
      </div>
      {!isHidden && (
        <div className="flex flex-wrap justify-center gap-8">
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
  isSelected: boolean;
  categoryId: number;
}

function PointOption({ icon, title, points, description, onClick, isSelected, categoryId }: PointOptionProps) {
  return (
    <div className="flex flex-col items-center">
      <button 
        className={`w-16 h-16 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-300 ${
          isSelected 
            ? "bg-green-500 text-white" 
            : "bg-white border-2 border-green-500 text-green-500 hover:bg-green-50"
        }`}
        onClick={onClick}
      >
        {isSelected ? (
          <Check size={24} />
        ) : (
          <Plus size={24} />
        )}
      </button>
      <div className="text-center mt-2">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-gray-500">{points} {points === 1 ? 'point' : 'points'}</div>
      </div>
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
  const [selectedCategories, setSelectedCategories] = useState<{[key: number]: any}>({});
  
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

  // Calculate total points from selected categories
  const totalPoints = Object.values(selectedCategories).reduce((sum, category) => {
    const pointsValue = category.points || category.pointValue || 0;
    return sum + pointsValue;
  }, 0);

  // Toggle a category in the selection
  const toggleCategorySelection = (category: any) => {
    const categoryId = category.id;
    
    if (selectedCategories[categoryId]) {
      // If already selected, remove it
      const newSelectedCategories = { ...selectedCategories };
      delete newSelectedCategories[categoryId];
      setSelectedCategories(newSelectedCategories);
    } else {
      // If not selected, add it
      setSelectedCategories({
        ...selectedCategories,
        [categoryId]: category
      });
    }
  };

  // Mutations for adding behavior points (one by one)
  const addPointsMutation = useMutation({
    mutationFn: async (data: InsertBehaviorPoint) => {
      const res = await apiRequest('POST', '/api/behavior-points', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] }); // Invalidate house points data
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add behavior points. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Get all selected student IDs from localStorage
  const getBatchSelectedStudentIds = (): number[] => {
    const storedIds = localStorage.getItem('batchSelectedStudentIds');
    if (storedIds) {
      try {
        return JSON.parse(storedIds);
      } catch (e) {
        console.error('Error parsing batch student IDs', e);
        return [studentId]; // Fallback to just the current student
      }
    }
    return [studentId]; // Fallback to just the current student
  };

  // Define types for the batch points request
  type PointEntry = {
    studentId: number;
    categoryId: number;
    points: number;
    teacherId: number;
    notes: string;
  };

  type BatchPointsRequest = {
    points: PointEntry[];
  };

  // Mutation for batch points assignment
  const batchPointsMutation = useMutation({
    mutationFn: async (data: BatchPointsRequest) => {
      const res = await apiRequest('POST', '/api/behavior-points/batch', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add behavior points in batch. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle submitting all selected categories
  const handleSubmitAll = () => {
    if (Object.keys(selectedCategories).length === 0) {
      toast({
        title: "No Categories Selected",
        description: "Please select at least one category to award points.",
        variant: "destructive",
      });
      return;
    }

    // Get all selected student IDs
    const selectedStudentIds = getBatchSelectedStudentIds();
    const studentCount = selectedStudentIds.length;
    
    if (studentCount > 1) {
      // Use batch endpoint for multiple students
      // Need to create individual entries for each student-category combination
      const pointsEntries: PointEntry[] = [];
      
      Object.values(selectedCategories).forEach(category => {
        const pointsValue = category.points || category.pointValue || 1;
        
        // Create an entry for each student
        selectedStudentIds.forEach(studentId => {
          pointsEntries.push({
            studentId,
            categoryId: category.id,
            points: pointsValue,
            teacherId: user?.id || 1,
            notes: `${category.name} - ${pointsValue} points`,
          });
        });
      });

      // The batch endpoint expects { points: [...pointsArray] }
      batchPointsMutation.mutateAsync({ points: pointsEntries })
        .then(() => {
          toast({
            title: "Points Added",
            description: `Successfully added points to ${studentCount} students across ${Object.keys(selectedCategories).length} categories.`,
          });
          localStorage.removeItem('batchSelectedStudentIds'); // Clear the stored IDs
          onComplete(); // Move back to student selection view
        })
        .catch((error: Error) => {
          toast({
            title: "Error",
            description: "Some points could not be added. Please try again.",
            variant: "destructive",
          });
        });
    } else {
      // Use single student endpoint for backward compatibility
      const promises = Object.values(selectedCategories).map(category => {
        const pointsValue = category.points || category.pointValue || 1;
        
        return addPointsMutation.mutateAsync({
          studentId,
          categoryId: category.id,
          points: pointsValue,
          teacherId: user?.id || 1,
          notes: `${category.name} - ${pointsValue} points`,
        });
      });

      // Wait for all mutations to complete
      Promise.all(promises)
        .then(() => {
          toast({
            title: "Points Added",
            description: `Successfully added ${totalPoints} points across ${Object.keys(selectedCategories).length} categories.`,
          });
          localStorage.removeItem('batchSelectedStudentIds'); // Clear the stored IDs
          onComplete(); // Move back to student selection view
        })
        .catch((error: Error) => {
          toast({
            title: "Error",
            description: "Some points could not be added. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  // Get batch student count for display
  const batchStudentCount = getBatchSelectedStudentIds().length;
  const isBatchMode = batchStudentCount > 1;

  return (
    <div className="py-4">
      {/* Student name header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-darker">
          {isBatchMode 
            ? `${studentName} + ${batchStudentCount - 1} more students` 
            : studentName}
        </h2>
        
        {totalPoints > 0 && (
          <div className="text-green-600 font-medium">
            Selected: {totalPoints} points{isBatchMode ? ` × ${batchStudentCount} students` : ''}
          </div>
        )}
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
              categoryId={category.id}
              title={category.name}
              points={category.points}
              isSelected={!!selectedCategories[category.id]}
              onClick={() => toggleCategorySelection(category)}
            />
          ))}
        </BehaviorCategoryGroup>
      ))}

      {/* Fixed bottom toolbar - enhanced visibility for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center z-50">
        <Button 
          variant="default"
          size="lg"
          className="w-full h-14 text-lg font-bold flex items-center justify-center shadow-lg"
          onClick={handleSubmitAll}
          disabled={totalPoints === 0}
        >
          <Check className="mr-2 h-6 w-6" />
          <span>
            {totalPoints > 0 
              ? `Submit Points (${totalPoints} total)` 
              : "Submit Points"}
          </span>
        </Button>
      </div>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the fixed button */}
      <div className="h-24"></div>
    </div>
  );
}