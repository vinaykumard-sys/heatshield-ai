import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COOLING_CENTRES, INITIAL_EMERGENCY_CONTACTS } from '../data/mockData';
import { Locality } from '../types';

interface Props {
  selectedLocality: Locality;
  onNavigateToAssistance?: () => void;
}

export default function SOSScreen({ selectedLocality, onNavigateToAssistance }: Props) {
  const [smsSending, setSmsSending] = useState(false);

  const handleDial = (number: string, label: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert(`Dial ${label}`, `Please call ${number} directly from your phone dialer.`);
    });
  };

  const handleDispatchEmergencySMS = () => {
    setSmsSending(true);
    const coords = `${selectedLocality.latitude.toFixed(4)}, ${selectedLocality.longitude.toFixed(4)}`;
    const msg = encodeURIComponent(
      `[HEATSHIELD EMERGENCY ALERT] Urgent heat distress reported at ${selectedLocality.name}, ${selectedLocality.city} (GPS: ${coords}). Feels-like temp is ${selectedLocality.heatIndex.toFixed(1)}°C. Immediate medical cooling / ORS required.`
    );

    // Pick first contact or disaster line
    const targetPhone = INITIAL_EMERGENCY_CONTACTS[0]?.phone || '1070';
    const smsUrl = Platform.OS === 'ios' ? `sms:${targetPhone}&body=${msg}` : `sms:${targetPhone}?body=${msg}`;

    Linking.openURL(smsUrl)
      .then(() => {
        setSmsSending(false);
      })
      .catch(() => {
        setSmsSending(false);
        Alert.alert(
          'SMS Ready',
          `SMS composed with GPS coordinates (${coords}). Please confirm in messaging app.`
        );
      });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Urgent Emergency Dispatch Banner */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyCardHeader}>
            <View style={styles.alertPill}>
              <MaterialCommunityIcons name="alert-decagram" size={16} color="#DC2626" />
              <Text style={styles.alertPillText}>HEATSTROKE & RAPID RESCUE</Text>
            </View>
            <Text style={styles.gpsLabel}>
              GPS: {selectedLocality.latitude.toFixed(3)}, {selectedLocality.longitude.toFixed(3)}
            </Text>
          </View>

          <Text style={styles.emergencyTitle}>Tap to Call Emergency Helplines</Text>
          <Text style={styles.emergencySubtitle}>
            Toll-free 24/7 dedicated lines for heat exhaustion, fainting & ambulance dispatch.
          </Text>

          {/* Emergency Call Buttons Grid */}
          <View style={styles.callGrid}>
            <TouchableOpacity
              style={styles.callCardRed}
              onPress={() => handleDial('1070', 'State Disaster Heat Helpline')}
              activeOpacity={0.88}
            >
              <View style={styles.callIconWrap}>
                <Ionicons name="call" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.callNumber}>1070</Text>
              <Text style={styles.callDesc}>State Heatwave Control</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callCardOrange}
              onPress={() => handleDial('1077', 'District Disaster Line')}
              activeOpacity={0.88}
            >
              <View style={styles.callIconWrap}>
                <Ionicons name="call" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.callNumber}>1077</Text>
              <Text style={styles.callDesc}>District Emergency Hub</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callCardBlue}
              onPress={() => handleDial('108', 'Emergency Ambulance Service')}
              activeOpacity={0.88}
            >
              <View style={styles.callIconWrap}>
                <MaterialCommunityIcons name="ambulance" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.callNumber}>108</Text>
              <Text style={styles.callDesc}>Medical Ambulance</Text>
            </TouchableOpacity>
          </View>

          {/* Emergency SMS Broadcast Button */}
          <TouchableOpacity
            style={styles.smsButton}
            onPress={handleDispatchEmergencySMS}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="message-alert" size={18} color="#FFFFFF" />
            <Text style={styles.smsButtonText}>
              {smsSending ? 'Broadcasting...' : 'Broadcast SOS SMS with GPS Coordinates'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Link to Request Aid Dispatch */}
        {onNavigateToAssistance && (
          <TouchableOpacity
            style={styles.requestAidCta}
            onPress={onNavigateToAssistance}
            activeOpacity={0.85}
          >
            <View style={styles.requestAidIcon}>
              <MaterialCommunityIcons name="truck-delivery" size={22} color="#0284C7" />
            </View>
            <View style={styles.requestAidText}>
              <Text style={styles.requestAidTitle}>Request Water Tanker or First Aid Aid</Text>
              <Text style={styles.requestAidSub}>
                Submit a field assistance ticket with live tracker
              </Text>
            </View>
            <Feather name="arrow-right" size={18} color="#0284C7" />
          </TouchableOpacity>
        )}

        {/* Nearby Cooling Centers Section */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="snowflake" size={18} color="#0284C7" />
              <Text style={styles.sectionTitle}>NEARBY PUBLIC COOLING SHELTERS</Text>
            </View>
            <Text style={styles.sectionCount}>{COOLING_CENTRES.length} active</Text>
          </View>

          {COOLING_CENTRES.map((shelter) => (
            <View key={shelter.id} style={styles.shelterCard}>
              <View style={styles.shelterTop}>
                <View style={styles.shelterInfo}>
                  <Text style={styles.shelterName}>{shelter.name}</Text>
                  <Text style={styles.shelterAddress}>{shelter.address}</Text>
                </View>
                <View style={styles.openTag}>
                  <Text style={styles.openText}>OPEN</Text>
                </View>
              </View>

              <View style={styles.amenitiesWrap}>
                {shelter.amenities.map((amenity, idx) => (
                  <View key={idx} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.shelterFooter}>
                <View style={styles.shelterMetaRow}>
                  <Feather name="clock" size={12} color="#64748B" />
                  <Text style={styles.shelterHours}>{shelter.operatingHours}</Text>
                  <Text style={styles.shelterDist}>• {shelter.distanceKm} km away</Text>
                </View>

                <TouchableOpacity
                  style={styles.shelterCallBtn}
                  onPress={() => handleDial(shelter.contactPhone, shelter.name)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={13} color="#059669" />
                  <Text style={styles.shelterCallText}>Direct Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Heatstroke First Aid Warning Card */}
        <View style={styles.firstAidCard}>
          <View style={styles.firstAidHeader}>
            <MaterialCommunityIcons name="medical-bag" size={20} color="#DC2626" />
            <Text style={styles.firstAidTitle}>CRITICAL FIRST AID CHECKLIST</Text>
          </View>

          <View style={styles.firstAidItem}>
            <Text style={styles.firstAidNum}>1</Text>
            <Text style={styles.firstAidText}>
              Move victim to shade or air conditioning immediately.
            </Text>
          </View>
          <View style={styles.firstAidItem}>
            <Text style={styles.firstAidNum}>2</Text>
            <Text style={styles.firstAidText}>
              Apply cold damp cloths or ice packs to neck, armpits, and groin.
            </Text>
          </View>
          <View style={styles.firstAidItem}>
            <Text style={styles.firstAidNum}>3</Text>
            <Text style={styles.firstAidText}>
              Fan vigorously while misting water on the skin to lower core temp.
            </Text>
          </View>
          <View style={styles.firstAidItem}>
            <Text style={styles.firstAidNum}>4</Text>
            <Text style={styles.firstAidText}>
              If unconscious, turn on their side (recovery position) & call 108.
            </Text>
          </View>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emergencyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
  },
  alertPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  gpsLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  emergencySubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  callGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  callCardRed: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  callCardOrange: {
    flex: 1,
    backgroundColor: '#EA580C',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  callCardBlue: {
    flex: 1,
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  callIconWrap: {
    marginBottom: 4,
  },
  callNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  callDesc: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFFEE',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  smsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 8,
    shadowColor: '#991B1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  smsButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  requestAidCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  requestAidIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestAidText: {
    flex: 1,
  },
  requestAidTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  requestAidSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
  shelterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  shelterTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shelterInfo: {
    flex: 1,
    marginRight: 10,
  },
  shelterName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  shelterAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  openTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  amenityChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  shelterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  shelterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shelterHours: {
    fontSize: 10,
    color: '#64748B',
  },
  shelterDist: {
    fontSize: 10,
    color: '#94A3B8',
  },
  shelterCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  shelterCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  firstAidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  firstAidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  firstAidTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  firstAidItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  firstAidNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 22,
  },
  firstAidText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
});
