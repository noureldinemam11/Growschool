import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, House, BehaviorCategory } from '@shared/schema';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Users, UserCheck, UserPlus, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface GridPointsSelectorProps {
  mode: 'award' | 'deduct';
  onSubmit: (selectedStudents: number[], categoryId: number, points: number, notes: string) => void;
  onCancel: () => void;
}

export default function GridPointsSelector({ mode, onSubmit, onCancel }: GridPointsSelectorProps) {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [pointsValue, setPointsValue] = useState<number>(mode === 'award' ? 1 : -1);
  const [notes, setNotes] = useState<string>('');
  const [filterHouse, setFilterHouse] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectAll, setSelectAll] = useState<boolean>(false);

  const { data: students = [] } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });

  const { data: houses = [] } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });

  const { data: categories = [] } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });

  // Filter categories based on mode (positive/negative)
  const filteredCategories = categories.filter(category => 
    (mode === 'award' && category.pointValue > 0) || 
    (mode === 'deduct' && category.pointValue < 0)
  );

  // Set default category when categories load
  useEffect(() => {
    if (filteredCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(filteredCategories[0].id);
    }
  }, [filteredCategories, selectedCategory]);

  // Update points when category changes
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        setPointsValue(category.pointValue);
      }
    }
  }, [selectedCategory, categories]);

  // Filter students based on house and search query
  const filteredStudents = students.filter(student => {
    // Handle case where houseId might be null
    const matchesHouse = filterHouse ? (student.houseId !== null && student.houseId !== undefined && student.houseId === filterHouse) : true;
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch = searchQuery ? fullName.includes(searchQuery.toLowerCase()) : true;
    return matchesHouse && matchesSearch;
  });

  // Handle select all toggle
  useEffect(() => {
    if (selectAll) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    }
  }, [selectAll, filteredStudents]);

  // Toggle student selection
  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    if (selectedStudents.length === 0 || !selectedCategory) {
      return;
    }
    
    onSubmit(selectedStudents, selectedCategory, pointsValue, notes);
  };

  // Find student details by ID
  const getStudentDetails = (id: number) => {
    return students.find(s => s.id === id);
  };

  // Find house details by ID
  const getHouseDetails = (id: number | null | undefined) => {
    if (id === null || id === undefined) return undefined;
    return houses.find(h => h.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          <div className="flex-1">
            <Label htmlFor="student-search">Search Students</Label>
            <div className="relative">
              <Input
                id="student-search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <Label htmlFor="house-filter">Filter by House</Label>
            <Select 
              value={filterHouse?.toString() || ''} 
              onValueChange={(value) => setFilterHouse(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger id="house-filter" className="w-full">
                <SelectValue placeholder="All Houses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Houses</SelectItem>
                {houses.map((house) => (
                  <SelectItem key={house.id} value={house.id.toString()}>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: house.color }} />
                      {house.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1"
            onClick={() => setSelectAll(!selectAll)}
          >
            {selectAll ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {selectAll ? 'Deselect All' : 'Select All'}
          </Button>
          
          <Badge variant="outline" className="py-1.5">
            {selectedStudents.length} Selected
          </Badge>
        </div>
      </div>
      
      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStudents.map((student) => {
          const isSelected = selectedStudents.includes(student.id);
          // Convert possibly null houseId to undefined before passing
          const house = getHouseDetails(student.houseId === null ? undefined : student.houseId);
          
          return (
            <Card 
              key={student.id} 
              className={`cursor-pointer transition-all duration-200 overflow-hidden ${
                isSelected 
                  ? 'ring-2 ring-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => toggleStudent(student.id)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={() => toggleStudent(student.id)}
                  className="mr-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {student.gradeLevel || 'No Grade'} 
                    {student.section && ` - ${student.section}`}
                  </div>
                </div>
                
                {house && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-200" 
                        style={{ backgroundColor: house.color }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{house.name} House</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {filteredStudents.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground">
            No students found matching your filters.
          </div>
        )}
      </div>
      
      {/* Points and Category Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <Label htmlFor="category">Select Behavior Category</Label>
            <Select 
              value={selectedCategory?.toString() || ''} 
              onValueChange={(value) => setSelectedCategory(parseInt(value))}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name} ({category.pointValue > 0 ? '+' : ''}{category.pointValue})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add details about this behavior..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="points">Points</Label>
            <div className="flex items-center mt-1">
              <Input
                id="points"
                type="number"
                value={Math.abs(pointsValue)}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setPointsValue(mode === 'award' ? value : -value);
                  }
                }}
                className="text-center text-lg font-bold"
                min={1}
              />
              <div className={`ml-3 text-2xl font-bold ${mode === 'award' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {mode === 'award' ? '+' : '-'}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Label>Selected Students</Label>
            <div className="mt-1 p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
              {selectedStudents.length > 0 ? (
                <div className="space-y-1">
                  {selectedStudents.map(id => {
                    const student = getStudentDetails(id);
                    return student ? (
                      <div key={id} className="text-sm">
                        • {student.firstName} {student.lastName}
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  No students selected
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              variant="default" 
              className={`w-full ${mode === 'award' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              disabled={selectedStudents.length === 0 || !selectedCategory}
              onClick={handleSubmit}
            >
              <Star className="h-4 w-4 mr-2" />
              {mode === 'award' ? 'Award Points' : 'Deduct Points'}
            </Button>
            
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}