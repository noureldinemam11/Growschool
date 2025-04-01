import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import StudentPage from "@/pages/student-page";
import HousePage from "@/pages/house-page";
import RewardsPage from "@/pages/rewards-page";
import ReportsPage from "@/pages/reports-page";
import AdminPage from "@/pages/admin-page";
import RosterPage from "@/pages/roster-page";
import PointsPage from "@/pages/points-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import AppHeader from "@/components/ui/AppHeader";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute 
        path="/students" 
        component={StudentPage} 
        allowedRoles={["admin", "teacher"]}
      />
      <ProtectedRoute 
        path="/houses" 
        component={HousePage} 
      />
      <ProtectedRoute 
        path="/house" 
        component={HousePage} 
      />
      <ProtectedRoute 
        path="/house/dashboard" 
        component={HousePage} 
      />
      <ProtectedRoute 
        path="/house/posters" 
        component={HousePage} 
      />
      <ProtectedRoute 
        path="/house/setup" 
        component={HousePage} 
      />
      <ProtectedRoute 
        path="/house/options" 
        component={HousePage} 
      />
      <ProtectedRoute 
        path="/rewards" 
        component={RewardsPage}
      />
      <ProtectedRoute 
        path="/reports" 
        component={ReportsPage}
        allowedRoles={["admin", "teacher"]}
      />
      <ProtectedRoute 
        path="/admin" 
        component={AdminPage}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute 
        path="/roster" 
        component={RosterPage}
        allowedRoles={["admin", "teacher"]}
      />
      <ProtectedRoute 
        path="/points" 
        component={PointsPage}
        allowedRoles={["admin", "teacher"]}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <AppHeader />
        <div className="app-content">
          <Router />
        </div>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
