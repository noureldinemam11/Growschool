import { FC, useState, useEffect } from 'react';
import { User, BehaviorPoint } from '@shared/schema';
import { cn } from '@/lib/utils';
import { Search, Filter, ChevronDown, X, UserPlus, CheckCircle } from 'lucide-react';
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
import { useLocation } from 'wouter';

interface StudentListProps {
  students: Partial<User>[];
  selectedStudentId: number | null;
  onSelectStudent: (id: number) => void;
}

const StudentList: FC<StudentListProps> = ({ students, selectedStudentId, onSelectStudent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<number | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'name' | 'points-high' | 'points-low'>('name');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [location, setLocation] = useState<any>();
  
  // Get houses for filtering
  const { data: houses } = useQuery<any[]>({
    queryKey: ['/api/houses'],
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
    
    // Apply house filter
    const houseMatch = selectedHouse === 'all' || student.houseId === selectedHouse;
    
    // Apply grade filter
    const gradeMatch = selectedGrade === 'all' || student.gradeLevel === selectedGrade;
    
    return nameMatch && houseMatch && gradeMatch;
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

  // No longer needed since we removed the assign points button

  // Reset all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedHouse('all');
    setSelectedGrade('all');
    setSortOrder('name');
  };

  // Toggle selection of a student for batch operations
  const toggleStudentSelection = (id: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedStudents(prev => 
      prev.includes(id) 
        ? prev.filter(studentId => studentId !== id)
        : [...prev, id]
    );
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
          {/* House filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                House
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by House</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedHouse === 'all'}
                onCheckedChange={() => setSelectedHouse('all')}
              >
                All Houses
              </DropdownMenuCheckboxItem>
              {houses?.map(house => (
                <DropdownMenuCheckboxItem
                  key={house.id}
                  checked={selectedHouse === house.id}
                  onCheckedChange={() => setSelectedHouse(house.id)}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: house.color }}
                    ></div>
                    {house.name}
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
        {(searchQuery || selectedHouse !== 'all' || selectedGrade !== 'all') && (
          <div className="flex flex-wrap gap-2 pt-1">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchQuery}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
              </Badge>
            )}
            {selectedHouse !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                House: {houses?.find(h => h.id === selectedHouse)?.name || selectedHouse}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedHouse('all')} />
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
      
      {/* Results summary and selection info */}
      <div className="flex justify-between items-center pt-1">
        <div className="text-sm text-muted-foreground">
          {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
        </div>
        
        <div className="flex gap-2">
          {selectedStudents.length > 0 && (
            <Button size="sm" variant="outline" className="h-8" onClick={() => setSelectedStudents([])}>
              Clear {selectedStudents.length} selected
            </Button>
          )}
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
              {/* Checkbox for batch selection */}
              <div className="mr-2" onClick={(e) => toggleStudentSelection(student.id!, e)}>
                {selectedStudents.includes(student.id!) ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-gray-300"></div>
                )}
              </div>
              
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
                  
                  {houses && student.houseId && (
                    <span className="flex items-center">
                      •
                      <div 
                        className="w-2 h-2 rounded-full mx-1" 
                        style={{ backgroundColor: houses.find(h => h.id === student.houseId)?.color || '#ccc' }}
                      ></div>
                      {houses.find(h => h.id === student.houseId)?.name}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Points indicator */}
              {student.id && studentPoints[student.id] ? (
                <div className={cn(
                  "text-sm font-mono font-semibold",
                  student.id === selectedStudentId 
                    ? "text-white" 
                    : studentPoints[student.id].total > 0 
                      ? "text-green-600" 
                      : studentPoints[student.id].total < 0 
                        ? "text-red-600" 
                        : "text-neutral-dark"
                )}>
                  {studentPoints[student.id].total > 0 && '+'}
                  {studentPoints[student.id].total}
                </div>
              ) : (
                <div className={cn(
                  "text-xs",
                  student.id === selectedStudentId 
                    ? "text-white text-opacity-80" 
                    : "text-neutral-dark"
                )}>
                  No points
                </div>
              )}
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
              <div className="flex justify-between items-start mb-2">
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
                
                {/* Checkbox for batch selection */}
                <div 
                  className="ml-auto" 
                  onClick={(e) => toggleStudentSelection(student.id!, e)}
                >
                  {selectedStudents.includes(student.id!) ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-gray-300"></div>
                  )}
                </div>
              </div>
              
              {/* Points and mini progress bar */}
              <div className="mt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-neutral-dark">Total Points</span>
                  {student.id && studentPoints[student.id] ? (
                    <span className={cn(
                      "font-mono font-semibold",
                      studentPoints[student.id].total > 0 
                        ? "text-green-600" 
                        : studentPoints[student.id].total < 0 
                          ? "text-red-600" 
                          : "text-neutral-dark"
                    )}>
                      {studentPoints[student.id].total > 0 && '+'}
                      {studentPoints[student.id].total}
                    </span>
                  ) : (
                    <span className="text-neutral-dark">
                      No points
                    </span>
                  )}
                </div>
                
                {student.id && studentPoints[student.id] ? (
                  <div className="flex gap-1 h-1">
                    <div 
                      className="bg-green-500 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (studentPoints[student.id].positive / (studentPoints[student.id].positive + studentPoints[student.id].negative || 1)) * 100)}%` 
                      }}
                    ></div>
                    <div 
                      className="bg-red-500 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (studentPoints[student.id].negative / (studentPoints[student.id].positive + studentPoints[student.id].negative || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                ) : (
                  <div className="h-1 bg-neutral-light rounded-full"></div>
                )}
              </div>
              
              {/* House indicator */}
              {houses && student.houseId && (
                <div className="mt-2 flex items-center text-xs text-neutral-dark">
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: houses.find(h => h.id === student.houseId)?.color || '#ccc' }}
                  ></div>
                  {houses.find(h => h.id === student.houseId)?.name}
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
