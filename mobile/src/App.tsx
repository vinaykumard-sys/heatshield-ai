import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

import DashboardScreen from './screens/DashboardScreen';
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

type Tab = 'dashboard' | 'routes' | 'sos' | 'assistant' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedLocality, setSelectedLocality] = useState<Locality>(LOCALITIES[0]);

  // Mandatory App Update State
  const [updateResult, setUpdateResult] = useState<VersionCheckResult | null>(null);

  // Authentication State - Login First! Zero mock bypass
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Notification Permission Modal
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  // 1. Mandatory Update Check on startup
  useEffect(() => {
    let isMounted = true;
    const verifyAppVersion = async () => {
      try {
        const result = await checkAppVersion(CURRENT_APP_VERSION);
        if (isMounted && result.needsUpdate) {
          setUpdateResult(result);
        }
      } catch (err) {
        console.warn('[App] Version check failed (offline or network error):', err);
      }
    };

    verifyAppVersion();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Real Supabase Session Lifecycle (Login-first with zero bypass)
  useEffect(() => {
    let isMounted = true;

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

  // Loading Screen while checking Supabase auth
  if (authLoading) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <StatusBar style="light" backgroundColor="#060D1E" />
        <View style={styles.splashContent}>
          <View style={styles.splashIconCircle}>
            <MaterialCommunityIcons name="shield-sun" size={54} color="#06B6D4" />
          </View>
          <Text style={styles.splashTitle}>HEATSHIELD AI</Text>
          <Text style={styles.splashSub}>Urban Heat Safety & Defense</Text>
          <ActivityIndicator size="large" color="#06B6D4" style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Not authenticated -> Render Login/Signup screen (ZERO mock resident bypass!)
  if (!session) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar style="light" backgroundColor="#060D1E" />
        <AuthScreen
          onAuthSuccess={(newSession) => {
            setSession(newSession);
          }}
        />

        {/* Mandatory Update Modal is displayed over AuthScreen if update is required */}
        {updateResult && updateResult.needsUpdate && (
          <MandatoryUpdateModal
            visible={true}
            installedVersion={updateResult.installedVersion}
            requiredVersion={updateResult.minimumRequiredVersion}
            downloadUrl={updateResult.downloadUrl}
          />
        )}
      </SafeAreaView>
    );
  }

  // Authenticated Resident/Officer -> Main Tab Navigation
  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="light" backgroundColor="#0B1329" />

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            selectedLocality={selectedLocality}
            onSelectLocality={setSelectedLocality}
            onNavigateToWeather={() => setActiveTab('routes')}
            onNavigateToRoute={() => setActiveTab('routes')}
            onNavigateToSOS={() => setActiveTab('sos')}
            onNavigateToAssistance={() => setActiveTab('sos')}
            onNavigateToAssistant={() => setActiveTab('assistant')}
          />
        )}
        {activeTab === 'routes' && <SafeRouteScreen />}
        {activeTab === 'sos' && (
          <SOSScreen
            selectedLocality={selectedLocality}
            onNavigateToAssistance={() => setActiveTab('sos')}
          />
        )}
        {activeTab === 'assistant' && (
          <AssistantScreen selectedLocality={selectedLocality} />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen
            userEmail={session?.user?.email}
            onLogout={() => {
              setSession(null);
            }}
          />
        )}
      </View>

      {/* Mandatory App Update Modal (Blocking & Non-dismissible) */}
      {updateResult && updateResult.needsUpdate && (
        <MandatoryUpdateModal
          visible={true}
          installedVersion={updateResult.installedVersion}
          requiredVersion={updateResult.minimumRequiredVersion}
          downloadUrl={updateResult.downloadUrl}
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

      {/* Custom Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'speedometer' : 'speedometer-outline'}
            size={22}
            color={activeTab === 'dashboard' ? '#06B6D4' : '#64748B'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'dashboard' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('routes')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={activeTab === 'routes' ? 'map-marker-path' : 'map-marker-path'}
            size={22}
            color={activeTab === 'routes' ? '#10B981' : '#64748B'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'routes' ? { color: '#10B981', fontWeight: '700' } : styles.tabLabelInactive,
            ]}
          >
            Safe Route
          </Text>
        </TouchableOpacity>

        {/* SOS Central Raised Action */}
        <TouchableOpacity
          style={styles.sosTabItem}
          onPress={() => setActiveTab('sos')}
          activeOpacity={0.85}
        >
          <View style={[styles.sosButtonCircle, activeTab === 'sos' && styles.sosButtonCircleActive]}>
            <MaterialCommunityIcons name="alert-octagon" size={24} color="#FFF" />
          </View>
          <Text style={styles.sosTabLabel}>SOS Relief</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('assistant')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={activeTab === 'assistant' ? 'robot' : 'robot-outline'}
            size={22}
            color={activeTab === 'assistant' ? '#38BDF8' : '#64748B'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'assistant' ? { color: '#38BDF8', fontWeight: '700' } : styles.tabLabelInactive,
            ]}
          >
            AI Assistant
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Feather
            name="settings"
            size={20}
            color={activeTab === 'profile' ? '#F8FAFC' : '#64748B'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'profile' ? { color: '#F8FAFC', fontWeight: '700' } : styles.tabLabelInactive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#060D1E',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#060D1E',
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
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 2,
    borderColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
    marginBottom: 4,
  },
  splashSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#06B6D4',
    letterSpacing: 0.6,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0B1329',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  sosTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: -8,
  },
  sosButtonCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  sosButtonCircleActive: {
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  sosTabLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    marginTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#64748B',
    fontWeight: '500',
  },
});
