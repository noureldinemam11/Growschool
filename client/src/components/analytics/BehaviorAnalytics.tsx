import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BehaviorPoint, BehaviorCategory, User, House } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define a type that properly handles timestamp as string or Date
type BehaviorPointWithTimestamp = Omit<BehaviorPoint, 'timestamp'> & {
  timestamp: Date | string;
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

import { 
  Calendar, 
  BarChart2, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  Activity,
  User as UserIcon,
  Users,
  CalendarDays,
  Filter
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define chart colors
const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const POSITIVE_COLOR = '#16a34a';
const NEGATIVE_COLOR = '#ef4444';

// Helper function to format dates
const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// Group behavior points by category
function groupByCategory(points: BehaviorPointWithTimestamp[], categories: BehaviorCategory[]) {
  const result: Record<string, { positive: number; negative: number }> = {};
  
  // Initialize all categories with 0 values
  categories.forEach(category => {
    result[category.name] = { positive: 0, negative: 0 };
  });
  
  // Tally up points by category
  points.forEach(point => {
    const category = categories.find(c => c.id === point.categoryId);
    if (category) {
      if (point.points > 0) {
        result[category.name].positive += point.points;
      } else {
        result[category.name].negative += Math.abs(point.points);
      }
    }
  });
  
  // Convert to array format for charts
  return Object.entries(result).map(([name, values]) => ({
    name,
    positive: values.positive,
    negative: values.negative
  }));
}

// Group points by day of week
function groupByDayOfWeek(points: BehaviorPointWithTimestamp[]) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const result = days.map(day => ({ name: day, positive: 0, negative: 0 }));
  
  points.forEach(point => {
    // Convert timestamp to Date object safely
    const timestamp = typeof point.timestamp === 'string' 
      ? point.timestamp 
      : point.timestamp.toISOString();
    const date = new Date(timestamp);
    const dayIndex = date.getDay();
    
    if (point.points > 0) {
      result[dayIndex].positive += point.points;
    } else {
      result[dayIndex].negative += Math.abs(point.points);
    }
  });
  
  return result;
}

// Group points by time of day
function groupByTimeOfDay(points: BehaviorPointWithTimestamp[]) {
  const timeSlots = [
    { slot: 'Morning (8-11)', positive: 0, negative: 0 },
    { slot: 'Midday (11-1)', positive: 0, negative: 0 },
    { slot: 'Afternoon (1-3)', positive: 0, negative: 0 },
    { slot: 'Late Day (3-5)', positive: 0, negative: 0 }
  ];
  
  points.forEach(point => {
    // Convert timestamp to Date object safely
    const timestamp = typeof point.timestamp === 'string' 
      ? point.timestamp 
      : point.timestamp.toISOString();
    const date = new Date(timestamp);
    const hour = date.getHours();
    
    let slotIndex;
    if (hour >= 8 && hour < 11) slotIndex = 0;
    else if (hour >= 11 && hour < 13) slotIndex = 1;
    else if (hour >= 13 && hour < 15) slotIndex = 2;
    else if (hour >= 15 && hour < 17) slotIndex = 3;
    else return; // Outside school hours
    
    if (point.points > 0) {
      timeSlots[slotIndex].positive += point.points;
    } else {
      timeSlots[slotIndex].negative += Math.abs(point.points);
    }
  });
  
  return timeSlots;
}

// Track points over time
function getPointsTimeline(points: BehaviorPointWithTimestamp[]) {
  // Group points by date
  const pointsByDate: Record<string, { date: string; positive: number; negative: number; net: number }> = {};
  
  // Sort points by timestamp (oldest first)
  const sortedPoints = [...points].sort((a, b) => {
    // Convert timestamps to Date objects safely
    const timestampA = typeof a.timestamp === 'string' ? a.timestamp : a.timestamp.toISOString();
    const timestampB = typeof b.timestamp === 'string' ? b.timestamp : b.timestamp.toISOString();
    return new Date(timestampA).getTime() - new Date(timestampB).getTime();
  });
  
  // Process each point
  sortedPoints.forEach(point => {
    // Convert timestamp to safe format for formatDate
    const timestamp = typeof point.timestamp === 'string' 
      ? point.timestamp 
      : point.timestamp.toISOString();
    const date = formatDate(timestamp);
    
    if (!pointsByDate[date]) {
      pointsByDate[date] = { date, positive: 0, negative: 0, net: 0 };
    }
    
    if (point.points > 0) {
      pointsByDate[date].positive += point.points;
    } else {
      pointsByDate[date].negative += Math.abs(point.points);
    }
    
    pointsByDate[date].net += point.points;
  });
  
  // Convert to array and limit to most recent 14 days
  return Object.values(pointsByDate).slice(-14);
}

// Calculate student behavior profiles
function calculateStudentProfiles(points: BehaviorPointWithTimestamp[], students: User[], categories: BehaviorCategory[]) {
  const result: any[] = [];
  
  students.forEach(student => {
    const studentPoints = points.filter(p => p.studentId === student.id);
    if (studentPoints.length === 0) return;
    
    const positivePoints = studentPoints.filter(p => p.points > 0);
    const negativePoints = studentPoints.filter(p => p.points < 0);
    
    const totalPositive = positivePoints.reduce((sum, p) => sum + p.points, 0);
    const totalNegative = negativePoints.reduce((sum, p) => sum + p.points, 0);
    
    // Find most common positive and negative categories
    const positiveCategoryCounts: Record<number, number> = {};
    const negativeCategoryCounts: Record<number, number> = {};
    
    positivePoints.forEach(p => {
      positiveCategoryCounts[p.categoryId] = (positiveCategoryCounts[p.categoryId] || 0) + 1;
    });
    
    negativePoints.forEach(p => {
      negativeCategoryCounts[p.categoryId] = (negativeCategoryCounts[p.categoryId] || 0) + 1;
    });
    
    // Get the most frequent categories
    let topPositiveCategory: string = 'None';
    let topNegativeCategory: string = 'None';
    
    if (Object.keys(positiveCategoryCounts).length > 0) {
      const topPosCatId = Object.entries(positiveCategoryCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      const category = categories.find(c => c.id === parseInt(topPosCatId));
      if (category) topPositiveCategory = category.name;
    }
    
    if (Object.keys(negativeCategoryCounts).length > 0) {
      const topNegCatId = Object.entries(negativeCategoryCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      const category = categories.find(c => c.id === parseInt(topNegCatId));
      if (category) topNegativeCategory = category.name;
    }
    
    // Calculate point distribution by time of day
    const timeDistribution = [
      { name: 'Morning', value: 0 },
      { name: 'Midday', value: 0 },
      { name: 'Afternoon', value: 0 },
      { name: 'Late Day', value: 0 },
    ];
    
    studentPoints.forEach(point => {
      // Convert timestamp to Date object safely
      const timestamp = typeof point.timestamp === 'string' 
        ? point.timestamp 
        : point.timestamp.toISOString();
      const date = new Date(timestamp);
      const hour = date.getHours();
      
      let index;
      if (hour >= 8 && hour < 11) index = 0;
      else if (hour >= 11 && hour < 13) index = 1;
      else if (hour >= 13 && hour < 15) index = 2;
      else if (hour >= 15 && hour < 17) index = 3;
      else return;
      
      timeDistribution[index].value += Math.abs(point.points);
    });
    
    // Calculate total points
    const netPoints = totalPositive + totalNegative;
    
    result.push({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      positivePoints: totalPositive,
      negativePoints: Math.abs(totalNegative),
      netPoints,
      pointsCount: studentPoints.length,
      topStrength: topPositiveCategory,
      topChallenge: topNegativeCategory,
      timeDistribution
    });
  });
  
  // Sort by net points (highest first)
  return result.sort((a, b) => b.netPoints - a.netPoints);
}

// Main component
export default function BehaviorAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all-time');
  const [selectedHouse, setSelectedHouse] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [selectedChartType, setSelectedChartType] = useState<string>('bar');
  
  // Fetch points
  const { data: points, isLoading: loadingPoints } = useQuery<BehaviorPoint[]>({
    queryKey: ['/api/behavior-points/recent'],
  });

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });
  
  // Fetch students
  const { data: students, isLoading: loadingStudents } = useQuery<User[]>({
    queryKey: ['/api/users/role/student'],
  });
  
  // Fetch houses
  const { data: houses, isLoading: loadingHouses } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });
  
  // Loading state
  const isLoading = loadingPoints || loadingCategories || loadingStudents || loadingHouses;
  
  // Filter points based on selected timeframe and house
  const filteredPoints = useMemo(() => {
    if (!points) return [];
    
    let filtered = [...points];
    
    // Filter by timeframe
    if (selectedTimeframe !== 'all-time') {
      const now = new Date();
      let cutoff = new Date();
      
      switch (selectedTimeframe) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoff.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(point => {
        // Convert timestamp to Date object safely
        const timestamp = typeof point.timestamp === 'string' 
          ? point.timestamp 
          : point.timestamp.toISOString();
        return new Date(timestamp) >= cutoff;
      });
    }
    
    // Filter by house
    if (selectedHouse !== 'all' && students) {
      const houseId = parseInt(selectedHouse);
      const studentsInHouse = students.filter(student => student.houseId === houseId);
      const studentIds = studentsInHouse.map(student => student.id);
      
      filtered = filtered.filter(point => studentIds.includes(point.studentId));
    }
    
    return filtered;
  }, [points, students, selectedTimeframe, selectedHouse]);
  
  // Prepare data for charts
  const categoryData = useMemo(() => {
    if (!filteredPoints || !categories) return [];
    return groupByCategory(filteredPoints, categories);
  }, [filteredPoints, categories]);
  
  const dayOfWeekData = useMemo(() => {
    if (!filteredPoints) return [];
    return groupByDayOfWeek(filteredPoints);
  }, [filteredPoints]);
  
  const timeOfDayData = useMemo(() => {
    if (!filteredPoints) return [];
    return groupByTimeOfDay(filteredPoints);
  }, [filteredPoints]);
  
  const timelineData = useMemo(() => {
    if (!filteredPoints) return [];
    return getPointsTimeline(filteredPoints);
  }, [filteredPoints]);
  
  const studentProfiles = useMemo(() => {
    if (!filteredPoints || !students || !categories) return [];
    return calculateStudentProfiles(filteredPoints, students, categories);
  }, [filteredPoints, students, categories]);
  
  // Calculate summary statistics
  const stats = useMemo(() => {
    if (!filteredPoints || filteredPoints.length === 0) {
      return {
        totalPoints: 0,
        positivePoints: 0,
        negativePoints: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        totalEvents: 0
      };
    }
    
    const positivePoints = filteredPoints
      .filter(p => p.points > 0)
      .reduce((sum, p) => sum + p.points, 0);
      
    const negativePoints = filteredPoints
      .filter(p => p.points < 0)
      .reduce((sum, p) => sum + p.points, 0);
      
    const totalPoints = positivePoints + negativePoints;
    const totalPositiveNegative = positivePoints + Math.abs(negativePoints);
    
    return {
      totalPoints,
      positivePoints,
      negativePoints,
      positivePercentage: totalPositiveNegative ? (positivePoints / totalPositiveNegative) * 100 : 0,
      negativePercentage: totalPositiveNegative ? (Math.abs(negativePoints) / totalPositiveNegative) * 100 : 0,
      totalEvents: filteredPoints.length
    };
  }, [filteredPoints]);
  
  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Behavior Analytics</h2>
        <p className="text-muted-foreground">
          Analyze behavior patterns to identify trends and opportunities for improvement.
        </p>
      </div>
      
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        {/* Filters */}
        <Card className="md:w-64 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timeframe">Time Period</Label>
              <Select 
                value={selectedTimeframe} 
                onValueChange={setSelectedTimeframe}
              >
                <SelectTrigger id="timeframe">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="quarter">Last 90 days</SelectItem>
                  <SelectItem value="all-time">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="house">House</Label>
              <Select 
                value={selectedHouse} 
                onValueChange={setSelectedHouse}
              >
                <SelectTrigger id="house">
                  <SelectValue placeholder="Select house" />
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
            
            <div className="pt-4">
              <h4 className="mb-2 text-sm font-semibold">Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total points:</span>
                  <span className="font-medium">{stats.totalPoints}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total events:</span>
                  <span className="font-medium">{stats.totalEvents}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Positive points:</span>
                  <span className="font-medium text-green-600">{stats.positivePoints}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Negative points:</span>
                  <span className="font-medium text-red-600">{stats.negativePoints}</span>
                </div>
                
                {/* Positive/Negative ratio bar */}
                <div className="pt-2">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${stats.positivePercentage}%`, float: 'left' }}
                    />
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${stats.negativePercentage}%`, float: 'left' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>{Math.round(stats.positivePercentage)}% positive</span>
                    <span>{Math.round(stats.negativePercentage)}% negative</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main content */}
        <div className="flex-1 space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="col-span-4">
              <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="w-full justify-start border-b pb-px overflow-x-auto">
                  <TabsTrigger value="overview" className="flex items-center">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="flex items-center">
                    <PieChartIcon className="mr-2 h-4 w-4" />
                    Categories
                  </TabsTrigger>
                  <TabsTrigger value="timing" className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Timing Analysis
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="flex items-center">
                    <LineChartIcon className="mr-2 h-4 w-4" />
                    Trends
                  </TabsTrigger>
                  <TabsTrigger value="students" className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Student Profiles
                  </TabsTrigger>
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Behavior Points Overview</CardTitle>
                      <CardDescription>
                        Summary of behavior points by category, showing both positive and negative behaviors
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-80 flex items-center justify-center">
                          <Skeleton className="w-full h-64" />
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="flex justify-end mb-4 space-x-2">
                            <Button
                              variant={selectedChartType === 'bar' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedChartType('bar')}
                            >
                              <BarChart2 className="h-4 w-4 mr-1" />
                              Bar
                            </Button>
                            <Button
                              variant={selectedChartType === 'pie' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedChartType('pie')}
                            >
                              <PieChartIcon className="h-4 w-4 mr-1" />
                              Pie
                            </Button>
                          </div>
                          
                          <div className="w-full h-80">
                            {selectedChartType === 'bar' ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={categoryData}
                                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="name" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={80}
                                  />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Bar dataKey="positive" name="Positive Points" fill={POSITIVE_COLOR} />
                                  <Bar dataKey="negative" name="Negative Points" fill={NEGATIVE_COLOR} />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={categoryData.map(item => ({
                                      name: item.name,
                                      value: item.positive
                                    }))}
                                    cx="30%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill={POSITIVE_COLOR}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => 
                                      `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                  >
                                    {categoryData.map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Pie
                                    data={categoryData.map(item => ({
                                      name: item.name,
                                      value: item.negative
                                    }))}
                                    cx="70%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill={NEGATIVE_COLOR}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => 
                                      `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                  >
                                    {categoryData.map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend 
                                    content={
                                      <div className="flex justify-center mt-6">
                                        <div className="mr-8">
                                          <div className="font-medium">Positive Points</div>
                                          <div className="text-sm text-neutral-dark">Left chart</div>
                                        </div>
                                        <div>
                                          <div className="font-medium">Negative Points</div>
                                          <div className="text-sm text-neutral-dark">Right chart</div>
                                        </div>
                                      </div>
                                    } 
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Behavior Categories Analysis</CardTitle>
                      <CardDescription>
                        Detailed breakdown of behavior points by category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-80 flex items-center justify-center">
                          <Skeleton className="w-full h-64" />
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={categoryData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                                layout="vertical"
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis 
                                  type="category" 
                                  dataKey="name" 
                                  width={150}
                                />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="positive" name="Positive" fill={POSITIVE_COLOR} />
                                <Bar dataKey="negative" name="Negative" fill={NEGATIVE_COLOR} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Category details */}
                          <div className="mt-8 border rounded-md">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Positive Points
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Negative Points
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Net Impact
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {categoryData.map((category, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      {category.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                      +{category.positive}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                      -{category.negative}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <span className={
                                        category.positive - category.negative > 0 
                                          ? "text-green-600" 
                                          : category.positive - category.negative < 0 
                                            ? "text-red-600" 
                                            : ""
                                      }>
                                        {category.positive - category.negative > 0 && '+'}
                                        {category.positive - category.negative}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Timing Analysis Tab */}
                <TabsContent value="timing" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Behavior by Day of Week</CardTitle>
                        <CardDescription>
                          Point distribution across different days
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="w-full h-60 flex items-center justify-center">
                            <Skeleton className="w-full h-52" />
                          </div>
                        ) : (
                          <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={dayOfWeekData}
                                margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="positive" name="Positive" fill={POSITIVE_COLOR} />
                                <Bar dataKey="negative" name="Negative" fill={NEGATIVE_COLOR} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Behavior by Time of Day</CardTitle>
                        <CardDescription>
                          Point distribution across different times
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="w-full h-60 flex items-center justify-center">
                            <Skeleton className="w-full h-52" />
                          </div>
                        ) : (
                          <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={timeOfDayData}
                                margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="slot" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="positive" name="Positive" fill={POSITIVE_COLOR} />
                                <Bar dataKey="negative" name="Negative" fill={NEGATIVE_COLOR} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Time Pattern Insights</CardTitle>
                      <CardDescription>
                        Key observations about behavior timing patterns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="w-full h-4" />
                          <Skeleton className="w-full h-4" />
                          <Skeleton className="w-full h-4" />
                          <Skeleton className="w-3/4 h-4" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium">
                                Peak Behavior Day: {
                                  dayOfWeekData.reduce(
                                    (max, day) => (day.positive > max.positive ? day : max),
                                    { name: '-', positive: 0 }
                                  ).name
                                }
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                The day with the highest positive behavior points.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <Activity className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium">
                                Challenge Day: {
                                  dayOfWeekData.reduce(
                                    (max, day) => (day.negative > max.negative ? day : max),
                                    { name: '-', negative: 0 }
                                  ).name
                                }
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                The day with the most behavior challenges.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <Filter className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium">
                                Best Time of Day: {
                                  timeOfDayData.reduce(
                                    (max, time) => (time.positive > max.positive ? time : max),
                                    { slot: '-', positive: 0 }
                                  ).slot
                                }
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                The time of day with the most positive behaviors.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Trends Tab */}
                <TabsContent value="trends" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Behavior Points Trends</CardTitle>
                      <CardDescription>
                        Trend analysis of behavior points over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-80 flex items-center justify-center">
                          <Skeleton className="w-full h-72" />
                        </div>
                      ) : (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={timelineData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="positive" 
                                name="Positive" 
                                stroke={POSITIVE_COLOR} 
                                activeDot={{ r: 8 }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="negative" 
                                name="Negative" 
                                stroke={NEGATIVE_COLOR}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="net" 
                                name="Net Points" 
                                stroke="#6366f1"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Trend Summary</CardTitle>
                      <CardDescription>
                        Key observations and trend indicators
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading || timelineData.length < 2 ? (
                        <div className="space-y-3">
                          <Skeleton className="w-full h-4" />
                          <Skeleton className="w-full h-4" />
                          <Skeleton className="w-3/4 h-4" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Simple trend calculation */}
                          {(() => {
                            // Calculate if points are trending up or down
                            if (timelineData.length < 2) return null;
                            
                            const recentDays = timelineData.slice(-7);
                            if (recentDays.length < 2) return null;
                            
                            const firstDay = recentDays[0];
                            const lastDay = recentDays[recentDays.length - 1];
                            const trend = lastDay.net - firstDay.net;
                            
                            const trendDirection = trend > 0 ? "up" : trend < 0 ? "down" : "stable";
                            const trendColor = trendDirection === "up" 
                              ? "text-green-600" 
                              : trendDirection === "down" 
                                ? "text-red-600" 
                                : "text-yellow-600";
                            
                            return (
                              <div className="flex items-center space-x-2">
                                <div className={`text-lg font-semibold ${trendColor}`}>
                                  {trendDirection === "up" && "↗"}
                                  {trendDirection === "down" && "↘"}
                                  {trendDirection === "stable" && "→"}
                                  {" "}
                                  {trendDirection === "up" && "Increasing"}
                                  {trendDirection === "down" && "Decreasing"}
                                  {trendDirection === "stable" && "Stable"}
                                </div>
                                <div className="text-sm text-neutral-dark">
                                  Points are trending {trendDirection} over the selected period.
                                </div>
                              </div>
                            );
                          })()}
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div className="border rounded-md p-3">
                              <div className="text-sm text-neutral-dark">Highest Point Day</div>
                              <div className="font-medium">
                                {timelineData.reduce((max, day) => 
                                  day.positive > max.positive ? day : max
                                , { date: '-', positive: 0 }).date}
                              </div>
                            </div>
                            
                            <div className="border rounded-md p-3">
                              <div className="text-sm text-neutral-dark">Most Challenging Day</div>
                              <div className="font-medium">
                                {timelineData.reduce((max, day) => 
                                  day.negative > max.negative ? day : max
                                , { date: '-', negative: 0 }).date}
                              </div>
                            </div>
                            
                            <div className="border rounded-md p-3">
                              <div className="text-sm text-neutral-dark">Best Net Point Day</div>
                              <div className="font-medium">
                                {timelineData.reduce((max, day) => 
                                  day.net > max.net ? day : max
                                , { date: '-', net: -Infinity }).date}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Student Profiles Tab */}
                <TabsContent value="students" className="space-y-4 pt-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="w-full h-32" />
                      <Skeleton className="w-full h-32" />
                      <Skeleton className="w-full h-32" />
                    </div>
                  ) : studentProfiles.length > 0 ? (
                    <div className="space-y-4">
                      {studentProfiles.slice(0, 5).map(student => (
                        <Card key={student.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="flex items-center">
                                <UserIcon className="mr-2 h-5 w-5" />
                                {student.name}
                              </CardTitle>
                              <div className="flex space-x-2">
                                <div className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded">
                                  +{student.positivePoints}
                                </div>
                                <div className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded">
                                  -{student.negativePoints}
                                </div>
                                <div className={`text-sm px-2 py-1 rounded ${
                                  student.netPoints > 0 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  Net: {student.netPoints}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-semibold text-neutral-dark mb-1">
                                      Top Strength
                                    </h4>
                                    <p className="text-sm">
                                      {student.topStrength}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-neutral-dark mb-1">
                                      Areas for Growth
                                    </h4>
                                    <p className="text-sm">
                                      {student.topChallenge === 'None' 
                                        ? 'No negative points recorded'
                                        : student.topChallenge}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-neutral-dark mb-1">
                                      Points Events
                                    </h4>
                                    <p className="text-sm">
                                      {student.pointsCount} total interactions
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-neutral-dark mb-1">
                                      Positive Ratio
                                    </h4>
                                    <p className="text-sm">
                                      {Math.round((student.positivePoints / (student.positivePoints + student.negativePoints)) * 100)}% positive
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-dark mb-1">
                                  Time Distribution
                                </h4>
                                <div className="h-20">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart 
                                      outerRadius={35} 
                                      data={student.timeDistribution}
                                    >
                                      <PolarGrid />
                                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 8 }} />
                                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
                                      <Radar 
                                        name="Points" 
                                        dataKey="value" 
                                        stroke="#8884d8" 
                                        fill="#8884d8" 
                                        fillOpacity={0.6} 
                                      />
                                      <Tooltip />
                                    </RadarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 border rounded-md">
                      <p className="text-neutral-dark">No student data found for the selected filters</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}