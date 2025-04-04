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
import BatchPointsAssignment from '@/components/points/BatchPointsAssignment';
import { useLocation } from 'wouter';
import AppHeader from '@/components/ui/AppHeader';

export default function PointsPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterHouse, setFilterHouse] = useState<string>('all');
  const [selectedStudentForPoints, setSelectedStudentForPoints] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [showBatchAssignment, setShowBatchAssignment] = useState<boolean>(false);
  
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

  // Fetch houses
  const { data: houses, isLoading: loadingHouses } = useQuery<any[]>({
    queryKey: ['/api/houses'],
  });

  const filteredStudents = students?.filter(student => {
    // Apply house filter
    if (filterHouse !== 'all' && student.houseId !== Number(filterHouse)) {
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
      if (selectedStudents.length === 1) {
        // Single student - use the regular categories flow
        const studentId = selectedStudents[0];
        const student = students?.find(s => s.id === studentId) || null;
        setSelectedStudent(student);
        setLocation('/points/categories');
      } else {
        // Multiple students - show batch assignment UI
        setShowBatchAssignment(true);
      }
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

  // Close batch assignment view and go back to student selection
  const handleCloseBatchAssignment = () => {
    setShowBatchAssignment(false);
  };

  // Handle complete batch assignment and reset selection
  const handleCompleteBatchAssignment = () => {
    setShowBatchAssignment(false);
    setSelectedStudents([]);
  };

  // Show batch points assignment view
  if (showBatchAssignment) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader 
          showBackButton={true}
          showHomeButton={true}
          customBackAction={handleCloseBatchAssignment}
          title={`Award Points to Multiple Students`}
        />
        
        <main className="flex-1 bg-slate-50 p-4 overflow-auto">
          <div className="container mx-auto py-4">
            <BatchPointsAssignment 
              studentIds={selectedStudents}
              onBack={handleCloseBatchAssignment}
              onComplete={handleCompleteBatchAssignment}
            />
          </div>
        </main>
      </div>
    );
  }

  // Show single student categories view
  if (location.includes('/categories') && selectedStudent) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader 
          showBackButton={true}
          showHomeButton={true}
          customBackAction={handleBackToStudents}
          title={`Points for ${selectedStudent.firstName}`}
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
            <Select value={filterHouse} onValueChange={setFilterHouse}>
              <SelectTrigger className="w-[140px]">
                <Home className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Houses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Houses</SelectItem>
                {houses?.map(house => (
                  <SelectItem key={house.id} value={house.id.toString()}>
                    {house.name}
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
          <div className="bg-white rounded-full shadow-md flex items-center divide-x">
            <Button 
              variant="ghost" 
              className="rounded-l-full" 
              onClick={selectedStudents.length > 0 ? handleDeselectAll : handleSelectAll}
            >
              {selectedStudents.length > 0 ? "Deselect All" : "Select All"}
            </Button>
            
            {selectedStudents.length > 0 && (
              <span className="px-3 text-sm font-medium text-primary">
                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                {selectedStudents.length > 1 && " (batch mode)"}
              </span>
            )}
            
            <Button 
              variant={selectedStudents.length > 0 ? "default" : "ghost"}
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