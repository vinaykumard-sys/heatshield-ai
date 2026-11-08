import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COOLING_CENTRES } from '../data/mockData';
import { CoolingCentre } from '../types';

export default function AssistanceScreen() {
  const [distressName, setDistressName] = useState('');
  const [distressPhone, setDistressPhone] = useState('');
  const [distressType, setDistressType] = useState('Heat Exhaustion / Dizziness');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const distressTypes = [
    'Heat Exhaustion / Dizziness',
    'Severe Dehydration',
    'Elderly / Bedridden without Cooling',
    'Community Water Tanker Request',
  ];

  const handleDialSOS = (number = '1070') => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Emergency Helpline', `Please dial ${number} on your phone dialer.`);
    });
  };

  const handleSubmitDistress = () => {
    if (!distressPhone.trim()) {
      Alert.alert('Missing Contact', 'Please provide a valid phone number so the dispatch team can contact you.');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      Alert.alert(
        'Distress Request Logged',
        'Your alert has been prioritized and dispatched to BBMP Disaster Management & nearest Primary Health Centre.'
      );
    }, 400);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SOS & HEAT RELIEF</Text>
        <Text style={styles.headerSub}>Rapid Emergency Dispatch & Public Cooling Shelters</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Urgent Emergency Call Section */}
        <View style={styles.sosCard}>
          <View style={styles.sosTop}>
            <View style={styles.sosIconCircle}>
              <MaterialCommunityIcons name="alert-decagram" size={36} color="#FFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.sosCardTitle}>State Heatwave Emergency</Text>
              <Text style={styles.sosCardSub}>24x7 Government Disaster Helpline</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.sosBigButton}
            onPress={() => handleDialSOS('1070')}
            activeOpacity={0.88}
          >
            <Ionicons name="call" size={24} color="#FFF" />
            <Text style={styles.sosBigButtonText}>CALL TOLL FREE 1070</Text>
          </TouchableOpacity>

          {/* Secondary Quick Dial buttons: 108 Ambulance, 112 Emergency */}
          <View style={styles.secondaryHelplines}>
            <TouchableOpacity
              style={styles.secHelplineBtn}
              onPress={() => handleDialSOS('108')}
            >
              <MaterialCommunityIcons name="ambulance" size={18} color="#EF4444" />
              <Text style={styles.secHelplineText}>Ambulance 108</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secHelplineBtn}
              onPress={() => handleDialSOS('112')}
            >
              <Ionicons name="shield-checkmark" size={18} color="#06B6D4" />
              <Text style={styles.secHelplineText}>Police / Disaster 112</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nearby Cooling Centres */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>NEARBY VERIFIED COOLING RESIDENCES</Text>
              <Text style={styles.sectionSubText}>Free AC, cold drinking water, ORS beds</Text>
            </View>
            <View style={styles.openPill}>
              <Text style={styles.openPillText}>Live Verified</Text>
            </View>
          </View>

          {COOLING_CENTRES.map((centre: CoolingCentre) => (
            <View key={centre.id} style={styles.centreItem}>
              <View style={styles.centreTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.centreName}>{centre.name}</Text>
                  <Text style={styles.centreAddress}>{centre.address}</Text>
                </View>
                <View style={styles.distBadge}>
                  <Text style={styles.distBadgeText}>{centre.distanceKm} km</Text>
                </View>
              </View>

              <View style={styles.amenitiesWrap}>
                {centre.amenities.map((amenity, i) => (
                  <View key={i} style={styles.amenityTag}>
                    <Text style={styles.amenityText}>• {amenity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.centreBottomRow}>
                <Text style={styles.operatingHours}>
                  <Feather name="clock" size={12} color="#94A3B8" /> {centre.operatingHours}
                </Text>

                <TouchableOpacity
                  style={styles.centreCallBtn}
                  onPress={() => handleDialSOS(centre.contactPhone.replace(/\D/g, ''))}
                >
                  <Ionicons name="call" size={14} color="#10B981" />
                  <Text style={styles.centreCallText}>Call Shelter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Report Distress Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>REPORT CITIZEN HEAT DISTRESS</Text>
          <Text style={styles.sectionSubText}>
            Direct escalation to municipal welfare and rapid medical responders
          </Text>

          {submitted ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={42} color="#10B981" />
              <Text style={styles.successTitle}>Emergency Report Received</Text>
              <Text style={styles.successText}>
                BBMP ward health officer and rapid paramedic dispatch have received your coordinates.
              </Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSubmitted(false);
                  setDistressPhone('');
                  setNotes('');
                }}
              >
                <Text style={styles.resetBtnText}>Submit Another Report</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.fieldLabel}>Reporter / Patient Name</Text>
              <TextInput
                style={styles.formInput}
                value={distressName}
                onChangeText={setDistressName}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.fieldLabel}>Contact Phone Number *</Text>
              <TextInput
                style={styles.formInput}
                value={distressPhone}
                onChangeText={setDistressPhone}
                placeholder="+91 98450 00000"
                keyboardType="phone-pad"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.fieldLabel}>Type of Distress / Vulnerability</Text>
              <View style={styles.distressOptions}>
                {distressTypes.map((type) => {
                  const isSelected = distressType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.distressChip, isSelected && styles.distressChipSelected]}
                      onPress={() => setDistressType(type)}
                    >
                      <Text
                        style={[styles.distressChipText, isSelected && styles.distressChipTextActive]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Location Details / Landmark / Symptoms</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Describe condition, exact street corner, elderly patient status..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitDistress}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="broadcast" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>DISPATCH RAPID ASSISTANCE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B1329',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  sosCard: {
    backgroundColor: '#1E1015',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  sosTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sosIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FEE2E2',
  },
  sosCardSub: {
    fontSize: 12,
    color: '#FCA5A5',
    marginTop: 2,
  },
  sosBigButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  sosBigButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  secondaryHelplines: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secHelplineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D151D',
    borderWidth: 1,
    borderColor: '#451A24',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  secHelplineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionCard: {
    backgroundColor: '#0B1329',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  sectionSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  openPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  openPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  centreItem: {
    backgroundColor: '#060D1E',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  centreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  centreName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  centreAddress: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  distBadge: {
    backgroundColor: '#132147',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  distBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06B6D4',
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  amenityTag: {
    backgroundColor: '#0F1D3D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  centreBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  operatingHours: {
    fontSize: 11,
    color: '#94A3B8',
  },
  centreCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  centreCallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  formContainer: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 10,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#060D1E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  distressOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  distressChip: {
    backgroundColor: '#060D1E',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  distressChipSelected: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  distressChipText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  distressChipTextActive: {
    color: '#EF4444',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  successBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#060D1E',
    borderRadius: 16,
    marginTop: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 10,
  },
  successText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
});
