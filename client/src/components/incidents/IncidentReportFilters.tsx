import { useState } from "react";
import { incidentStatuses, incidentTypes } from "@shared/schema";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  FilterIcon, 
  X, 
  ChevronDown, 
  BarChart4 
} from "lucide-react";
import { useIncidentReports } from "@/hooks/incident-report-context";

export function IncidentReportFilters() {
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

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Date range calendar state
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Count active filters
  const activeFilterCount = Object.values(filters).filter(f => {
    if (f === null) return false;
    if (typeof f === 'object' && f.from === null && f.to === null) return false;
    return true;
  }).length;

  const formatIncidentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Filter Incident Reports</CardTitle>
            <CardDescription>Narrow down incidents by various criteria</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        
        {/* Active filters display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.status && (
              <Badge variant="outline" className="bg-gray-100">
                Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setStatusFilter(null)} 
                />
              </Badge>
            )}
            
            {filters.type && (
              <Badge variant="outline" className="bg-gray-100">
                Type: {formatIncidentType(filters.type)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setTypeFilter(null)} 
                />
              </Badge>
            )}
            
            {filters.teacherId && (
              <Badge variant="outline" className="bg-gray-100">
                Teacher: {
                  teachers.find(t => t.id === filters.teacherId)
                    ? `${teachers.find(t => t.id === filters.teacherId)?.firstName} ${teachers.find(t => t.id === filters.teacherId)?.lastName}`
                    : `ID: ${filters.teacherId}`
                }
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setTeacherFilter(null)} 
                />
              </Badge>
            )}
            
            {filters.studentId && (
              <Badge variant="outline" className="bg-gray-100">
                Student: {
                  students.find(s => s.id === filters.studentId)
                    ? `${students.find(s => s.id === filters.studentId)?.firstName} ${students.find(s => s.id === filters.studentId)?.lastName}`
                    : `ID: ${filters.studentId}`
                }
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setStudentFilter(null)} 
                />
              </Badge>
            )}
            
            {(filters.dateRange.from || filters.dateRange.to) && (
              <Badge variant="outline" className="bg-gray-100">
                Date: {filters.dateRange.from ? format(filters.dateRange.from, "MMM d, yyyy") : "Any"} 
                - 
                {filters.dateRange.to ? format(filters.dateRange.to, "MMM d, yyyy") : "Any"}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setDateRangeFilter(null, null)} 
                />
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs" 
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </CardHeader>
      
      {filtersExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={filters.status || ""} 
                onValueChange={value => setStatusFilter(value === "" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any status</SelectItem>
                  {incidentStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Type filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Incident Type</label>
              <Select 
                value={filters.type || ""} 
                onValueChange={value => setTypeFilter(value === "" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any type</SelectItem>
                  {incidentTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {formatIncidentType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Teacher filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reported By</label>
              <Select 
                value={filters.teacherId?.toString() || ""} 
                onValueChange={value => setTeacherFilter(value === "" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any teacher</SelectItem>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Student filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Student Involved</label>
              <Select 
                value={filters.studentId?.toString() || ""} 
                onValueChange={value => setStudentFilter(value === "" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any student</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date range filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from && filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "MMM d, yyyy")} - {format(filters.dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : filters.dateRange.from ? (
                      <>From {format(filters.dateRange.from, "MMM d, yyyy")}</>
                    ) : filters.dateRange.to ? (
                      <>Until {format(filters.dateRange.to, "MMM d, yyyy")}</>
                    ) : (
                      "Any date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={filters.dateRange.from || undefined}
                    selected={{
                      from: filters.dateRange.from || undefined,
                      to: filters.dateRange.to || undefined
                    }}
                    onSelect={(range) => {
                      setDateRangeFilter(range?.from || null, range?.to || null);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Search input - for future implementation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Description</label>
              <Input 
                placeholder="Search descriptions..." 
                disabled 
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function IncidentReportAnalytics() {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Incident Analytics</CardTitle>
            <CardDescription>View trends and patterns in reported incidents</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
          >
            <BarChart4 className="h-4 w-4 mr-2" />
            Analytics
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-center p-6 text-muted-foreground">
                  <p>Analytics visualization coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">Incident Types</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-center p-6 text-muted-foreground">
                  <p>Analytics visualization coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-center p-6 text-muted-foreground">
                  <p>Analytics visualization coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      )}
    </Card>
  );
}