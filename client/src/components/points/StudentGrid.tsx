import React, { useState } from 'react';
import { User } from '@shared/schema';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { Loader2, Grid, Shuffle, List, XCircle, MoreHorizontal, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BatchPointsAssignment from './BatchPointsAssignment';

interface StudentGridProps {
  onSelectStudent: (studentId: number) => void;
  selectedDate?: Date;
  teacherFilter?: number;
}

export default function StudentGrid({ onSelectStudent, selectedDate, teacherFilter }: StudentGridProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [teacherFilterType, setTeacherFilterType] = useState<string>('all');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  
  // Fetch students (only role=student)
  const { data: students, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });

  const toggleStudentSelection = (studentId: number) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const selectAll = () => {
    if (students) {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const deselectAll = () => {
    setSelectedStudentIds([]);
  };

  const selectRandom = () => {
    if (students && students.length > 0) {
      const randomIndex = Math.floor(Math.random() * students.length);
      setSelectedStudentIds([students[randomIndex].id]);
    }
  };

  const handleContinue = () => {
    if (selectedStudentIds.length === 1) {
      onSelectStudent(selectedStudentIds[0]);
    } else if (selectedStudentIds.length > 1) {
      // Open batch assignment modal
      setIsBatchModalOpen(true);
    }
  };

  // Show loading indicator while students are loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Showing students by</span>
          <Select
            defaultValue="all"
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="class">Class</SelectItem>
              <SelectItem value="grade">Grade</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm">
          Filter Options
        </Button>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {students?.map((student) => (
          <Card 
            key={student.id}
            className={cn(
              "cursor-pointer transition-all border-2",
              selectedStudentIds.includes(student.id) 
                ? "border-primary bg-primary/5" 
                : "hover:border-gray-400"
            )}
            onClick={() => toggleStudentSelection(student.id)}
          >
            <CardContent className="p-4">
              <div className="uppercase font-semibold text-primary">{student.firstName}</div>
              <div className="text-sm text-gray-500">{student.lastName}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selection Tools */}
      <div className="mt-6 flex justify-center">
        <div className="rounded-full border border-gray-200 bg-white p-1 flex items-center gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={selectAll}
          >
            <Grid className="h-4 w-4" />
            <span>Select All</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={deselectAll}
          >
            <XCircle className="h-4 w-4" />
            <span>Deselect</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={selectRandom}
          >
            <Shuffle className="h-4 w-4" />
            <span>Random</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <List className="h-4 w-4" />
            <span>Timeline</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="rounded-full flex items-center gap-1 ml-2 bg-primary hover:bg-primary/90"
            onClick={handleContinue}
            disabled={selectedStudentIds.length === 0}
          >
            <ArrowRight className="h-4 w-4" />
            <span>Continue</span>
          </Button>
        </div>
      </div>
      
      {/* Batch Points Assignment Modal */}
      {isBatchModalOpen && (
        <BatchPointsAssignment 
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          selectedStudentIds={selectedStudentIds}
        />
      )}
    </div>
  );
}