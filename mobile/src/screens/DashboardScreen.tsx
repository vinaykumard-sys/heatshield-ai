import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LOCALITIES, HOURLY_FORECASTS, WATER_POINTS } from '../data/mockData';
import { Locality } from '../types';
import { evaluateHeatSafety } from '../services/actionEngine';
import { supabase } from '../services/supabase';

interface Props {
  selectedLocality: Locality;
  onSelectLocality: (locality: Locality) => void;
  onNavigateToWeather: () => void;
  onNavigateToRoute: () => void;
  onNavigateToSOS: () => void;
  onNavigateToAssistance: () => void;
  onNavigateToAssistant: () => void;
  onNavigateToProfile?: () => void;
  user?: any;
  userEmail?: string | null;
  onLogout?: () => void;
}

export default function DashboardScreen({
  selectedLocality,
  onSelectLocality,
  onNavigateToWeather,
  onNavigateToRoute,
  onNavigateToSOS,
  onNavigateToAssistance,
  onNavigateToAssistant,
  onNavigateToProfile,
  user,
  userEmail,
  onLogout,
}: Props) {
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [profileSheetVisible, setProfileSheetVisible] = useState(false);

  // Dynamically derive authenticated user details
  const userMetadata = user?.user_metadata;
  const currentEmail = user?.email || userEmail || '';
  const displayName = userMetadata?.full_name || userMetadata?.name || (currentEmail ? currentEmail.split('@')[0] : 'Resident');
  const displayRole = userMetadata?.role === 'admin' ? 'Administrator' : 'Resident';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p: string) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'R';

  const handleLogout = () => {
    setProfileSheetVisible(false);
    Alert.alert(
      'Sign Out Confirmation',
      'Are you sure you want to sign out of HeatShield AI? Active emergency monitoring will continue locally.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (err) {
              console.warn('[DashboardScreen] Sign out notice:', err);
            } finally {
              if (onLogout) {
                onLogout();
              }
            }
          },
        },
      ]
    );
  };

  const getRiskColors = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'EXTREME':
        return {
          primary: '#DC2626',
          bg: '#FEF2F2',
          border: '#FECACA',
          pillBg: '#FEE2E2',
        };
      case 'HIGH':
        return {
          primary: '#EA580C',
          bg: '#FFF7ED',
          border: '#FED7AA',
          pillBg: '#FFEDD5',
        };
      case 'MODERATE':
        return {
          primary: '#D97706',
          bg: '#FFFBEB',
          border: '#FDE68A',
          pillBg: '#FEF3C7',
        };
      default:
        return {
          primary: '#059669',
          bg: '#ECFDF5',
          border: '#A7F3D0',
          pillBg: '#D1FAE5',
        };
    }
  };

  const riskColors = getRiskColors(selectedLocality.riskLevel);
  const safety = evaluateHeatSafety(
    selectedLocality.currentTemp,
    selectedLocality.humidity,
    selectedLocality.uvIndex
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header / Locality Switcher */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderLeft}>
            <Text style={styles.topSubLabel}>CURRENT DEFENSE ZONE</Text>
            <TouchableOpacity
              style={styles.localityPickerBtn}
              onPress={() => setSelectorVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={18} color="#0284C7" />
              <Text style={styles.localityPickerText} numberOfLines={1}>
                {selectedLocality.name}
              </Text>
              <Feather name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.topHeaderActions}>
            <TouchableOpacity
              style={styles.assistantBadgeBtn}
              onPress={onNavigateToAssistant}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="robot" size={16} color="#0284C7" />
              <Text style={styles.assistantBadgeText}>AI Consult</Text>
            </TouchableOpacity>

            {/* Profile Avatar / Touch Target: Dynamic Avatar / Name / Role / ▼ */}
            <TouchableOpacity
              style={styles.headerProfileBtn}
              onPress={() => setProfileSheetVisible(true)}
              activeOpacity={0.8}
              accessibilityLabel="User profile and account settings"
            >
              <View style={styles.headerProfileAvatar}>
                <Text style={styles.headerProfileAvatarText}>{initials}</Text>
              </View>
              <View style={styles.headerProfileTextWrap}>
                <Text style={styles.headerProfileName} numberOfLines={1}>
                  {displayName.split(' ')[0]}
                </Text>
                <Text style={styles.headerProfileRole} numberOfLines={1}>
                  {displayRole}
                </Text>
              </View>
              <Feather name="chevron-down" size={13} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Heat Hazard Banner */}
        <View
          style={[
            styles.alertBanner,
            { backgroundColor: riskColors.bg, borderColor: riskColors.border },
          ]}
        >
          <View style={styles.alertHeaderRow}>
            <View style={[styles.pulseDot, { backgroundColor: riskColors.primary }]} />
            <Text style={[styles.alertBadgeText, { color: riskColors.primary }]}>
              {selectedLocality.riskLevel} HEAT DEFENSE PROTOCOL ACTIVE
            </Text>
            <View style={styles.spacer} />
            <Text style={styles.alertCity}>{selectedLocality.city}</Text>
          </View>
          <Text style={styles.alertDesc}>
            {selectedLocality.riskLevel === 'EXTREME'
              ? 'IMD Red Alert: Peak thermal radiation active between 12:00 PM and 04:30 PM. Restrict non-essential outdoor travel and keep hydrated.'
              : 'IMD Orange Warning: High heat strain on outdoor workers and vulnerable groups. Regular electrolyte hydration advised.'}
          </Text>
        </View>

        {/* Heat Index Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>FEELS LIKE HEAT INDEX</Text>
            <TouchableOpacity
              style={[
                styles.riskTag,
                { backgroundColor: riskColors.pillBg, borderColor: riskColors.border },
              ]}
              onPress={() => setSelectorVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.riskTagText, { color: riskColors.primary }]}>
                {selectedLocality.riskLevel}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tempRow}>
            <Text style={[styles.heroTemp, { color: riskColors.primary }]}>
              {selectedLocality.heatIndex.toFixed(1)}°
            </Text>
            <View style={styles.tempSubCol}>
              <Text style={styles.celsius}>C</Text>
              <Text style={styles.ambientText}>
                Ambient: {selectedLocality.currentTemp.toFixed(1)}°C
              </Text>
              <Text style={styles.islandText}>
                UHI Factor: +{selectedLocality.urbanHeatIslandFactor}x
              </Text>
            </View>
          </View>

          {/* Gauge Meter Bar */}
          <View style={styles.gaugeTrack}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${Math.min(100, Math.max(12, ((selectedLocality.heatIndex - 25) / 30) * 100))}%`,
                  backgroundColor: riskColors.primary,
                },
              ]}
            />
          </View>
          <View style={styles.gaugeLabels}>
            <Text style={styles.gaugeSubText}>25°C Mild</Text>
            <Text style={styles.gaugeSubText}>38°C High</Text>
            <Text style={styles.gaugeSubText}>55°C Extreme</Text>
          </View>
        </View>

        {/* Today's Weather Snapshot Card with Tap-to-View-Full-Weather */}
        <TouchableOpacity
          style={styles.weatherSnapshotCard}
          onPress={onNavigateToWeather}
          activeOpacity={0.85}
        >
          <View style={styles.snapshotHeader}>
            <View style={styles.snapshotTitleWrap}>
              <Ionicons name="partly-sunny" size={18} color="#0284C7" />
              <Text style={styles.snapshotTitle}>TODAY'S WEATHER SNAPSHOT</Text>
            </View>
            <View style={styles.viewFullRow}>
              <Text style={styles.viewFullText}>Full Forecast</Text>
              <Feather name="arrow-right" size={14} color="#0284C7" />
            </View>
          </View>

          <View style={styles.vitalsRow}>
            <View style={styles.vitalCard}>
              <MaterialCommunityIcons name="water-thermometer" size={20} color="#0284C7" />
              <Text style={styles.vitalLabel}>Wet Bulb</Text>
              <Text style={styles.vitalValue}>{selectedLocality.wetBulb}°C</Text>
              <Text
                style={[
                  styles.vitalHint,
                  selectedLocality.wetBulb >= 29 && { color: '#DC2626', fontWeight: '700' },
                ]}
              >
                {selectedLocality.wetBulb >= 29 ? 'Hazardous' : 'Elevated'}
              </Text>
            </View>

            <View style={styles.vitalCard}>
              <Feather name="sun" size={20} color="#EA580C" />
              <Text style={styles.vitalLabel}>UV Index</Text>
              <Text style={styles.vitalValue}>{selectedLocality.uvIndex}</Text>
              <Text style={styles.vitalHint}>
                {selectedLocality.uvIndex >= 10 ? 'Extreme' : 'Very High'}
              </Text>
            </View>

            <View style={styles.vitalCard}>
              <Ionicons name="water" size={20} color="#0284C7" />
              <Text style={styles.vitalLabel}>Humidity</Text>
              <Text style={styles.vitalValue}>{selectedLocality.humidity}%</Text>
              <Text style={styles.vitalHint}>High Moisture</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions Grid: [Safe Route] [Cooling Shelter] [Water Point] [Request Aid] */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionLabel}>DEFENSE QUICK ACTIONS</Text>
          <View style={styles.quickGrid}>
            {/* Safe Route */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={onNavigateToRoute}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="map-marker-path" size={22} color="#059669" />
              </View>
              <Text style={styles.actionGridTitle}>Safe Route</Text>
              <Text style={styles.actionGridSub}>Canopy Shade</Text>
            </TouchableOpacity>

            {/* Cooling Shelter */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={onNavigateToSOS}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="snow" size={22} color="#0284C7" />
              </View>
              <Text style={styles.actionGridTitle}>Cool Shelter</Text>
              <Text style={styles.actionGridSub}>Air-Cooled Hubs</Text>
            </TouchableOpacity>

            {/* Water Point */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={() => setWaterModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="water" size={22} color="#2563EB" />
              </View>
              <Text style={styles.actionGridTitle}>Water Point</Text>
              <Text style={styles.actionGridSub}>Purified Kiosks</Text>
            </TouchableOpacity>

            {/* Request Aid */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={onNavigateToAssistance}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#FEF2F2' }]}>
                <MaterialCommunityIcons name="hand-heart" size={22} color="#DC2626" />
              </View>
              <Text style={styles.actionGridTitle}>Request Aid</Text>
              <Text style={styles.actionGridSub}>Tanker / Medic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Active Heat Alerts Cards */}
        <View style={styles.alertsCard}>
          <View style={styles.alertCardHeader}>
            <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#EA580C" />
            <Text style={styles.alertCardTitle}>LIVE HEAT ADVISORIES</Text>
          </View>

          <View style={styles.advisoryItem}>
            <View style={styles.advisoryBullet} />
            <View style={styles.advisoryBody}>
              <Text style={styles.advisoryHeading}>Outdoor Labor Cessation Window</Text>
              <Text style={styles.advisoryText}>
                Labour Welfare Advisory: Heavy outdoor construction halted between 11:30 AM and 03:30 PM.
              </Text>
            </View>
          </View>

          <View style={styles.advisoryItem}>
            <View style={[styles.advisoryBullet, { backgroundColor: '#0284C7' }]} />
            <View style={styles.advisoryBody}>
              <Text style={styles.advisoryHeading}>School & Elderly Respite Priority</Text>
              <Text style={styles.advisoryText}>
                BBMP / Civic cooling halls operating with free ORS packets and pediatric electrolyte water.
              </Text>
            </View>
          </View>
        </View>

        {/* Hourly Heat Risk Curve Strip */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S HEAT RISK CURVE</Text>
            <TouchableOpacity onPress={onNavigateToWeather} activeOpacity={0.7}>
              <Text style={styles.sectionSubLink}>See 24h &gt;</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyList}>
            {HOURLY_FORECASTS.slice(0, 8).map((hour, idx) => {
              const hColors = getRiskColors(hour.riskLevel);
              return (
                <View key={idx} style={styles.hourlyItem}>
                  <Text style={styles.hourlyTime}>{hour.time.split(' ')[0]}</Text>
                  <View style={[styles.hourlyBarWrap, { backgroundColor: '#F1F5F9' }]}>
                    <View
                      style={[
                        styles.hourlyBar,
                        {
                          height: `${Math.min(100, Math.max(25, ((hour.heatIndex - 30) / 20) * 100))}%`,
                          backgroundColor: hColors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.hourlyTemp}>{hour.temp.toFixed(0)}°</Text>
                  <Text style={[styles.hourlyRisk, { color: hColors.primary }]}>
                    {hour.riskLevel.slice(0, 3)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* AI Assistant Quick Consultation Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={onNavigateToAssistant}
          activeOpacity={0.88}
        >
          <View style={styles.aiBannerIcon}>
            <MaterialCommunityIcons name="robot" size={24} color="#0284C7" />
          </View>
          <View style={styles.aiBannerText}>
            <Text style={styles.aiBannerTitle}>Heat Health AI Assistant</Text>
            <Text style={styles.aiBannerSub}>
              Ask: "Signs of heatstroke vs exhaustion" or "ORS dosage"
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#0284C7" />
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* Locality Selector Modal */}
      <Modal
        visible={selectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Active Locality</Text>
                <Text style={styles.modalSubTitle}>Switch microclimate monitoring zone</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectorVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LOCALITIES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedLocality.id;
                const rColors = getRiskColors(item.riskLevel);
                return (
                  <TouchableOpacity
                    style={[styles.localityItem, isSelected && styles.localityItemSelected]}
                    onPress={() => {
                      onSelectLocality(item);
                      setSelectorVisible(false);
                    }}
                  >
                    <View style={styles.localityItemLeft}>
                      <Text
                        style={[
                          styles.localityItemName,
                          isSelected && { color: '#0284C7', fontWeight: '800' },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.localityItemCity}>
                        {item.city}, {item.state} • Feels {item.heatIndex.toFixed(1)}°C
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.localityItemBadge,
                        { backgroundColor: rColors.pillBg, borderColor: rColors.border },
                      ]}
                    >
                      <Text style={[styles.localityItemRisk, { color: rColors.primary }]}>
                        {item.riskLevel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Water Points Modal */}
      <Modal
        visible={waterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWaterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="water" size={22} color="#0284C7" />
                <Text style={styles.modalTitle}>Purified Water Kiosks</Text>
              </View>
              <TouchableOpacity onPress={() => setWaterModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={WATER_POINTS}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.waterPointItem}>
                  <View style={styles.waterPointTop}>
                    <Text style={styles.waterPointName}>{item.name}</Text>
                    <View style={styles.operationalTag}>
                      <Text style={styles.operationalText}>Operational</Text>
                    </View>
                  </View>
                  <Text style={styles.waterPointAddress}>{item.address}</Text>
                  <View style={styles.waterPointMeta}>
                    <Text style={styles.waterType}>{item.waterType}</Text>
                    <Text style={styles.waterDistance}>{item.distanceKm} km away</Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Profile Native Bottom Sheet Modal */}
      <Modal
        visible={profileSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandleBar} />
            </View>

            <View style={styles.modalHeader}>
              <View style={styles.profileModalHeaderLeft}>
                <View style={styles.profileSheetAvatar}>
                  <Text style={styles.profileSheetAvatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.profileSheetName}>{displayName}</Text>
                    <View style={styles.profileSheetRoleBadge}>
                      <Text style={styles.profileSheetRoleBadgeText}>{displayRole}</Text>
                    </View>
                  </View>
                  <Text style={styles.profileSheetEmail} numberOfLines={1}>
                    {currentEmail || 'Active Citizen'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setProfileSheetVisible(false)}
                style={styles.closeBtn}
                accessibilityLabel="Close profile sheet"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Active Shield Indicator */}
            <View style={styles.profileStatusCard}>
              <View style={styles.profileStatusLeft}>
                <View style={styles.profileStatusDot} />
                <Text style={styles.profileStatusText}>Active Heat Defense Protocol</Text>
              </View>
              <Text style={styles.profileStatusZone}>{selectedLocality.name}</Text>
            </View>

            {/* Menu Options: Profile, Settings, Weather, AI Assistant */}
            <View style={styles.profileSheetMenu}>
              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setProfileSheetVisible(false);
                  if (onNavigateToProfile) onNavigateToProfile();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.profileMenuIconWrap, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="person" size={18} color="#0284C7" />
                </View>
                <View style={styles.profileMenuTextWrap}>
                  <Text style={styles.profileMenuTitle}>Resident Profile & Contacts</Text>
                  <Text style={styles.profileMenuSub}>Vitals, emergency SMS & senior mode</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setProfileSheetVisible(false);
                  onNavigateToWeather();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.profileMenuIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="partly-sunny" size={18} color="#059669" />
                </View>
                <View style={styles.profileMenuTextWrap}>
                  <Text style={styles.profileMenuTitle}>Weather & Microclimate</Text>
                  <Text style={styles.profileMenuSub}>24h heat index & UV radiation</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setProfileSheetVisible(false);
                  onNavigateToAssistant();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.profileMenuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialCommunityIcons name="robot" size={18} color="#2563EB" />
                </View>
                <View style={styles.profileMenuTextWrap}>
                  <Text style={styles.profileMenuTitle}>Heat Health AI Assistant</Text>
                  <Text style={styles.profileMenuSub}>Immediate cooling triage advice</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.sheetSignOutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={16} color="#DC2626" />
              <Text style={styles.sheetSignOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  spacer: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topHeaderLeft: {
    flex: 1,
  },
  topSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  localityPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  localityPickerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: 200,
  },
  topHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerProfileAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileAvatarText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerProfileTextWrap: {
    justifyContent: 'center',
    maxWidth: 62,
  },
  headerProfileName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 13,
  },
  headerProfileRole: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
    lineHeight: 11,
  },
  assistantBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  assistantBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  profileModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  profileSheetAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSheetAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  profileSheetName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileSheetRoleBadge: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  profileSheetRoleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  profileSheetEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  profileStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
  },
  profileStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  profileStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  profileStatusZone: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  profileSheetMenu: {
    gap: 8,
    marginBottom: 14,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileMenuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileMenuTextWrap: {
    flex: 1,
  },
  profileMenuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileMenuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sheetSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    marginTop: 4,
  },
  sheetSignOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  alertBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertCity: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  alertDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  riskTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  riskTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  heroTemp: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  },
  tempSubCol: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  celsius: {
    fontSize: 22,
    fontWeight: '800',
    color: '#64748B',
  },
  ambientText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  islandText: {
    fontSize: 11,
    color: '#EA580C',
    fontWeight: '600',
    marginTop: 2,
  },
  gaugeTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeSubText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  weatherSnapshotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  snapshotTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  snapshotTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  viewFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewFullText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  vitalLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 2,
  },
  vitalHint: {
    fontSize: 10,
    color: '#64748B',
  },
  quickActionsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionGridItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionGridTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  actionGridSub: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  alertsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  alertCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.8,
  },
  advisoryItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  advisoryBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA580C',
    marginTop: 5,
    marginRight: 10,
  },
  advisoryBody: {
    flex: 1,
  },
  advisoryHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  advisoryText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  sectionSubLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  hourlyList: {
    marginHorizontal: -4,
  },
  hourlyItem: {
    width: 58,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  hourlyTime: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  hourlyBarWrap: {
    width: 14,
    height: 56,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  hourlyBar: {
    width: '100%',
    borderRadius: 7,
  },
  hourlyTemp: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  hourlyRisk: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  aiBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiBannerText: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  aiBannerSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  localityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  localityItemSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  localityItemLeft: {
    flex: 1,
  },
  localityItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  localityItemCity: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  localityItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  localityItemRisk: {
    fontSize: 10,
    fontWeight: '800',
  },
  waterPointItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  waterPointTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterPointName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  operationalTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  operationalText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  waterPointAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  waterPointMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  waterType: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
  },
  waterDistance: {
    fontSize: 10,
    color: '#64748B',
  },
});
