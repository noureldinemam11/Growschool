import { Route, Switch, useLocation } from 'wouter';
import { IncidentReportProvider, useIncidentReports } from '@/hooks/incident-report-context';
import IncidentReportsList from '@/components/incidents/IncidentReportsList';
import IncidentReportForm from '@/components/incidents/IncidentReportForm';
import IncidentReportDetail from '@/components/incidents/IncidentReportDetail';
import IncidentReportAnalytics from '@/components/incidents/IncidentReportAnalytics';
import IncidentReportDashboard from '@/components/incidents/IncidentReportDashboard';
import IncidentReportFilters from '@/components/incidents/IncidentReportFilters';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, BarChart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function IncidentReportPage() {
  return (
    <IncidentReportProvider>
      <div className="container mx-auto py-6 space-y-6">
        <Switch>
          <Route path="/incidents" component={IncidentReportsListPage} />
          <Route path="/incidents/analytics" component={IncidentReportAnalyticsPage} />
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
  const [, navigate] = useLocation();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Incident Reports</h1>
        
        <div className="flex space-x-2">
          {isAdmin && (
            <Button 
              variant="outline"
              onClick={() => navigate('/incidents/analytics')}
              className="gap-2"
            >
              <BarChart className="h-4 w-4" />
              Analytics
            </Button>
          )}
          <Button 
            onClick={() => navigate('/incidents/new')}
          >
            New Report
          </Button>
        </div>
      </div>
      
      {/* Dashboard Statistics */}
      <IncidentReportDashboard />
      
      {/* Filters */}
      <IncidentReportFilters />
      
      {/* Reports Table */}
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

function IncidentReportAnalyticsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  if (!isAdmin) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          You do not have permission to view analytics.
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
        <h1 className="text-3xl font-bold tracking-tight">Incident Report Analytics</h1>
      </div>
      
      <IncidentReportAnalytics />
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

