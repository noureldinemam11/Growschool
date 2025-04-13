import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { useIncidentReports } from '@/hooks/incident-report-context';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileWarning, 
  Users 
} from 'lucide-react';

export default function IncidentReportDashboard() {
  const { reports, isLoading } = useIncidentReports();

  // Calculate statistics based on the actual status values from schema
  const totalIncidents = reports.length;
  const pendingIncidents = reports.filter(report => report.status === 'pending').length;
  const resolvedIncidents = reports.filter(report => report.status === 'resolved').length;
  const escalatedIncidents = reports.filter(report => report.status === 'escalated').length;
  
  // Count unique students involved in incidents
  const uniqueStudentIds = new Set();
  reports.forEach(report => {
    report.studentIds.forEach(id => uniqueStudentIds.add(id));
  });
  const uniqueStudentsCount = uniqueStudentIds.size;

  // Count incidents by type
  const incidentsByType = reports.reduce((acc, report) => {
    acc[report.type] = (acc[report.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find most common incident type
  let mostCommonType = '';
  let mostCommonCount = 0;
  Object.entries(incidentsByType).forEach(([type, count]) => {
    if (count > mostCommonCount) {
      mostCommonCount = count;
      mostCommonType = type;
    }
  });

  const formatIncidentType = (type: string) => {
    return type ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') : 'None';
  };

  const statCards = [
    {
      title: 'Total Incidents',
      value: totalIncidents,
      icon: <FileWarning className="h-5 w-5 text-amber-500" />,
      color: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-700'
    },
    {
      title: 'Pending',
      value: pendingIncidents,
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-700'
    },
    {
      title: 'Escalated',
      value: escalatedIncidents,
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      title: 'Resolved',
      value: resolvedIncidents,
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700'
    },
    {
      title: 'Students Involved',
      value: uniqueStudentsCount,
      icon: <Users className="h-5 w-5 text-purple-500" />,
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700'
    },
    {
      title: 'Most Common',
      value: mostCommonCount,
      label: formatIncidentType(mostCommonType),
      icon: <FileWarning className="h-5 w-5 text-indigo-500" />,
      color: 'bg-indigo-50 border-indigo-200',
      textColor: 'text-indigo-700'
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array(6).fill(0).map((_, index) => (
          <Card key={index} className="border border-muted h-24 animate-pulse">
            <CardContent className="p-3">
              <div className="bg-muted h-4 w-20 rounded mb-3"></div>
              <div className="bg-muted h-7 w-12 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statCards.map((card, index) => (
        <Card key={index} className={`border ${card.color}`}>
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              {card.icon}
            </div>
            <div className={`mt-2 text-2xl font-bold ${card.textColor}`}>
              {card.value}
            </div>
            {card.label && (
              <div className="text-xs text-muted-foreground mt-1">
                {card.label}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}