import { Route, Switch, useLocation } from 'wouter';
import { IncidentReportProvider, useIncidentReports } from '@/hooks/incident-report-context';
import IncidentReportsList from '@/components/incidents/IncidentReportsList';
import IncidentReportForm from '@/components/incidents/IncidentReportForm';
import IncidentReportDetail from '@/components/incidents/IncidentReportDetail';
import { IncidentReportFilters, IncidentReportAnalytics } from '@/components/incidents/IncidentReportFilters';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function IncidentReportPage() {
  return (
    <IncidentReportProvider>
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
    </IncidentReportProvider>
  );
}

function IncidentReportsListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Incident Reports</h1>
      </div>
      
      <IncidentReportFilters />
      
      {isAdmin && <IncidentReportAnalytics />}
      
      <IncidentReportsList />
    </>
  );
}

function NewIncidentReportPage() {
  const [, navigate] = useLocation();
  
  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Incident Report</h1>
      </div>
      
      <IncidentReportForm onSuccess={() => navigate('/incidents')} />
    </>
  );
}

function IncidentReportDetailPage({ id }: { id: number }) {
  const [, navigate] = useLocation();
  
  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Incident Report Details</h1>
      </div>
      
      <IncidentReportDetail id={id} />
    </>
  );
}

function EditIncidentReportPage({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { getReportById, isLoading } = useIncidentReports();
  
  const report = getReportById(id);
  
  if (isLoading) {
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
  
  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Incident Report</h1>
      </div>
      
      <IncidentReportForm 
        report={report} 
        onSuccess={() => navigate(`/incidents/${id}`)} 
      />
    </>
  );
}

