import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { User, BehaviorPoint } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { ChevronDown, Grid, Home, ChevronLeft } from 'lucide-react';
import PointsModal from '@/components/points/PointsModal';
import BehaviorCategoriesView from '@/components/points/BehaviorCategoriesView';
import { useLocation } from 'wouter';
import AppHeader from '@/components/ui/AppHeader';

export default function PointsPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPod, setFilterPod] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [selectedStudentForPoints, setSelectedStudentForPoints] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  
  // Determine view from URL
  const view = location.includes('/categories') ? 'categories' : 'students';

  // Fetch students
  const { data: students, isLoading: loadingStudents } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });

  // Fetch teachers 
  const { data: teachers, isLoading: loadingTeachers } = useQuery<User[]>({
    queryKey: ['/api/users/role/teacher'],
  });

  // Fetch pods
  const { data: pods, isLoading: loadingPods } = useQuery<any[]>({
    queryKey: ['/api/pods'],
  });
  
  // Fetch classes
  const { data: classes, isLoading: loadingClasses } = useQuery<any[]>({
    queryKey: ['/api/classes'],
  });

  const filteredStudents = students?.filter(student => {
    // Apply pod filter
    if (filterPod !== 'all' && student.podId !== Number(filterPod)) {
      return false;
    }
    
    // Apply class filter
    if (filterClass !== 'all' && student.classId !== Number(filterClass)) {
      return false;
    }
    
    return true;
  });

  const handleSelectStudent = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSelectAll = () => {
    if (filteredStudents) {
      if (selectedStudents.length === filteredStudents.length) {
        setSelectedStudents([]);
      } else {
        setSelectedStudents(filteredStudents.map(student => student.id));
      }
    }
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleRandomSelect = () => {
    if (filteredStudents && filteredStudents.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredStudents.length);
      setSelectedStudents([filteredStudents[randomIndex].id]);
    }
  };

  const handleContinue = () => {
    if (selectedStudents.length > 0) {
      // Store all selected student IDs in localStorage
      localStorage.setItem('batchSelectedStudentIds', JSON.stringify(selectedStudents));
      
      // For backward compatibility, still set the first student as the "selected" one
      const studentId = selectedStudents[0];
      const student = students?.find(s => s.id === studentId) || null;
      setSelectedStudent(student);
      
      // Navigate to categories page
      setLocation('/points/categories');
    }
  };

  const handleBackToStudents = () => {
    setLocation('/points');
    setSelectedStudent(null);
  };

  const handleCompleteBehaviorAssignment = () => {
    setLocation('/points');
    setSelectedStudent(null);
    setSelectedStudents([]);
    // Show success message or something else as needed
  };
  
  const handleNavigateHome = () => {
    setLocation('/');
  };
  
  // Load selected student from localStorage when on categories page
  useEffect(() => {
    // If we're on the categories page but don't have a selected student,
    // try to load it from localStorage
    if (location.includes('/categories') && !selectedStudent && students?.length) {
      const savedStudentId = localStorage.getItem('selectedStudentId');
      if (savedStudentId) {
        const student = students.find(s => s.id === parseInt(savedStudentId));
        if (student) {
          setSelectedStudent(student);
        } else {
          // If student not found, go back to student selection
          setLocation('/points');
        }
      } else {
        // If no saved student ID, go back to student selection
        setLocation('/points');
      }
    }
  }, [location, selectedStudent, students]);
  
  // Save selected student to localStorage when changing
  useEffect(() => {
    if (selectedStudent) {
      localStorage.setItem('selectedStudentId', selectedStudent.id.toString());
    }
  }, [selectedStudent]);
  
  // Reset class filter when pod filter changes
  useEffect(() => {
    setFilterClass('all');
  }, [filterPod]);
  
  // Filter classes based on selected pod
  const filteredClasses = filterPod === 'all' 
    ? classes 
    : classes?.filter(cls => cls.podId === Number(filterPod));

  if (location.includes('/categories') && selectedStudent) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader 
          showBackButton={true}
          showHomeButton={true}
          customBackAction={handleBackToStudents}
          title={(() => {
            const batchStudentIds = JSON.parse(localStorage.getItem('batchSelectedStudentIds') || '[]');
            if (batchStudentIds.length > 1) {
              return `Points for ${selectedStudent.firstName} + ${batchStudentIds.length - 1} more`;
            }
            return `Points for ${selectedStudent.firstName}`;
          })()}
        />
        
        {/* Behavior Categories View */}
        <div className="container mx-auto flex-1 overflow-auto">
          <BehaviorCategoriesView 
            studentId={selectedStudent.id}
            studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
            onBack={handleBackToStudents}
            onComplete={handleCompleteBehaviorAssignment}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader 
        showBackButton={false}
        showHomeButton={true}
        title="Award Points"
      />
      
      {/* Filter Bar */}
      <div className="bg-white border-b py-2 px-4 sticky top-0 z-10">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Select value={filterPod} onValueChange={setFilterPod}>
              <SelectTrigger className="w-[140px]">
                <Home className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Pods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pods</SelectItem>
                {pods?.map(pod => (
                  <SelectItem key={pod.id} value={pod.id.toString()}>
                    {pod.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[140px]">
                <Grid className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {filteredClasses?.map(cls => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Settings button removed as requested */}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 p-4 overflow-auto">
        <div className="container mx-auto">
          <div className="mb-2">
            <h2 className="text-sm text-slate-500">
              Select students to award points
            </h2>
          </div>

          {/* Student Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredStudents?.map(student => (
              <Card 
                key={student.id} 
                className={`cursor-pointer border-t-4 ${
                  selectedStudents.includes(student.id) 
                    ? 'border-t-primary shadow-md' 
                    : 'border-t-amber-500'
                }`}
                onClick={() => handleSelectStudent(student.id)}
              >
                <CardContent className="p-3">
                  <div className="font-semibold">{student.firstName}</div>
                  <div className="text-sm text-slate-500">{student.lastName}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Toolbar */}
      <footer className="bg-white border-t py-3 px-4 sticky bottom-0">
        <div className="container mx-auto flex justify-center">
          <div className="bg-white rounded-full shadow-md flex divide-x">
            <Button 
              variant="ghost" 
              className="rounded-l-full" 
              onClick={selectedStudents.length > 0 ? handleDeselectAll : handleSelectAll}
            >
              {selectedStudents.length > 0 ? "Deselect All" : "Select All"}
            </Button>
            <Button 
              variant="ghost" 
              className="rounded-r-full"
              onClick={handleContinue}
              disabled={selectedStudents.length === 0}
            >
              Continue
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}