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
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <AuthProvider>
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
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
