import { FC, useState, useEffect } from 'react';
import { User, BehaviorPoint } from '@shared/schema';
import { cn } from '@/lib/utils';
import { Search, Filter, ChevronDown, X, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';

interface StudentListProps {
  students: Partial<User>[];
  selectedStudentId: number | null;
  onSelectStudent: (id: number) => void;
}

const StudentList: FC<StudentListProps> = ({ students, selectedStudentId, onSelectStudent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPod, setSelectedPod] = useState<number | 'all'>('all');
  const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'name' | 'points-high' | 'points-low'>('name');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Get pods for filtering
  const { data: pods } = useQuery<any[]>({
    queryKey: ['/api/pods'],
  });
  
  // Get classes for filtering
  const { data: classes } = useQuery<any[]>({
    queryKey: ['/api/classes'],
  });

  // Get a mapping of studentId to points
  const { data: studentPointsData } = useQuery<Record<number, {total: number, positive: number, negative: number}>>({
    queryKey: ['/api/behavior-points/students/summary'],
    // If the endpoint doesn't exist, we create a mock version locally
    enabled: false,
    initialData: {}
  });

  // Build a fallback points mapping if the API doesn't exist
  const [studentPoints, setStudentPoints] = useState<Record<number, {total: number, positive: number, negative: number}>>({});
  
  useEffect(() => {
    // Only use points data from the API, don't generate random points
    if (studentPointsData && Object.keys(studentPointsData).length > 0) {
      setStudentPoints(studentPointsData);
    } else {
      // Set empty points data
      setStudentPoints({});
    }
  }, [students, studentPointsData]);

  // Extract all unique grade levels for filtering
  const gradeLevels = students
    .filter(s => s.gradeLevel)
    .map(s => s.gradeLevel as string)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();

  // Build a filtered and sorted list of students
  const filteredStudents = students.filter(student => {
    // Apply search filter
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
    const nameMatch = fullName.includes(searchQuery.toLowerCase());
    
    // Apply pod filter
    const podMatch = selectedPod === 'all' || student.podId === selectedPod;
    
    // Apply class filter
    const classMatch = selectedClass === 'all' || student.classId === selectedClass;
    
    // Apply grade filter
    const gradeMatch = selectedGrade === 'all' || student.gradeLevel === selectedGrade;
    
    return nameMatch && podMatch && classMatch && gradeMatch;
  }).sort((a, b) => {
    // Apply sorting
    if (sortOrder === 'name') {
      const aName = `${a.firstName || ''} ${a.lastName || ''}`;
      const bName = `${b.firstName || ''} ${b.lastName || ''}`;
      return aName.localeCompare(bName);
    } else if (sortOrder === 'points-high') {
      const aPoints = a.id && studentPoints[a.id]?.total || 0;
      const bPoints = b.id && studentPoints[b.id]?.total || 0;
      return bPoints - aPoints;
    } else { // points-low
      const aPoints = a.id && studentPoints[a.id]?.total || 0;
      const bPoints = b.id && studentPoints[b.id]?.total || 0;
      return aPoints - bPoints;
    }
  });

  // Reset all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPod('all');
    setSelectedClass('all');
    setSelectedGrade('all');
    setSortOrder('name');
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {/* Pod filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                Pod
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Pod</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedPod === 'all'}
                onCheckedChange={() => setSelectedPod('all')}
              >
                All Pods
              </DropdownMenuCheckboxItem>
              {pods?.map(pod => (
                <DropdownMenuCheckboxItem
                  key={pod.id}
                  checked={selectedPod === pod.id}
                  onCheckedChange={() => setSelectedPod(pod.id)}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: pod.color }}
                    ></div>
                    {pod.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Class filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                Class
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Class</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedClass === 'all'}
                onCheckedChange={() => setSelectedClass('all')}
              >
                All Classes
              </DropdownMenuCheckboxItem>
              {classes?.map(cls => (
                <DropdownMenuCheckboxItem
                  key={cls.id}
                  checked={selectedClass === cls.id}
                  onCheckedChange={() => setSelectedClass(cls.id)}
                >
                  <div className="flex items-center">
                    {cls.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Grade filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                Grade
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Grade</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedGrade === 'all'}
                onCheckedChange={() => setSelectedGrade('all')}
              >
                All Grades
              </DropdownMenuCheckboxItem>
              {gradeLevels.map((grade: string) => (
                <DropdownMenuCheckboxItem
                  key={grade}
                  checked={selectedGrade === grade}
                  onCheckedChange={() => setSelectedGrade(grade)}
                >
                  Grade {grade}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Sort order */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                Sort
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortOrder === 'name'}
                onCheckedChange={() => setSortOrder('name')}
              >
                Name (A-Z)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOrder === 'points-high'}
                onCheckedChange={() => setSortOrder('points-high')}
              >
                Points (High to Low)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOrder === 'points-low'}
                onCheckedChange={() => setSortOrder('points-low')}
              >
                Points (Low to High)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View mode toggle */}
          <div className="ml-auto flex rounded-md border shadow-sm overflow-hidden">
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className="rounded-none h-8"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Separator orientation="vertical" />
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              className="rounded-none h-8"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
          </div>
        </div>
        
        {/* Active filters */}
        {(searchQuery || selectedPod !== 'all' || selectedClass !== 'all' || selectedGrade !== 'all') && (
          <div className="flex flex-wrap gap-2 pt-1">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchQuery}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
              </Badge>
            )}
            {selectedPod !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Pod: {pods?.find(p => p.id === selectedPod)?.name || selectedPod}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedPod('all')} />
              </Badge>
            )}
            {selectedClass !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Class: {classes?.find(c => c.id === selectedClass)?.name || selectedClass}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedClass('all')} />
              </Badge>
            )}
            {selectedGrade !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Grade: {selectedGrade}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedGrade('all')} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>
      
      {/* Results summary */}
      <div className="flex justify-between items-center pt-1">
        <div className="text-sm text-muted-foreground">
          {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
        </div>
      </div>
      
      {/* Student list */}
      {viewMode === 'list' ? (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredStudents.map(student => (
            <div 
              key={student.id}
              className={cn(
                "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                student.id === selectedStudentId 
                  ? "bg-primary text-white" 
                  : "hover:bg-neutral"
              )}
              onClick={() => onSelectStudent(student.id!)}
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                student.id === selectedStudentId 
                  ? "bg-white" 
                  : "bg-neutral-light"
              )}>
                <span className={cn(
                  "font-semibold",
                  student.id === selectedStudentId 
                    ? "text-primary" 
                    : "text-neutral-dark"
                )}>
                  {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                </span>
              </div>
              
              <div className="ml-3 flex-1">
                <div className="font-medium">{student.firstName} {student.lastName}</div>
                <div className={cn(
                  "text-xs flex items-center gap-2",
                  student.id === selectedStudentId 
                    ? "text-white text-opacity-90" 
                    : "text-neutral-dark"
                )}>
                  {student.gradeLevel && student.section 
                    ? `Grade ${student.gradeLevel}${student.section}` 
                    : ''}
                  
                  {pods && student.podId && (
                    <span className="flex items-center">
                      •
                      <div 
                        className="w-2 h-2 rounded-full mx-1" 
                        style={{ backgroundColor: pods.find(p => p.id === student.podId)?.color || '#ccc' }}
                      ></div>
                      {pods.find(p => p.id === student.podId)?.name}
                    </span>
                  )}
                  
                  {classes && student.classId && (
                    <span className="flex items-center ml-2">
                      •
                      {classes.find(c => c.id === student.classId)?.name || 'Unknown Class'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Points indicator removed */}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredStudents.map(student => (
            <div 
              key={student.id}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all",
                student.id === selectedStudentId 
                  ? "border-primary shadow-md" 
                  : "border-neutral hover:border-primary/50 hover:shadow-sm"
              )}
              onClick={() => onSelectStudent(student.id!)}
            >
              <div className="flex items-start mb-2">
                <div className="flex items-center">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center mr-2",
                    "bg-neutral-light"
                  )}>
                    <span className="text-sm font-semibold text-neutral-dark">
                      {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm leading-tight">{student.firstName} {student.lastName}</div>
                    <div className="text-xs text-neutral-dark">
                      {student.gradeLevel && student.section 
                        ? `Grade ${student.gradeLevel}${student.section}` 
                        : ''}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* No points data shown */}
              
              {/* Pod indicator */}
              {pods && student.podId && (
                <div className="mt-2 flex items-center text-xs text-neutral-dark">
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: pods.find(p => p.id === student.podId)?.color || '#ccc' }}
                  ></div>
                  {pods.find(p => p.id === student.podId)?.name}
                </div>
              )}
              
              {/* Class indicator */}
              {classes && student.classId && (
                <div className="mt-1 flex items-center text-xs text-neutral-dark">
                  Class: {classes.find(c => c.id === student.classId)?.name || 'Unknown Class'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Empty state */}
      {filteredStudents.length === 0 && (
        <div className="bg-neutral/30 rounded-lg p-6 text-center">
          <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-medium text-sm">No students found</h3>
          <p className="text-xs text-neutral-dark mt-1">
            Try adjusting your search or filters
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentList;
