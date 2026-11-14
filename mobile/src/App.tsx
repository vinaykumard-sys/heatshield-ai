import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

import DashboardScreen from './screens/DashboardScreen';
import WeatherScreen from './screens/WeatherScreen';
import SafeRouteScreen from './screens/SafeRouteScreen';
import AssistanceScreen from './screens/AssistanceScreen';
import SOSScreen from './screens/SOSScreen';
import AssistantScreen from './screens/AssistantScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';
import MandatoryUpdateModal from './components/MandatoryUpdateModal';
import NotificationPermissionModal from './components/NotificationPermissionModal';

import { supabase } from './services/supabase';
import {
  checkAppVersion,
  getInstalledVersion,
  clearVersionCache,
  CURRENT_APP_VERSION,
  VersionCheckResult,
} from './services/versionService';
import {
  configureAndroidNotificationChannels,
  checkNotificationPermission,
  setupNotificationListeners,
} from './services/pushNotificationService';
import { LOCALITIES } from './data/mockData';
import { Locality } from './types';

export type Tab = 'dashboard' | 'weather' | 'routes' | 'assistance' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedLocality, setSelectedLocality] = useState<Locality>(LOCALITIES[0]);

  // Sub-screens & modals
  const [showAssistantModal, setShowAssistantModal] = useState<boolean>(false);
  const [assistanceSubView, setAssistanceSubView] = useState<'assistance' | 'sos'>('assistance');

  // Mandatory App Update State & Session Dismissal Flag
  const [updateResult, setUpdateResult] = useState<VersionCheckResult | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem('hs_update_dismissed') === 'true';
      }
    } catch (e) {}
    return false;
  });

  const handleDismissUpdate = useCallback(() => {
    setUpdateDismissed(true);
    setUpdateResult(null);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('hs_update_dismissed', 'true');
      }
    } catch (e) {}
  }, []);

  // Authentication State - Login First! Zero mock bypass
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Notification Permission Modal
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  // 1. Mandatory Update Verification (Lifecycle & Recheck Engine)
  const runVersionCheck = useCallback(async (force: boolean = false): Promise<boolean> => {
    try {
      if (force) {
        clearVersionCache();
      }
      const installed = getInstalledVersion();
      const result = await checkAppVersion(installed, force);
      if (result.needsUpdate) {
        setUpdateResult(result);
        return false;
      } else {
        // App is up to date! Close the update screen and resume normal operations
        setUpdateResult(null);
        setUpdateDismissed(true);
        return true;
      }
    } catch (err) {
      console.warn('[App] Version check failed (offline or network error):', err);
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial verification on startup
    runVersionCheck();

    // Re-verify automatically when app/window returns from background or installer
    const handleResume = () => {
      runVersionCheck(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleResume);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          handleResume();
        }
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleResume);
      }
    };
  }, [runVersionCheck]);

  // 2. Real Supabase Session Lifecycle (Login-first with zero bypass)
  useEffect(() => {
    let isMounted = true;

    // Process deep link or OAuth query/hash parameters if returned to app
    if (typeof window !== 'undefined') {
      try {
        const search = window.location.search || '';
        const hash = window.location.hash || '';

        if (search.includes('code=')) {
          const params = new URLSearchParams(search);
          const code = params.get('code');
          if (code) {
            supabase.auth.exchangeCodeForSession(code)
              .then(({ data }) => {
                if (isMounted && data?.session) {
                  setSession(data.session);
                  setAuthLoading(false);
                }
              })
              .catch(console.warn);
          }
        } else if (hash.includes('access_token=')) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          if (access_token && refresh_token) {
            supabase.auth.setSession({ access_token, refresh_token })
              .then(({ data }) => {
                if (isMounted && data?.session) {
                  setSession(data.session);
                  setAuthLoading(false);
                }
              })
              .catch(console.warn);
          }
        }
      } catch (e) {
        console.warn('[App] OAuth param check error:', e);
      }
    }

    // Fetch initial session
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        if (isMounted) {
          setSession(initialSession);
          setAuthLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[App] Failed to fetch Supabase session:', err);
        if (isMounted) {
          setSession(null);
          setAuthLoading(false);
        }
      });

    // Subscribe to auth state updates (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 3. Android Push Notification Channels & Listeners (only once authenticated)
  useEffect(() => {
    if (!session) return;

    // Configure notification channels
    configureAndroidNotificationChannels().catch((err) =>
      console.warn('[App] Failed to configure notification channels:', err)
    );

    // Setup foreground listeners
    const unsubscribeListeners = setupNotificationListeners(
      (notification) => {
        console.log('[App] Received push notification:', notification.request.content.title);
      },
      (response) => {
        const data = response?.notification?.request?.content?.data;
        if (data?.channelId === 'safe-routes' || data?.type === 'SAFE_ROUTE') {
          setActiveTab('routes');
        } else if (data?.channelId === 'emergency-sos' || data?.type === 'EMERGENCY_SOS') {
          setAssistanceSubView('sos');
          setActiveTab('assistance');
        } else if (data?.channelId === 'weather-briefings' || data?.type === 'WEATHER_BRIEFING') {
          setActiveTab('weather');
        } else if (data?.type === 'HEATWAVE_ALERT' || data?.channelId === 'heat-alerts') {
          setActiveTab('dashboard');
        }
      }
    );

    // Prompt user with friendly modal if permission is not yet decided
    const checkInitialPermission = async () => {
      const granted = await checkNotificationPermission();
      if (!granted) {
        setTimeout(() => {
          setShowPermissionModal(true);
        }, 1200);
      }
    };

    checkInitialPermission();

    return () => {
      if (unsubscribeListeners) {
        unsubscribeListeners();
      }
    };
  }, [session]);

  // Loading Splash Screen while checking Supabase auth
  if (authLoading) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <StatusBar style="dark" backgroundColor="#F0F6FF" />
        <View style={styles.splashContent}>
          <View style={styles.splashIconCircle}>
            <MaterialCommunityIcons name="shield-sun" size={54} color="#0284C7" />
          </View>
          <Text style={styles.splashTitle}>HEATSHIELD AI</Text>
          <Text style={styles.splashSub}>Urban Heat Safety & Defense</Text>
          <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Not authenticated -> Render Login/Signup screen (ZERO mock resident bypass!)
  if (!session) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar style="dark" backgroundColor="#F0F6FF" />
        <AuthScreen
          onAuthSuccess={(newSession) => {
            setSession(newSession);
          }}
        />

        {/* Mandatory Update Modal is displayed over AuthScreen if update is required */}
        {updateResult && updateResult.needsUpdate && !updateDismissed && (
          <MandatoryUpdateModal
            visible={true}
            installedVersion={updateResult.installedVersion}
            requiredVersion={updateResult.minimumRequiredVersion}
            downloadUrl={updateResult.downloadUrl}
            onCheckAgain={() => runVersionCheck(true)}
            onDismiss={handleDismissUpdate}
          />
        )}
      </SafeAreaView>
    );
  }

  // Authenticated Resident/Officer -> Main Tab Navigation (Home, Weather, Safe Route, Alerts & Aid, Profile)
  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" backgroundColor="#F0F6FF" />

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            selectedLocality={selectedLocality}
            onSelectLocality={setSelectedLocality}
            onNavigateToWeather={() => setActiveTab('weather')}
            onNavigateToRoute={() => setActiveTab('routes')}
            onNavigateToSOS={() => {
              setAssistanceSubView('sos');
              setActiveTab('assistance');
            }}
            onNavigateToAssistance={() => {
              setAssistanceSubView('assistance');
              setActiveTab('assistance');
            }}
            onNavigateToAssistant={() => setShowAssistantModal(true)}
            onNavigateToProfile={() => setActiveTab('profile')}
            user={session?.user}
            userEmail={session?.user?.email}
            onLogout={async () => {
              try {
                await supabase.auth.signOut();
              } catch (e) {}
              setSession(null);
            }}
          />
        )}

        {activeTab === 'weather' && (
          <WeatherScreen
            selectedLocality={selectedLocality}
            onSelectLocality={setSelectedLocality}
            onNavigateToRoute={() => setActiveTab('routes')}
            onNavigateToSOS={() => {
              setAssistanceSubView('sos');
              setActiveTab('assistance');
            }}
          />
        )}

        {activeTab === 'routes' && <SafeRouteScreen />}

        {activeTab === 'assistance' && (
          <View style={{ flex: 1 }}>
            {/* Top Sub-Navigation Toggle for Alerts & Assistance Tab */}
            <View style={styles.subTabHeader}>
              <TouchableOpacity
                style={[
                  styles.subTabButton,
                  assistanceSubView === 'assistance' && styles.subTabButtonActive,
                ]}
                onPress={() => setAssistanceSubView('assistance')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="hand-heart"
                  size={16}
                  color={assistanceSubView === 'assistance' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.subTabText,
                    assistanceSubView === 'assistance' && styles.subTabTextActive,
                  ]}
                >
                  Field Relief Aid
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabButton,
                  assistanceSubView === 'sos' && styles.subTabButtonActiveSOS,
                ]}
                onPress={() => setAssistanceSubView('sos')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="alert-octagon"
                  size={16}
                  color={assistanceSubView === 'sos' ? '#DC2626' : '#64748B'}
                />
                <Text
                  style={[
                    styles.subTabText,
                    assistanceSubView === 'sos' && styles.subTabTextActiveSOS,
                  ]}
                >
                  Emergency SOS
                </Text>
              </TouchableOpacity>
            </View>

            {assistanceSubView === 'assistance' ? (
              <AssistanceScreen
                selectedLocality={selectedLocality}
                onBack={() => setAssistanceSubView('sos')}
              />
            ) : (
              <SOSScreen
                selectedLocality={selectedLocality}
                onNavigateToAssistance={() => setAssistanceSubView('assistance')}
              />
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            user={session?.user}
            userEmail={session?.user?.email}
            onLogout={async () => {
              try {
                await supabase.auth.signOut();
              } catch (e) {}
              setSession(null);
            }}
          />
        )}
      </View>

      {/* AI Assistant Modal Overlay */}
      <Modal
        visible={showAssistantModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAssistantModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F0F6FF' }}>
          <AssistantScreen
            selectedLocality={selectedLocality}
            onBack={() => setShowAssistantModal(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Mandatory App Update Modal (Blocking & Non-dismissible) */}
      {updateResult && updateResult.needsUpdate && !updateDismissed && (
        <MandatoryUpdateModal
          visible={true}
          installedVersion={updateResult.installedVersion}
          requiredVersion={updateResult.minimumRequiredVersion}
          downloadUrl={updateResult.downloadUrl}
          onCheckAgain={() => runVersionCheck(true)}
          onDismiss={handleDismissUpdate}
        />
      )}

      {/* Friendly Notification Permission Modal */}
      <NotificationPermissionModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionGranted={(token) => {
          console.log('[App] Push token registered successfully:', token);
          setShowPermissionModal(false);
        }}
        userId={session?.user?.id}
      />

      {/* Native Bottom Tab Bar: Home | Weather | Safe Route | Alerts / Assistance | Profile */}
      <View style={styles.tabBar}>
        {/* 1. Home / Dashboard */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.tabIconWrap,
              activeTab === 'dashboard' && styles.tabIconWrapActive,
            ]}
          >
            <Ionicons
              name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
              size={20}
              color={activeTab === 'dashboard' ? '#0284C7' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'dashboard' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Weather */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('weather')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.tabIconWrap,
              activeTab === 'weather' && styles.tabIconWrapActive,
            ]}
          >
            <Ionicons
              name={activeTab === 'weather' ? 'partly-sunny' : 'partly-sunny-outline'}
              size={21}
              color={activeTab === 'weather' ? '#0284C7' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'weather' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Weather
          </Text>
        </TouchableOpacity>

        {/* 3. Safe Route */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('routes')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.tabIconWrap,
              activeTab === 'routes' && styles.tabIconWrapActiveGreen,
            ]}
          >
            <MaterialCommunityIcons
              name="map-marker-path"
              size={21}
              color={activeTab === 'routes' ? '#059669' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'routes'
                ? { color: '#059669', fontWeight: '700' }
                : styles.tabLabelInactive,
            ]}
          >
            Safe Route
          </Text>
        </TouchableOpacity>

        {/* 4. Alerts / Assistance */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('assistance')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.tabIconWrap,
              activeTab === 'assistance' && styles.tabIconWrapActiveAlert,
            ]}
          >
            <MaterialCommunityIcons
              name={activeTab === 'assistance' ? 'shield-alert' : 'shield-alert-outline'}
              size={21}
              color={activeTab === 'assistance' ? '#EA580C' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'assistance'
                ? { color: '#EA580C', fontWeight: '700' }
                : styles.tabLabelInactive,
            ]}
          >
            Alerts & Aid
          </Text>
        </TouchableOpacity>

        {/* 5. Profile */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.tabIconWrap,
              activeTab === 'profile' && styles.tabIconWrapActive,
            ]}
          >
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={20}
              color={activeTab === 'profile' ? '#0284C7' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'profile' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#F0F6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E0F2FE',
    borderWidth: 2,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  splashSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  screenContainer: {
    flex: 1,
  },
  subTabHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  subTabButtonActive: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  subTabButtonActiveSOS: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  subTabTextActiveSOS: {
    color: '#DC2626',
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabIconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: '#E0F2FE',
  },
  tabIconWrapActiveGreen: {
    backgroundColor: '#ECFDF5',
  },
  tabIconWrapActiveAlert: {
    backgroundColor: '#FFF7ED',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#64748B',
    fontWeight: '500',
  },
});
