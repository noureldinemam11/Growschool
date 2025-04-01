import React, { useState } from 'react';
import { User } from '@shared/schema';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { Loader2, Grid, CheckSquare, Shuffle, List, XCircle, MoreHorizontal, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudentGridProps {
  onSelectStudent: (studentId: number) => void;
  selectedDate?: Date;
  teacherFilter?: number;
}

export default function StudentGrid({ onSelectStudent, selectedDate, teacherFilter }: StudentGridProps) {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [teacherFilterType, setTeacherFilterType] = useState<string>('all');
  
  // Fetch students (only role=student)
  const { data: students, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });

  const toggleStudentSelection = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const selectAll = () => {
    if (students) {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const deselectAll = () => {
    setSelectedStudents([]);
  };

  const selectRandom = () => {
    if (students && students.length > 0) {
      const randomIndex = Math.floor(Math.random() * students.length);
      setSelectedStudents([students[randomIndex].id]);
    }
  };

  const handleContinue = () => {
    if (selectedStudents.length === 1) {
      onSelectStudent(selectedStudents[0]);
    }
  };

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
          <span className="text-sm font-medium">Showing points earned</span>
          <Select
            defaultValue="today"
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Today" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm font-medium">given by</span>
          <Select
            value={teacherFilterType}
            onValueChange={setTeacherFilterType}
          >
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="All Teachers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              <SelectItem value="me">Only Me</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm">
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {students?.map((student) => (
          <Card 
            key={student.id}
            className={cn(
              "cursor-pointer transition-all border-2",
              selectedStudents.includes(student.id) 
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

      <div className="mt-6 flex justify-center">
        <div className="rounded-full border border-gray-200 bg-white p-1 flex items-center">
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
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <XCircle className="h-4 w-4" />
            <span>Absent</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span>More</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={handleContinue}
            disabled={selectedStudents.length !== 1}
          >
            <ArrowRight className="h-4 w-4" />
            <span>Continue</span>
          </Button>
        </div>
      </div>
    </div>
  );
}