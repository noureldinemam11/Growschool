import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Calendar 
} from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  Check, 
  ChevronDown,
  Filter, 
  Search, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIncidentReports } from '@/hooks/incident-report-context';
import { format } from 'date-fns';

const incidentStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
];

const incidentTypeOptions = [
  { value: 'classroom_disruption', label: 'Classroom Disruption' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'physical_aggression', label: 'Physical Aggression' },
  { value: 'verbal_aggression', label: 'Verbal Aggression' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'academic_dishonesty', label: 'Academic Dishonesty' },
  { value: 'technology_misuse', label: 'Technology Misuse' },
  { value: 'other', label: 'Other' },
];

const predefinedDateRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

export default function IncidentReportFilters() {
  const {
    filters,
    setStatusFilter,
    setTypeFilter,
    setTeacherFilter,
    setStudentFilter,
    setDateRangeFilter,
    clearFilters,
    teachers,
    students
  } = useIncidentReports();

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);
  
  // Check if any filters are applied
  const hasActiveFilters = 
    filters.status !== null || 
    filters.type !== null || 
    filters.teacherId !== null || 
    filters.studentId !== null || 
    filters.dateRange.from !== null || 
    filters.dateRange.to !== null;

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset hours to start of day
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    switch (range) {
      case 'today':
        setDateRangeFilter(today, today);
        break;
      case 'yesterday':
        setDateRangeFilter(yesterday, yesterday);
        break;
      case 'this_week':
        setDateRangeFilter(thisWeekStart, today);
        break;
      case 'last_week':
        setDateRangeFilter(lastWeekStart, lastWeekEnd);
        break;
      case 'this_month':
        setDateRangeFilter(thisMonthStart, today);
        break;
      case 'last_month':
        setDateRangeFilter(lastMonthStart, lastMonthEnd);
        break;
      case 'custom':
        // Will be handled by the date picker
        break;
      default:
        setDateRangeFilter(null, null);
    }
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchQuery('');
    setSelectedDateRange(null);
  };

  const getTeacherName = (id: number | null) => {
    if (!id) return '';
    const teacher = teachers.find(t => t.id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : '';
  };

  const getStudentName = (id: number | null) => {
    if (!id) return '';
    const student = students.find(s => s.id === id);
    return student ? `${student.firstName} ${student.lastName}` : '';
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Top filter bar - always visible */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 items-center">
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="px-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              
              <Button 
                variant={isExpanded ? "default" : "outline"} 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-1"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Applied filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace(/_/g, ' ')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setStatusFilter(null)} 
                  />
                </Badge>
              )}
              
              {filters.type && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.type.charAt(0).toUpperCase() + filters.type.slice(1).replace(/_/g, ' ')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setTypeFilter(null)} 
                  />
                </Badge>
              )}
              
              {filters.teacherId && (
                <Badge variant="secondary" className="gap-1">
                  Reporter: {getTeacherName(filters.teacherId)}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setTeacherFilter(null)} 
                  />
                </Badge>
              )}
              
              {filters.studentId && (
                <Badge variant="secondary" className="gap-1">
                  Student: {getStudentName(filters.studentId)}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setStudentFilter(null)} 
                  />
                </Badge>
              )}
              
              {(filters.dateRange.from || filters.dateRange.to) && (
                <Badge variant="secondary" className="gap-1">
                  Date: {
                    filters.dateRange.from && filters.dateRange.to
                      ? `${format(filters.dateRange.from, 'MMM d, yyyy')} - ${format(filters.dateRange.to, 'MMM d, yyyy')}`
                      : filters.dateRange.from
                        ? `From ${format(filters.dateRange.from, 'MMM d, yyyy')}`
                        : `Until ${format(filters.dateRange.to!, 'MMM d, yyyy')}`
                  }
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setDateRangeFilter(null, null);
                      setSelectedDateRange(null);
                    }} 
                  />
                </Badge>
              )}
            </div>
          )}
          
          {/* Expanded filter options */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              {/* Status filter */}
              <div>
                <Label className="mb-2 block">Status</Label>
                <Select 
                  value={filters.status || "all_status"} 
                  onValueChange={(value) => setStatusFilter(value === "all_status" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_status">Any status</SelectItem>
                    {incidentStatusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Type filter */}
              <div>
                <Label className="mb-2 block">Incident Type</Label>
                <Select 
                  value={filters.type || "all_types"} 
                  onValueChange={(value) => setTypeFilter(value === "all_types" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_types">Any type</SelectItem>
                    {incidentTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Teacher filter */}
              <div>
                <Label className="mb-2 block">Reporter</Label>
                <Select 
                  value={filters.teacherId?.toString() || "all_teachers"} 
                  onValueChange={(value) => setTeacherFilter(value === "all_teachers" ? null : (value ? parseInt(value) : null))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_teachers">Any teacher</SelectItem>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date range filter */}
              <div>
                <Label className="mb-2 block">Date Range</Label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedDateRange || "all_time"} 
                    onValueChange={(value) => {
                      if (value === "all_time") {
                        setSelectedDateRange(null);
                        setDateRangeFilter(null, null);
                      } else {
                        handleDateRangeChange(value);
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_time">Any time</SelectItem>
                      {predefinedDateRanges.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedDateRange === 'custom' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-auto gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {filters.dateRange.from && filters.dateRange.to
                            ? `${format(filters.dateRange.from, 'MM/dd')} - ${format(filters.dateRange.to, 'MM/dd')}`
                            : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="range"
                          defaultMonth={filters.dateRange.from || undefined}
                          selected={{
                            from: filters.dateRange.from || undefined,
                            to: filters.dateRange.to || undefined,
                          }}
                          onSelect={(range) => {
                            if (range?.from) {
                              setDateRangeFilter(range.from, range.to || range.from);
                            } else {
                              setDateRangeFilter(null, null);
                            }
                          }}
                          numberOfMonths={2}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              
              {/* Student filter */}
              <div className="md:col-span-2">
                <Label className="mb-2 block">Student</Label>
                <Select 
                  value={filters.studentId?.toString() || "all_students"} 
                  onValueChange={(value) => setStudentFilter(value === "all_students" ? null : (value ? parseInt(value) : null))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_students">Any student</SelectItem>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName} {student.gradeLevel ? `(${student.gradeLevel})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Quick filter buttons */}
              <div className="flex flex-wrap gap-2 md:col-span-2 items-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => {
                    setStatusFilter('pending');
                    setSelectedDateRange(null);
                    setDateRangeFilter(null, null);
                  }}
                >
                  <Check className="h-4 w-4" />
                  Pending Issues
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => {
                    setStatusFilter(null);
                    handleDateRangeChange('today');
                  }}
                >
                  <Check className="h-4 w-4" />
                  Today's Incidents
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => {
                    setStatusFilter(null);
                    handleDateRangeChange('this_week');
                  }}
                >
                  <Check className="h-4 w-4" />
                  This Week
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}