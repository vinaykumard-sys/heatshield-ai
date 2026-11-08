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
import { LOCALITIES, HOURLY_FORECASTS } from '../data/mockData';
import { Locality } from '../types';

interface Props {
  onNavigateToRoute: () => void;
  onNavigateToSOS: () => void;
}

export default function DashboardScreen({ onNavigateToRoute, onNavigateToSOS }: Props) {
  const [selectedLocality, setSelectedLocality] = useState<Locality>(LOCALITIES[0]);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'EXTREME':
        return '#EF4444'; // Red
      case 'HIGH':
        return '#F97316'; // Orange
      case 'MODERATE':
        return '#F59E0B'; // Amber
      default:
        return '#10B981'; // Emerald
    }
  };

  const riskColor = getRiskColor(selectedLocality.riskLevel);

  return (
    <View style={styles.container}>
      {/* Header with Locality Picker */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>HEATSHIELD AI</Text>
          <TouchableOpacity
            style={styles.localitySelector}
            onPress={() => setSelectorVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location-sharp" size={16} color="#06B6D4" />
            <Text style={styles.localityName} numberOfLines={1}>
              {selectedLocality.name}
            </Text>
            <Feather name="chevron-down" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sosQuickBadge}
          onPress={onNavigateToSOS}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="alert-octagon" size={16} color="#FFF" />
          <Text style={styles.sosQuickText}>SOS 1070</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Heatwave Warning Banner */}
        <View style={[styles.alertBanner, { borderColor: riskColor }]}>
          <View style={styles.alertHeaderRow}>
            <View style={[styles.pulseDot, { backgroundColor: riskColor }]} />
            <Text style={[styles.alertBadgeText, { color: riskColor }]}>
              {selectedLocality.riskLevel} HEAT HAZARD ACTIVE
            </Text>
          </View>
          <Text style={styles.alertDesc}>
            {selectedLocality.riskLevel === 'EXTREME'
              ? 'Critical heat risk. Peak sun hours between 12:00 PM and 04:00 PM. Avoid direct outdoor activity.'
              : 'Elevated ambient temperature & wet-bulb index. Keep hydrated with ORS and stay along shaded corridors.'}
          </Text>
        </View>

        {/* Heat Index Gauge Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>FEELS LIKE HEAT INDEX</Text>
          <View style={styles.tempRow}>
            <Text style={[styles.heroTemp, { color: riskColor }]}>
              {selectedLocality.heatIndex.toFixed(1)}°
            </Text>
            <View style={styles.tempSubCol}>
              <Text style={styles.celsius}>C</Text>
              <View style={[styles.riskTag, { backgroundColor: `${riskColor}25`, borderColor: riskColor }]}>
                <Text style={[styles.riskTagText, { color: riskColor }]}>
                  {selectedLocality.riskLevel}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.ambientInfo}>
            Ambient Temp: {selectedLocality.currentTemp.toFixed(1)}°C • Urban Island: +{selectedLocality.urbanHeatIslandFactor}x
          </Text>

          {/* Gauge Meter Bar */}
          <View style={styles.gaugeTrack}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${Math.min(100, Math.max(10, ((selectedLocality.heatIndex - 25) / 30) * 100))}%`,
                  backgroundColor: riskColor,
                },
              ]}
            />
          </View>
          <View style={styles.gaugeLabels}>
            <Text style={styles.gaugeSubText}>25°C Mild</Text>
            <Text style={styles.gaugeSubText}>38°C High</Text>
            <Text style={styles.gaugeSubText}>55°C Critical</Text>
          </View>
        </View>

        {/* Environmental Vitals: Wet Bulb, UV Index, Humidity */}
        <View style={styles.vitalsRow}>
          {/* Wet Bulb */}
          <View style={styles.vitalCard}>
            <View style={styles.vitalIconWrap}>
              <MaterialCommunityIcons name="water-thermometer" size={20} color="#06B6D4" />
            </View>
            <Text style={styles.vitalLabel}>Wet Bulb</Text>
            <Text style={styles.vitalValue}>{selectedLocality.wetBulb}°C</Text>
            <Text style={styles.vitalHint}>
              {selectedLocality.wetBulb >= 29 ? 'Danger zone' : 'Manageable'}
            </Text>
          </View>

          {/* UV Index */}
          <View style={styles.vitalCard}>
            <View style={styles.vitalIconWrap}>
              <Feather name="sun" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.vitalLabel}>UV Index</Text>
            <Text style={styles.vitalValue}>{selectedLocality.uvIndex}</Text>
            <Text style={styles.vitalHint}>
              {selectedLocality.uvIndex >= 10 ? 'Extreme UV' : 'Very High'}
            </Text>
          </View>

          {/* Humidity */}
          <View style={styles.vitalCard}>
            <View style={styles.vitalIconWrap}>
              <Ionicons name="water-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.vitalLabel}>Humidity</Text>
            <Text style={styles.vitalValue}>{selectedLocality.humidity}%</Text>
            <Text style={styles.vitalHint}>Slow sweat rate</Text>
          </View>
        </View>

        {/* Quick Navigation CTA to Safe Route */}
        <TouchableOpacity
          style={styles.safeRouteBanner}
          onPress={onNavigateToRoute}
          activeOpacity={0.85}
        >
          <View style={styles.routeBannerIcon}>
            <Ionicons name="navigate-circle" size={32} color="#10B981" />
          </View>
          <View style={styles.routeBannerText}>
            <Text style={styles.routeBannerTitle}>Find Canopy-Shaded Routes</Text>
            <Text style={styles.routeBannerSub}>
              Save up to 4.5°C body heat with live tree cover navigation
            </Text>
          </View>
          <Feather name="arrow-right" size={20} color="#10B981" />
        </TouchableOpacity>

        {/* Hourly Heat Risk Timeline */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S HEAT RISK CURVE</Text>
            <Text style={styles.sectionSub}>Peak 13:00 - 15:00</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyList}>
            {HOURLY_FORECASTS.map((hour, idx) => {
              const hColor = getRiskColor(hour.riskLevel);
              return (
                <View key={idx} style={styles.hourlyItem}>
                  <Text style={styles.hourlyTime}>{hour.time}</Text>
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

        {/* Safety Protocol Checklist */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>IMMEDIATE HEAT DEFENSE</Text>
          <View style={styles.protocolItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.protocolText}>
              Carry 500ml water mixed with ORS / electrolyte solution.
            </Text>
          </View>
          <View style={styles.protocolItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.protocolText}>
              Avoid direct open-road exposure during peak afternoon.
            </Text>
          </View>
          <View style={styles.protocolItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.protocolText}>
              Rest 10 minutes at a verified public cooling shelter if dizzy.
            </Text>
          </View>
        </View>

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
              <Text style={styles.modalTitle}>Select Locality</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Feather name="x" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LOCALITIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.localityItem,
                    selectedLocality.id === item.id && styles.localityItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedLocality(item);
                    setSelectorVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.locItemName}>{item.name}</Text>
                    <Text style={styles.locItemCity}>
                      {item.city}, {item.state}
                    </Text>
                  </View>
                  <View style={styles.locItemRight}>
                    <Text style={styles.locItemTemp}>{item.heatIndex.toFixed(1)}°C</Text>
                    <Text style={[styles.locItemRisk, { color: getRiskColor(item.riskLevel) }]}>
                      {item.riskLevel}
                    </Text>
                  </View>
                </TouchableOpacity>
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B1329',
  },
  appTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#06B6D4',
    letterSpacing: 2,
    marginBottom: 4,
  },
  localitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  localityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    maxWidth: 200,
  },
  sosQuickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  sosQuickText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  alertBanner: {
    backgroundColor: '#1E1524',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  alertDesc: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  heroCard: {
    backgroundColor: '#0B1329',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  heroTemp: {
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 70,
  },
  tempSubCol: {
    marginLeft: 6,
    paddingTop: 8,
  },
  celsius: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
  },
  riskTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  riskTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ambientInfo: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 10,
    marginBottom: 16,
  },
  gaugeTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#1E293B',
    borderRadius: 5,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 5,
  },
  gaugeLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  gaugeSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#0B1329',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  vitalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#132147',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  vitalLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 2,
  },
  vitalHint: {
    fontSize: 10,
    color: '#64748B',
  },
  safeRouteBanner: {
    backgroundColor: '#092C2B',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeBannerIcon: {
    marginRight: 12,
  },
  routeBannerText: {
    flex: 1,
  },
  routeBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ECFDF5',
  },
  routeBannerSub: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#0B1329',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  hourlyList: {
    flexDirection: 'row',
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 52,
  },
  hourlyTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  hourlyBarWrap: {
    width: 24,
    height: 70,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 2,
  },
  hourlyBar: {
    width: '100%',
    borderRadius: 10,
  },
  hourlyTemp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 6,
  },
  hourlyRisk: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  protocolText: {
    fontSize: 13,
    color: '#CBD5E1',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0B1329',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  localityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  localityItemSelected: {
    backgroundColor: '#132147',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  locItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  locItemCity: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  locItemRight: {
    alignItems: 'flex-end',
  },
  locItemTemp: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  locItemRisk: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
