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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LOCALITIES, HOURLY_FORECASTS, WATER_POINTS } from '../data/mockData';
import { Locality } from '../types';
import { evaluateHeatSafety } from '../services/actionEngine';

interface Props {
  selectedLocality: Locality;
  onSelectLocality: (locality: Locality) => void;
  onNavigateToWeather: () => void;
  onNavigateToRoute: () => void;
  onNavigateToSOS: () => void;
  onNavigateToAssistance: () => void;
  onNavigateToAssistant: () => void;
}

export default function DashboardScreen({
  selectedLocality,
  onSelectLocality,
  onNavigateToWeather,
  onNavigateToRoute,
  onNavigateToSOS,
  onNavigateToAssistance,
  onNavigateToAssistant,
}: Props) {
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'EXTREME':
        return '#EF4444';
      case 'HIGH':
        return '#F97316';
      case 'MODERATE':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const riskColor = getRiskColor(selectedLocality.riskLevel);
  const safety = evaluateHeatSafety(
    selectedLocality.currentTemp,
    selectedLocality.humidity,
    selectedLocality.uvIndex
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Heat Hazard Banner */}
        <View style={[styles.alertBanner, { borderColor: riskColor, backgroundColor: `${riskColor}12` }]}>
          <View style={styles.alertHeaderRow}>
            <View style={[styles.pulseDot, { backgroundColor: riskColor }]} />
            <Text style={[styles.alertBadgeText, { color: riskColor }]}>
              {selectedLocality.riskLevel} HEAT DEFENSE ACTIVE
            </Text>
            <View style={styles.spacer} />
            <Text style={styles.alertCity}>{selectedLocality.city}</Text>
          </View>
          <Text style={styles.alertDesc}>
            {selectedLocality.riskLevel === 'EXTREME'
              ? 'IMD Red Alert: Peak thermal radiation active between 12:00 PM and 04:30 PM. Restrict non-essential outdoor travel.'
              : 'IMD Orange Warning: High heat strain on outdoor workers and vulnerable groups. Regular electrolyte hydration advised.'}
          </Text>
        </View>

        {/* Heat Index Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>FEELS LIKE HEAT INDEX</Text>
            <TouchableOpacity
              style={[styles.riskTag, { backgroundColor: `${riskColor}25`, borderColor: riskColor }]}
              onPress={() => setSelectorVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.riskTagText, { color: riskColor }]}>
                {selectedLocality.riskLevel}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tempRow}>
            <Text style={[styles.heroTemp, { color: riskColor }]}>
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
                  backgroundColor: riskColor,
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
              <Feather name="cloud-sun" size={18} color="#06B6D4" />
              <Text style={styles.snapshotTitle}>TODAY'S WEATHER SNAPSHOT</Text>
            </View>
            <View style={styles.viewFullRow}>
              <Text style={styles.viewFullText}>Full Forecast</Text>
              <Feather name="arrow-right" size={14} color="#06B6D4" />
            </View>
          </View>

          <View style={styles.vitalsRow}>
            <View style={styles.vitalCard}>
              <MaterialCommunityIcons name="water-thermometer" size={20} color="#06B6D4" />
              <Text style={styles.vitalLabel}>Wet Bulb</Text>
              <Text style={styles.vitalValue}>{selectedLocality.wetBulb}°C</Text>
              <Text style={styles.vitalHint}>
                {selectedLocality.wetBulb >= 29 ? 'Hazardous' : 'Elevated'}
              </Text>
            </View>

            <View style={styles.vitalCard}>
              <Feather name="sun" size={20} color="#F59E0B" />
              <Text style={styles.vitalLabel}>UV Index</Text>
              <Text style={styles.vitalValue}>{selectedLocality.uvIndex}</Text>
              <Text style={styles.vitalHint}>
                {selectedLocality.uvIndex >= 10 ? 'Extreme' : 'Very High'}
              </Text>
            </View>

            <View style={styles.vitalCard}>
              <Ionicons name="water-outline" size={20} color="#38BDF8" />
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
              <View style={[styles.actionIconCircle, { backgroundColor: '#10B98120' }]}>
                <MaterialCommunityIcons name="map-marker-path" size={24} color="#10B981" />
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
              <View style={[styles.actionIconCircle, { backgroundColor: '#06B6D420' }]}>
                <Ionicons name="snow" size={22} color="#06B6D4" />
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
              <View style={[styles.actionIconCircle, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="water" size={22} color="#3B82F6" />
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
              <View style={[styles.actionIconCircle, { backgroundColor: '#EF444420' }]}>
                <MaterialCommunityIcons name="hand-heart" size={24} color="#EF4444" />
              </View>
              <Text style={styles.actionGridTitle}>Request Aid</Text>
              <Text style={styles.actionGridSub}>Tanker / Medic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Active Heat Alerts Cards */}
        <View style={styles.alertsCard}>
          <View style={styles.alertCardHeader}>
            <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#F59E0B" />
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
            <View style={[styles.advisoryBullet, { backgroundColor: '#06B6D4' }]} />
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
              const hColor = getRiskColor(hour.riskLevel);
              return (
                <View key={idx} style={styles.hourlyItem}>
                  <Text style={styles.hourlyTime}>{hour.time.split(' ')[0]}</Text>
                  <View style={[styles.hourlyBarWrap, { backgroundColor: `${hColor}22` }]}>
                    <View
                      style={[
                        styles.hourlyBar,
                        {
                          height: `${Math.min(100, Math.max(25, ((hour.heatIndex - 30) / 20) * 100))}%`,
                          backgroundColor: hColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.hourlyTemp}>{hour.temp.toFixed(0)}°</Text>
                  <Text style={[styles.hourlyRisk, { color: hColor }]}>
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
          activeOpacity={0.85}
        >
          <View style={styles.aiBannerIcon}>
            <MaterialCommunityIcons name="robot" size={26} color="#38BDF8" />
          </View>
          <View style={styles.aiBannerText}>
            <Text style={styles.aiBannerTitle}>Heat Health AI Assistant</Text>
            <Text style={styles.aiBannerSub}>
              Ask: "Signs of heatstroke vs exhaustion" or "ORS dosage"
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#38BDF8" />
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
              <Text style={styles.modalTitle}>Select Active Locality</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LOCALITIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedLocality.id;
                const rCol = getRiskColor(item.riskLevel);
                return (
                  <TouchableOpacity
                    style={[styles.localityItem, isSelected && styles.localityItemSelected]}
                    onPress={() => {
                      onSelectLocality(item);
                      setSelectorVisible(false);
                    }}
                  >
                    <View style={styles.localityItemLeft}>
                      <Text style={styles.localityItemName}>{item.name}</Text>
                      <Text style={styles.localityItemCity}>
                        {item.city}, {item.state} • Feels {item.heatIndex.toFixed(1)}°C
                      </Text>
                    </View>
                    <View style={[styles.localityItemBadge, { backgroundColor: `${rCol}20` }]}>
                      <Text style={[styles.localityItemRisk, { color: rCol }]}>{item.riskLevel}</Text>
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
                <Ionicons name="water" size={22} color="#38BDF8" />
                <Text style={styles.modalTitle}>Purified Water Kiosks</Text>
              </View>
              <TouchableOpacity onPress={() => setWaterModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={WATER_POINTS}
              keyExtractor={(item) => item.id}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060D1E',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  spacer: {
    flex: 1,
  },
  alertBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
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
    letterSpacing: 0.6,
  },
  alertCity: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  alertDesc: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 17,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
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
    marginLeft: 8,
    justifyContent: 'center',
  },
  celsius: {
    fontSize: 24,
    fontWeight: '800',
    color: '#64748B',
  },
  ambientText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  islandText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 1,
  },
  gaugeTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 8,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 3,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeSubText: {
    fontSize: 10,
    color: '#64748B',
  },
  weatherSnapshotCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 16,
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
    color: '#94A3B8',
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
    color: '#06B6D4',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#1E293B50',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 2,
  },
  vitalHint: {
    fontSize: 9,
    color: '#64748B',
  },
  quickActionsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionGridItem: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
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
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  actionGridSub: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  alertsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 16,
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
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  advisoryItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  advisoryBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 6,
    marginRight: 10,
  },
  advisoryBody: {
    flex: 1,
  },
  advisoryHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  advisoryText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 16,
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
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  sectionSubLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06B6D4',
  },
  hourlyList: {
    marginHorizontal: -8,
  },
  hourlyItem: {
    width: 58,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  hourlyTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 6,
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
    color: '#F8FAFC',
  },
  hourlyRisk: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38BDF840',
    padding: 14,
  },
  aiBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#38BDF820',
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
    color: '#F8FAFC',
  },
  aiBannerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: '#1E293B',
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
    color: '#F8FAFC',
  },
  localityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  localityItemSelected: {
    backgroundColor: '#1E293B40',
  },
  localityItemLeft: {
    flex: 1,
  },
  localityItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  localityItemCity: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  localityItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  localityItemRisk: {
    fontSize: 10,
    fontWeight: '800',
  },
  waterPointItem: {
    backgroundColor: '#1E293B50',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  waterPointTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterPointName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  operationalTag: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  operationalText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  waterPointAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  waterPointMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  waterType: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  waterDistance: {
    fontSize: 11,
    color: '#64748B',
  },
});
