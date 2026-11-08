import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

import DashboardScreen from './screens/DashboardScreen';
import SafeRouteScreen from './screens/SafeRouteScreen';
import AssistanceScreen from './screens/AssistanceScreen';
import AssistantScreen from './screens/AssistantScreen';
import ProfileScreen from './screens/ProfileScreen';

type Tab = 'dashboard' | 'routes' | 'sos' | 'assistant' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="light" backgroundColor="#0B1329" />

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            onNavigateToRoute={() => setActiveTab('routes')}
            onNavigateToSOS={() => setActiveTab('sos')}
          />
        )}
        {activeTab === 'routes' && <SafeRouteScreen />}
        {activeTab === 'sos' && <AssistanceScreen />}
        {activeTab === 'assistant' && <AssistantScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

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
