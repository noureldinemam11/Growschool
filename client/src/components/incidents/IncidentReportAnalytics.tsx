import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIncidentReports } from "@/hooks/incident-report-context";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4F46E5', '#FF4560', '#775DD0'];

export default function IncidentReportAnalytics() {
  const { filteredReports, isLoading, students } = useIncidentReports();
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('month');
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group reports by type
  const reportsByType = filteredReports.reduce((acc, report) => {
    acc[report.type] = (acc[report.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(reportsByType).map(([name, value]) => ({
    name: formatIncidentType(name),
    value
  }));

  // Group reports by status
  const reportsByStatus = filteredReports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(reportsByStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Group reports by student
  const reportsByStudent = filteredReports.reduce((acc, report) => {
    report.studentIds.forEach(studentId => {
      acc[studentId] = (acc[studentId] || 0) + 1;
    });
    return acc;
  }, {} as Record<number, number>);

  const studentData = Object.entries(reportsByStudent)
    .map(([studentId, count]) => {
      const student = students.find(s => s.id === parseInt(studentId));
      return {
        name: student ? `${student.firstName} ${student.lastName}` : `Student #${studentId}`,
        count
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 students with most incidents

  // Calculate resolution times for resolved reports
  const resolvedReports = filteredReports.filter(r => r.status === 'resolved' && r.updatedAt);
  
  // Time series data - reports by date
  const now = new Date();
  let startDate: Date;
  
  switch (timeFrame) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'month':
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  // Create an object with all dates in the range
  const dateRange: Record<string, number> = {};
  const currentDate = new Date(startDate);
  
  while (currentDate <= now) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dateRange[dateStr] = 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fill in the counts for each date
  filteredReports.forEach(report => {
    const reportDate = new Date(report.incidentDate).toISOString().split('T')[0];
    if (dateRange[reportDate] !== undefined) {
      dateRange[reportDate]++;
    }
  });

  const timeSeriesData = Object.entries(dateRange).map(([date, count]) => {
    // Format date based on timeframe
    let formattedDate = date;
    if (timeFrame === 'month' || timeFrame === 'week') {
      // For month or week, show MM/DD
      const [year, month, day] = date.split('-');
      formattedDate = `${month}/${day}`;
    } else if (timeFrame === 'year') {
      // For year, show MM/YY
      const [year, month] = date.split('-');
      formattedDate = `${month}/${year.substring(2)}`;
    }
    
    return { date: formattedDate, count };
  });

  // Calculate average resolution time in hours
  let avgResolutionTime = 0;
  if (resolvedReports.length > 0) {
    const totalResolutionTime = resolvedReports.reduce((total, report) => {
      const createdAt = new Date(report.createdAt);
      const resolvedAt = new Date(report.updatedAt); // Use updatedAt as resolvedAt
      const diffInHours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      return total + diffInHours;
    }, 0);
    avgResolutionTime = totalResolutionTime / resolvedReports.length;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center space-y-3 md:space-y-0 mb-6">
        <h2 className="text-2xl font-bold">Incident Reports Analytics</h2>
        
        <div className="flex space-x-2">
          <Select
            value={timeFrame}
            onValueChange={(value) => setTimeFrame(value as 'week' | 'month' | 'year')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Time Frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Reports</CardTitle>
            <CardDescription>Number of incident reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{filteredReports.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Open Reports</CardTitle>
            <CardDescription>Reports still pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{filteredReports.filter(r => r.status === 'pending').length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Avg. Resolution Time</CardTitle>
            <CardDescription>For resolved reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {avgResolutionTime ? `${avgResolutionTime.toFixed(1)} hrs` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="byType">
        <TabsList className="mb-4">
          <TabsTrigger value="byType">By Type</TabsTrigger>
          <TabsTrigger value="byStatus">By Status</TabsTrigger>
          <TabsTrigger value="byStudent">By Student</TabsTrigger>
          <TabsTrigger value="overtime">Over Time</TabsTrigger>
        </TabsList>
        
        <TabsContent value="byType">
          <Card>
            <CardHeader>
              <CardTitle>Reports by Type</CardTitle>
              <CardDescription>Distribution of incident types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="byStatus">
          <Card>
            <CardHeader>
              <CardTitle>Reports by Status</CardTitle>
              <CardDescription>Current status of all reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'Pending' ? '#FFBB28' : 
                              entry.name === 'Resolved' ? '#00C49F' : 
                              entry.name === 'Escalated' ? '#FF8042' : 
                              COLORS[index % COLORS.length]
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="byStudent">
          <Card>
            <CardHeader>
              <CardTitle>Top Students by Incident Count</CardTitle>
              <CardDescription>Students with most incident reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {studentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={studentData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#4F46E5" name="Incident Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overtime">
          <Card>
            <CardHeader>
              <CardTitle>Reports Over Time</CardTitle>
              <CardDescription>Incident trend over {timeFrame}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#4F46E5" 
                        activeDot={{ r: 8 }} 
                        name="Incident Count" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to format incident types
function formatIncidentType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
}