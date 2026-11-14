import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { INITIAL_ASSISTANCE_REQUESTS } from '../data/mockData';
import { AssistanceRequest, Locality } from '../types';

interface Props {
  selectedLocality?: Locality;
  onBack?: () => void;
}

export default function AssistanceScreen({ selectedLocality, onBack }: Props) {
  const [requests, setRequests] = useState<AssistanceRequest[]>(INITIAL_ASSISTANCE_REQUESTS);
  const [category, setCategory] = useState('Heat Exhaustion / Dizziness');
  const [urgency, setUrgency] = useState<'CRITICAL_IMMEDIATE' | 'HIGH_PRIORITY' | 'ROUTINE_AID'>('HIGH_PRIORITY');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Heat Exhaustion / Dizziness',
    'Severe Dehydration',
    'Community Water Tanker Request',
    'Elderly / Bedridden without Cooling',
    'ORS & Medical First Aid Supplies',
  ];

  const handleSubmit = () => {
    if (!phone.trim()) {
      Alert.alert('Missing Phone Number', 'Please provide a contact phone number for the dispatch team.');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const newRequest: AssistanceRequest = {
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        category,
        requesterName: name.trim() || 'Anonymous Resident',
        requesterPhone: phone.trim(),
        localityName: selectedLocality?.name || 'Yelahanka Satellite Town',
        urgency,
        notes: notes.trim() || 'Immediate assistance requested via HeatShield Mobile App.',
        status: 'DISPATCHED',
        timestamp: 'Just now',
        etaMinutes: urgency === 'CRITICAL_IMMEDIATE' ? 8 : 18,
        assignedResponder:
          urgency === 'CRITICAL_IMMEDIATE'
            ? '108 Rapid Mobile Medical Bike (Paramedic: Suresh)'
            : 'BBMP Heat Action Relief Team #02',
      };

      setRequests((prev) => [newRequest, ...prev]);
      setSubmitting(false);
      setName('');
      setPhone('');
      setNotes('');

      Alert.alert(
        'Assistance Ticket Dispatched',
        `Ticket ${newRequest.id} has been submitted with ${urgency.replace('_', ' ')} priority. The responder has been dispatched.`
      );
    }, 600);
  };

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case 'CRITICAL_IMMEDIATE':
        return '#DC2626';
      case 'HIGH_PRIORITY':
        return '#EA580C';
      default:
        return '#0284C7';
    }
  };

  const getUrgencyBg = (u: string) => {
    switch (u) {
      case 'CRITICAL_IMMEDIATE':
        return '#FEF2F2';
      case 'HIGH_PRIORITY':
        return '#FFF7ED';
      default:
        return '#E0F2FE';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DELIVERED':
        return '#059669';
      case 'EN_ROUTE':
        return '#0284C7';
      case 'DISPATCHED':
        return '#D97706';
      default:
        return '#64748B';
    }
  };

  const getStatusBg = (s: string) => {
    switch (s) {
      case 'DELIVERED':
        return '#ECFDF5';
      case 'EN_ROUTE':
        return '#E0F2FE';
      case 'DISPATCHED':
        return '#FFFBEB';
      default:
        return '#F1F5F9';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>FIELD RELIEF & AID REQUEST</Text>
          <Text style={styles.headerSub}>Emergency Water Tanker & Medical Respite Dispatch</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Assistance Request Form */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>1. SELECT RELIEF CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat, idx) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Urgency Selector */}
          <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>2. URGENCY LEVEL</Text>
          <View style={styles.urgencyRow}>
            {(['CRITICAL_IMMEDIATE', 'HIGH_PRIORITY', 'ROUTINE_AID'] as const).map((lvl) => {
              const isSel = urgency === lvl;
              const uColor = getUrgencyColor(lvl);
              const uBg = getUrgencyBg(lvl);
              const label =
                lvl === 'CRITICAL_IMMEDIATE'
                  ? 'Critical SOS'
                  : lvl === 'HIGH_PRIORITY'
                  ? 'High Priority'
                  : 'Standard Aid';

              return (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.urgencyBtn,
                    isSel && { borderColor: uColor, backgroundColor: uBg },
                  ]}
                  onPress={() => setUrgency(lvl)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.urgencyDot, { backgroundColor: uColor }]} />
                  <Text style={[styles.urgencyBtnText, isSel && { color: uColor, fontWeight: '800' }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Input Details */}
          <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>3. CONTACT & LOCATION</Text>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Current Locality</Text>
            <View style={styles.localityBox}>
              <Ionicons name="location-sharp" size={16} color="#0284C7" />
              <Text style={styles.localityBoxText}>
                {selectedLocality?.name || 'Yelahanka Satellite Town'}, {selectedLocality?.city || 'Bengaluru'}
              </Text>
            </View>
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Contact Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Contact Name (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Specific Location / Landmark Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g. Near Community Hall Gate 2, 15 people in need of drinking water"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="send-check" size={20} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>
              {submitting ? 'Dispatching Request...' : 'Dispatch Heat Relief Request'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Requests Tracker */}
        <View style={styles.trackerSection}>
          <View style={styles.trackerHeader}>
            <MaterialCommunityIcons name="clipboard-text-clock" size={18} color="#0284C7" />
            <Text style={styles.trackerTitle}>ACTIVE REQUESTS STATUS TRACKER</Text>
          </View>

          {requests.map((req) => {
            const uCol = getUrgencyColor(req.urgency);
            const uBg = getUrgencyBg(req.urgency);
            const sCol = getStatusColor(req.status);
            const sBg = getStatusBg(req.status);

            return (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestCardTop}>
                  <View>
                    <Text style={styles.requestId}>{req.id}</Text>
                    <Text style={styles.requestCategory}>{req.category}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sBg }]}>
                    <Text style={[styles.statusBadgeText, { color: sCol }]}>{req.status}</Text>
                  </View>
                </View>

                <Text style={styles.requestNotes}>{req.notes}</Text>

                <View style={styles.requestCardFooter}>
                  <View style={styles.etaRow}>
                    <Feather name="clock" size={12} color="#64748B" />
                    <Text style={styles.etaText}>
                      ETA: {req.etaMinutes} mins • {req.timestamp}
                    </Text>
                  </View>
                  <View style={[styles.urgencyTag, { backgroundColor: uBg }]}>
                    <Text style={[styles.urgencyTagText, { color: uCol }]}>
                      {req.urgency.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {req.assignedResponder && (
                  <View style={styles.responderBox}>
                    <Ionicons name="shield-checkmark" size={14} color="#059669" />
                    <Text style={styles.responderText}>{req.assignedResponder}</Text>
                  </View>
                )}
              </View>
            );
          })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.6,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  formCard: {
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
  formSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  categoryChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  inputWrap: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  localityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  localityBoxText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#0F172A',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 18,
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trackerSection: {
    marginBottom: 16,
  },
  trackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  trackerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  requestCard: {
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
  requestCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  requestId: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },
  requestCategory: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  requestNotes: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginVertical: 6,
  },
  requestCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaText: {
    fontSize: 11,
    color: '#64748B',
  },
  urgencyTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  responderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 8,
    gap: 6,
  },
  responderText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
});
