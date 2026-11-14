import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';

// Mandatory Version Update System
import { checkAppVersion, VersionCheckResult } from './lib/versionService';
import { MandatoryUpdateModal } from './components/common/MandatoryUpdateModal';

// Layouts & Guards
import { PublicLayout } from './components/layout/PublicLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
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

// Platform Expansion Pages
import { HeatAlertsPage } from './pages/HeatAlertsPage';
import { WaterStationsPage } from './pages/WaterStationsPage';
import { WorkerSafetyPage } from './pages/WorkerSafetyPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { CommandCentrePage } from './pages/CommandCentrePage';
import { SafeRoutesPage } from './pages/SafeRoutesPage';
import { HeatSafePlannerPage } from './pages/HeatSafePlannerPage';
import { FamilySafetyPage } from './pages/FamilySafetyPage';
import { SchoolSafetyPage } from './pages/SchoolSafetyPage';
import { HospitalDirectoryPage } from './pages/HospitalDirectoryPage';
import { PersonalizedResidentDashboardPage } from './pages/PersonalizedResidentDashboardPage';
import { ImpactDashboardPage } from './pages/ImpactDashboardPage';
import { HeatAcademyPage } from './pages/HeatAcademyPage';
import { OfflineEmergencyPage } from './pages/OfflineEmergencyPage';
import { MyAccountPage } from './pages/MyAccountPage';
import { HelpHubPage } from './pages/HelpHubPage';
import { MySafetyHubPage } from './pages/MySafetyHubPage';
import { DeveloperDiagnosticsPage } from './pages/DeveloperDiagnosticsPage';
import { WhatsAppGatewayPage } from './pages/WhatsAppGatewayPage';

import { useAuth } from './context/AuthContext';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Dynamic Settings Route: Admin panel for administrators, Account & Preferences for residents/volunteers
const SettingsRoute: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminPanelPage /> : <MyAccountPage />;
};

// Root route: Check authentication before routing
const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // If OAuth callback parameters arrive at root, route directly to /auth/callback
  if (
    location.search.includes('code=') ||
    location.search.includes('error=') ||
    location.hash.includes('access_token=') ||
    location.hash.includes('error=')
  ) {
    return <Navigate to={`/auth/callback${location.search}${location.hash}`} replace />;
  }

  if (isLoading) return <LoadingSpinner />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export function App() {
  const [updateInfo, setUpdateInfo] = useState<VersionCheckResult | null>(null);

  useEffect(() => {
    let mounted = true;

    const runVersionCheck = async () => {
      try {
        const result = await checkAppVersion();
        if (mounted) {
          if (result.isOutdated) {
            setUpdateInfo(result);
          } else {
            setUpdateInfo(null);
          }
        }
      } catch (err) {
        console.warn('[HeatShield] Version check failed:', err);
      }
    };

    // Immediate check on app startup
    runVersionCheck();

    // Periodic check every 10 minutes and on window focus / resume
    const intervalId = setInterval(runVersionCheck, 10 * 60 * 1000);
    const onFocus = () => runVersionCheck();
    window.addEventListener('focus', onFocus);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <BrowserRouter>
      {/* Global Mandatory Blocking Modal for Outdated Client Versions */}
      <MandatoryUpdateModal
        isOpen={Boolean(updateInfo?.isOutdated)}
        updateInfo={updateInfo}
      />
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
                  path="/auth/callback"
                  element={<AuthCallbackPage />}
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
                      <SettingsRoute />
                    </ProtectedRoute>
                  }
                />

                {/* Platform Expansion Routes */}
                <Route
                  path="/heat-alerts"
                  element={
                    <ProtectedRoute>
                      <HeatAlertsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/water-stations"
                  element={
                    <ProtectedRoute>
                      <WaterStationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/worker-safety"
                  element={
                    <ProtectedRoute>
                      <WorkerSafetyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organization"
                  element={
                    <ProtectedRoute>
                      <OrganizationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organisation"
                  element={
                    <ProtectedRoute>
                      <OrganizationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command-centre"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <CommandCentrePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/safe-routes"
                  element={
                    <ProtectedRoute>
                      <SafeRoutesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/safe-route"
                  element={
                    <ProtectedRoute>
                      <SafeRoutesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/heat-safe-planner"
                  element={
                    <ProtectedRoute>
                      <HeatSafePlannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/planner"
                  element={
                    <ProtectedRoute>
                      <HeatSafePlannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/family-safety"
                  element={
                    <ProtectedRoute>
                      <FamilySafetyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/school-safety"
                  element={
                    <ProtectedRoute>
                      <SchoolSafetyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hospital-directory"
                  element={
                    <ProtectedRoute>
                      <HospitalDirectoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/developer"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DeveloperDiagnosticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/diagnostics"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DeveloperDiagnosticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <MyAccountPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/help"
                  element={
                    <ProtectedRoute>
                      <HelpHubPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-safety"
                  element={
                    <ProtectedRoute>
                      <MySafetyHubPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/explore"
                  element={
                    <ProtectedRoute>
                      <HeatRiskMapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts-assistance"
                  element={
                    <ProtectedRoute>
                      <AlertsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resident-dashboard"
                  element={
                    <ProtectedRoute>
                      <PersonalizedResidentDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/impact-dashboard"
                  element={
                    <ProtectedRoute>
                      <ImpactDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academy"
                  element={
                    <ProtectedRoute>
                      <HeatAcademyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/offline-emergency"
                  element={
                    <ProtectedRoute>
                      <OfflineEmergencyPage />
                    </ProtectedRoute>
                  }
                />

                {/* WhatsApp Gateway & Scanner (Admin-only) */}
                <Route
                  path="/whatsapp"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <WhatsAppGatewayPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/whatsapp-gateway"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <WhatsAppGatewayPage />
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
