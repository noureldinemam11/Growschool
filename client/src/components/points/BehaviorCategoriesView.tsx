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
  // Determine if this group is for positive or negative behaviors
  const isPositiveGroup = title.toLowerCase().includes('positive');
  
  // Set styles based on positive or negative group
  const headerColor = isPositiveGroup ? 'text-green-700' : 'text-red-700';
  const bgColor = isPositiveGroup ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isPositiveGroup ? 'border-green-200' : 'border-red-200';
  
  return (
    <div className={`mb-8 ${bgColor} p-4 rounded-lg border ${borderColor}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-base font-medium ${headerColor}`}>{title}</h2>
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
  isPositive: boolean;
}

function PointOption({ icon, title, points = 0, description, onClick, isSelected, categoryId, isPositive }: PointOptionProps) {
  // Use green for positive categories and red for negative categories
  const colorClasses = isPositive
    ? {
        ring: "focus:ring-green-300",
        selected: "bg-green-500 text-white",
        unselected: "bg-white border-2 border-green-500 text-green-500 hover:bg-green-50"
      }
    : {
        ring: "focus:ring-red-300",
        selected: "bg-red-500 text-white",
        unselected: "bg-white border-2 border-red-500 text-red-500 hover:bg-red-50"
      };

  return (
    <div className="flex flex-col items-center">
      <button 
        className={`w-16 h-16 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 ${colorClasses.ring} ${
          isSelected 
            ? colorClasses.selected 
            : colorClasses.unselected
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
        <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? `+${Math.abs(points)}` : `-${Math.abs(points)}`} {Math.abs(points) === 1 ? 'point' : 'points'}
        </div>
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

  // Group categories by positive or negative behavior
  const groupedCategories = categories?.reduce<{[key: string]: BehaviorCategory[]}>((groups, category) => {
    // Group categories by positive and negative
    const groupName = category.isPositive ? 'Positive Behaviors' : 'Negative Behaviors';
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    
    // Ensure 'isPositive' property is included
    const categoryWithIsPositive = {
      ...category,
      isPositive: !!category.isPositive, // Ensure boolean type
    };
    
    groups[groupName].push(categoryWithIsPositive);
    return groups;
  }, {}) || {};
  
  // Sort the categories so Positive Behaviors appears first
  const sortedGroupedCategories: {[key: string]: BehaviorCategory[]} = {};
  if (groupedCategories['Positive Behaviors']) {
    sortedGroupedCategories['Positive Behaviors'] = groupedCategories['Positive Behaviors'];
  }
  if (groupedCategories['Negative Behaviors']) {
    sortedGroupedCategories['Negative Behaviors'] = groupedCategories['Negative Behaviors'];
  }
  
  // For demonstration purposes only, use example groups if categories are not available
  const demoGroups = {
    'Positive Behaviors': [
      { id: 101, name: 'Academic Excellence', pointValue: 3, isPositive: true },
      { id: 102, name: 'Helping Others', pointValue: 2, isPositive: true },
      { id: 103, name: 'Great Effort', pointValue: 1, isPositive: true },
    ],
    'Negative Behaviors': [
      { id: 201, name: 'Disruptive Behavior', pointValue: -2, isPositive: false },
      { id: 202, name: 'Late to Class', pointValue: -1, isPositive: false },
      { id: 203, name: 'Missing Assignment', pointValue: -1, isPositive: false },
    ]
  };

  // Use the API groups if available, otherwise fall back to demo groups
  const displayGroups = Object.keys(groupedCategories).length > 0 ? sortedGroupedCategories : demoGroups;

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
        
        {totalPoints !== 0 && (
          <div className={`font-medium ${totalPoints > 0 ? 'text-green-600' : 'text-red-600'}`}>
            Selected: {totalPoints > 0 ? '+' : ''}{totalPoints} points{isBatchMode ? ` × ${batchStudentCount} students` : ''}
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
              points={category.pointValue || category.points}
              isSelected={!!selectedCategories[category.id]}
              onClick={() => toggleCategorySelection(category)}
              isPositive={category.isPositive}
            />
          ))}
        </BehaviorCategoryGroup>
      ))}

      {/* Fixed bottom toolbar - enhanced visibility for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center z-50">
        <Button 
          variant={totalPoints < 0 ? "destructive" : "default"}
          size="lg"
          className={`w-full h-14 text-lg font-bold flex items-center justify-center shadow-lg ${
            totalPoints === 0 ? '' : (totalPoints > 0 ? 'bg-green-600 hover:bg-green-700' : '')
          }`}
          onClick={handleSubmitAll}
          disabled={totalPoints === 0}
        >
          <Check className="mr-2 h-6 w-6" />
          <span>
            {totalPoints !== 0 
              ? `Submit Points (${totalPoints > 0 ? '+' : ''}${totalPoints} total)` 
              : "Submit Points"}
          </span>
        </Button>
      </div>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the fixed button */}
      <div className="h-24"></div>
    </div>
  );
}