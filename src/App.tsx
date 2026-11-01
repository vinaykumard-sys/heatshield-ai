import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';

// Layouts & Guards
import { PublicLayout } from './components/layout/PublicLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';

// Protected Pages
import { DashboardPage } from './pages/DashboardPage';
import { HeatRiskMapPage } from './pages/HeatRiskMapPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { CoolingCentresPage } from './pages/CoolingCentresPage';
import { ResidentsPage } from './pages/ResidentsPage';
import { CheckinsPage } from './pages/CheckinsPage';
import { RequestsPage } from './pages/RequestsPage';
import { AssistantPage } from './pages/AssistantPage';
import { HeatSimulatorPage } from './pages/HeatSimulatorPage';
import { ResidentPortalPage } from './pages/ResidentPortalPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';

import { useAuth } from './context/AuthContext';

// Gatekeeper for root path: User MUST log in first before accessing the platform
const RootRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

export function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <LocationProvider>
              <Routes>
                {/* Entry route: forces login first */}
                <Route path="/" element={<RootRoute />} />

                {/* Public Authentication & Policy Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicLayout>
                      <AuthPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicLayout>
                      <AuthPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/auth"
                  element={
                    <PublicLayout>
                      <AuthPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/landing"
                  element={
                    <PublicLayout>
                      <LandingPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <PublicLayout>
                      <PrivacyPolicyPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <PublicLayout>
                      <TermsPage />
                    </PublicLayout>
                  }
                />

                {/* Protected Application Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <ProtectedRoute>
                      <HeatRiskMapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/heat-map"
                  element={
                    <ProtectedRoute>
                      <HeatRiskMapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/predictions"
                  element={
                    <ProtectedRoute>
                      <PredictionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cooling-centres"
                  element={
                    <ProtectedRoute>
                      <CoolingCentresPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/residents"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
                      <ResidentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkins"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
                      <CheckinsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/welfare-checkins"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
                      <CheckinsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/requests"
                  element={
                    <ProtectedRoute>
                      <RequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assistant"
                  element={
                    <ProtectedRoute>
                      <AssistantPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/heat-simulator"
                  element={
                    <ProtectedRoute>
                      <HeatSimulatorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <AlertsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal"
                  element={
                    <ProtectedRoute>
                      <ResidentPortalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPanelPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AdminPanelPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </LocationProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
