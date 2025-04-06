import { useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import IncidentReportsList from '@/components/incidents/IncidentReportsList';
import IncidentReportForm from '@/components/incidents/IncidentReportForm';
import IncidentReportDetail from '@/components/incidents/IncidentReportDetail';
import { useIncidentReport } from '@/hooks/use-incident-reports';
import { useUsers } from '../hooks/use-users';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/use-auth';

export default function IncidentReportPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Switch>
        <Route path="/incidents" component={IncidentReportsListPage} />
        <Route path="/incidents/new" component={NewIncidentReportPage} />
        <Route path="/incidents/:id">
          {(params) => <IncidentReportDetailPage id={parseInt(params.id)} />}
        </Route>
        <Route path="/incidents/:id/edit">
          {(params) => <EditIncidentReportPage id={parseInt(params.id)} />}
        </Route>
      </Switch>
    </div>
  );
}

function IncidentReportsListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState("all");

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Incident Reports</h1>
      </div>
      
      {isAdmin && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">All Incidents</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            <IncidentReportsList />
          </TabsContent>
          <TabsContent value="pending" className="mt-6">
            {/* Future implementation: filtered incident reports */}
            <IncidentReportsList />
          </TabsContent>
        </Tabs>
      )}
      
      {!isAdmin && <IncidentReportsList />}
    </>
  );
}

function NewIncidentReportPage() {
  const [, navigate] = useLocation();
  const { data: students, isLoading } = useUsers('student');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Incident Report</h1>
      </div>
      
      <IncidentReportForm 
        students={students || []} 
        onSuccess={() => navigate('/incidents')}
      />
    </>
  );
}

function IncidentReportDetailPage({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { data: students, isLoading: isStudentsLoading } = useUsers('student');

  if (isStudentsLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Incident Report Details</h1>
      </div>
      
      <IncidentReportDetail id={id} students={students || []} />
    </>
  );
}

function EditIncidentReportPage({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { data: report, isLoading } = useIncidentReport(id);
  const { data: students, isLoading: isStudentsLoading } = useUsers('student');

  if (isLoading || isStudentsLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The incident report you're trying to edit doesn't exist.
        </p>
        <Button onClick={() => navigate('/incidents')}>
          Back to Incident Reports
        </Button>
      </div>
    );
  }

  // In the future, implement an edit form component here
  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Incident Report</h1>
      </div>
      
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">Edit Functionality Coming Soon</h2>
        <p className="text-muted-foreground mb-4">
          The ability to edit incident reports is currently under development.
        </p>
        <Button onClick={() => navigate(`/incidents/${id}`)}>
          View Report Details
        </Button>
      </div>
    </>
  );
}