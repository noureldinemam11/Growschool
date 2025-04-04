import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import StudentPage from "@/pages/student-page";
import HousePage from "@/pages/house-page";
import RewardsPage from "@/pages/rewards-page";
import ReportsPage from "@/pages/reports-page";
import AdminPage from "@/pages/admin-page";
import PointsPage from "@/pages/points-page";
import ProfilePage from "@/pages/profile-page";
import ChangePasswordPage from "@/pages/change-password-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { CelebrationProvider } from "./hooks/use-celebration";
import AppHeader from "@/components/ui/AppHeader";

// Redirect component for simple routes
function Redirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  React.useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  return <div className="redirect-component"></div>;
}

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
        path="/student" 
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
        path="/house-points" 
        component={() => <Redirect to="/house/dashboard" />} 
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
        path="/points" 
        component={PointsPage}
        allowedRoles={["admin", "teacher"]}
      />
      <ProtectedRoute 
        path="/points/categories" 
        component={PointsPage}
        allowedRoles={["admin", "teacher"]}
      />
      <ProtectedRoute 
        path="/profile" 
        component={ProfilePage}
      />
      <ProtectedRoute 
        path="/change-password" 
        component={ChangePasswordPage}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  
  // Don't show the global header on certain pages that have their own custom headers
  const hideGlobalHeader = 
    location.startsWith('/points') || 
    location === '/profile' || 
    location === '/change-password';
  
  return (
    <AuthProvider>
      <CelebrationProvider>
        <div className="app-container">
          {!hideGlobalHeader && <AppHeader />}
          <div className="app-content">
            <Router />
          </div>
          <Toaster />
        </div>
      </CelebrationProvider>
    </AuthProvider>
  );
}

export default App;
