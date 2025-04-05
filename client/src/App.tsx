import React, { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Dialog } from "@/components/ui/dialog";
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
import DebugPage from "@/pages/debug-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { CelebrationProvider } from "./hooks/use-celebration";
import AppHeader from "@/components/ui/AppHeader";
import MobileNavbar from "@/components/layout/MobileNavbar";
import AwardPointsModal from "@/components/modals/AwardPointsModal";
import DeductPointsModal from "@/components/modals/DeductPointsModal";

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
      <ProtectedRoute 
        path="/debug" 
        component={DebugPage}
        allowedRoles={["admin"]}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const [awardPointsOpen, setAwardPointsOpen] = useState(false);
  const [deductPointsOpen, setDeductPointsOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Don't show the global header on certain pages that have their own custom headers
  const hideGlobalHeader = 
    location.startsWith('/points') || 
    location === '/profile' || 
    location === '/change-password';
  
  // Set up event listeners for the custom events from StudentDetail component
  useEffect(() => {
    const handleAwardPointsModal = (event: Event) => {
      const customEvent = event as CustomEvent<{studentId: number}>;
      setSelectedStudentId(customEvent.detail.studentId.toString());
      setAwardPointsOpen(true);
    };
    
    const handleDeductPointsModal = (event: Event) => {
      const customEvent = event as CustomEvent<{studentId: number}>;
      setSelectedStudentId(customEvent.detail.studentId.toString());
      setDeductPointsOpen(true);
    };
    
    // Add the event listeners
    window.addEventListener('open-award-points-modal', handleAwardPointsModal);
    window.addEventListener('open-deduct-points-modal', handleDeductPointsModal);
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('open-award-points-modal', handleAwardPointsModal);
      window.removeEventListener('open-deduct-points-modal', handleDeductPointsModal);
    };
  }, []);
  
  // Don't show mobile navigation on auth page
  const hideMobileNav = location.startsWith('/auth');

  return (
    <AuthProvider>
      <CelebrationProvider>
        <div className="app-container">
          {!hideGlobalHeader && <AppHeader />}
          <div className="app-content pb-16 md:pb-0">
            <Router />
          </div>
          
          {/* Mobile Navigation Bar */}
          {!hideMobileNav && <MobileNavbar />}
          
          {/* Modals for awarding and deducting points */}
          <Dialog open={awardPointsOpen} onOpenChange={setAwardPointsOpen}>
            <AwardPointsModal 
              onClose={() => setAwardPointsOpen(false)} 
              preSelectedStudentId={selectedStudentId}
            />
          </Dialog>
          
          <Dialog open={deductPointsOpen} onOpenChange={setDeductPointsOpen}>
            <DeductPointsModal 
              onClose={() => setDeductPointsOpen(false)} 
              preSelectedStudentId={selectedStudentId}
            />
          </Dialog>
          
          <Toaster />
        </div>
      </CelebrationProvider>
    </AuthProvider>
  );
}

export default App;
