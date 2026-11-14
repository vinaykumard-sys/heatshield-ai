import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { INITIAL_EMERGENCY_CONTACTS, MOCK_USER_PROFILE } from '../data/mockData';
import { EmergencyContact, UserProfile } from '../types';
import { supabase } from '../services/supabase';

interface ProfileScreenProps {
  userEmail?: string | null;
  onLogout?: () => void;
}

export default function ProfileScreen({ userEmail, onLogout }: ProfileScreenProps = {}) {
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...MOCK_USER_PROFILE,
    email: userEmail || MOCK_USER_PROFILE.email,
  }));
  const [contacts, setContacts] = useState<EmergencyContact[]>(INITIAL_EMERGENCY_CONTACTS);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('Family');

  // Push & Alert preferences
  const [extremeHeatAlerts, setExtremeHeatAlerts] = useState(true);
  const [uvWarning, setUvWarning] = useState(true);
  const [smsFallbacks, setSmsFallbacks] = useState(true);
  const [vulnerableSeniorMode, setVulnerableSeniorMode] = useState(profile.hasElderlyAtHome);

  const handleToggleNotify = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isNotifiedOnAlert: !c.isNotifiedOnAlert } : c))
    );
  };

  const handleAddContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Incomplete Details', 'Please provide a contact name and phone number.');
      return;
    }

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: `${newName.trim()} (${newRelation})`,
      relation: newRelation,
      phone: newPhone.trim(),
      isNotifiedOnAlert: true,
    };

    setContacts((prev) => [...prev, newContact]);
    setNewName('');
    setNewPhone('');
    Alert.alert('Emergency Contact Added', 'This contact will now receive automated SMS alerts during extreme heat waves.');
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRoleChange = (newRole: UserProfile['role']) => {
    setProfile((prev) => ({ ...prev, role: newRole }));
    Alert.alert('Role Updated', `Active profile role switched to ${newRole}.`);
  };

  const handleLogout = () => {
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
              console.warn('[ProfileScreen] Sign out error:', err);
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{profile.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{profile.name}</Text>
              <Text style={styles.userPhone}>{profile.phone}</Text>
              <Text style={styles.userCity}>
                {profile.city} • {profile.email}
              </Text>
            </View>
          </View>

          {/* Role Badge & Selector */}
          <View style={styles.roleContainer}>
            <Text style={styles.sectionMiniLabel}>ACTIVE CITIZEN ROLE</Text>
            <View style={styles.roleChipsRow}>
              {(['Resident', 'Community Heat Warden', 'Health Officer'] as const).map((r) => {
                const isActive = profile.role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleChip, isActive && styles.roleChipActive]}
                    onPress={() => handleRoleChange(r)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Notification & Safety Alert Preferences */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="notifications-outline" size={18} color="#0284C7" />
            <Text style={styles.sectionTitle}>HEAT ALERT PREFERENCES</Text>
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefLabel}>IMD Red Alert Push Notifications</Text>
              <Text style={styles.prefDesc}>Loud sound alerts when heat index &gt; 44°C</Text>
            </View>
            <Switch
              value={extremeHeatAlerts}
              onValueChange={setExtremeHeatAlerts}
              trackColor={{ false: '#E2E8F0', true: '#0284C7' }}
              thumbColor={extremeHeatAlerts ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefLabel}>High UV Index Warnings</Text>
              <Text style={styles.prefDesc}>Midday notifications when UV exceeds level 8</Text>
            </View>
            <Switch
              value={uvWarning}
              onValueChange={setUvWarning}
              trackColor={{ false: '#E2E8F0', true: '#0284C7' }}
              thumbColor={uvWarning ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefLabel}>Offline SMS Broadcast Fallback</Text>
              <Text style={styles.prefDesc}>Receive SMS alerts even without mobile data</Text>
            </View>
            <Switch
              value={smsFallbacks}
              onValueChange={setSmsFallbacks}
              trackColor={{ false: '#E2E8F0', true: '#0284C7' }}
              thumbColor={smsFallbacks ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefLabel}>Vulnerable Family / Senior Mode</Text>
              <Text style={styles.prefDesc}>Early cooling alerts & low-heat thresholds</Text>
            </View>
            <Switch
              value={vulnerableSeniorMode}
              onValueChange={setVulnerableSeniorMode}
              trackColor={{ false: '#E2E8F0', true: '#059669' }}
              thumbColor={vulnerableSeniorMode ? '#FFFFFF' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Emergency SOS Contact List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="shield-account" size={18} color="#DC2626" />
            <Text style={styles.sectionTitle}>EMERGENCY NOTIFICATION CONTACTS</Text>
          </View>

          <Text style={styles.subtext}>
            These contacts receive your GPS position and distress dispatch during an SOS trigger.
          </Text>

          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactItemLeft}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>

              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={[styles.notifyToggle, contact.isNotifiedOnAlert && styles.notifyToggleActive]}
                  onPress={() => handleToggleNotify(contact.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.notifyToggleText, contact.isNotifiedOnAlert && styles.notifyToggleTextActive]}>
                    {contact.isNotifiedOnAlert ? 'Auto-SMS' : 'Silent'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteContactBtn}
                  onPress={() => handleDeleteContact(contact.id)}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add New Contact Form */}
          <View style={styles.addContactCard}>
            <Text style={styles.addContactHeading}>Add Emergency Contact</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Full Name"
              placeholderTextColor="#94A3B8"
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={styles.textInput}
              placeholder="Phone Number (+91 ...)"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <View style={styles.relationRow}>
              {['Family', 'Doctor', 'Neighbor', 'Work'].map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[styles.relChip, newRelation === rel && styles.relChipActive]}
                  onPress={() => setNewRelation(rel)}
                >
                  <Text style={[styles.relChipText, newRelation === rel && styles.relChipTextActive]}>
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={handleAddContact} activeOpacity={0.88}>
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Save Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System & Version Information */}
        <View style={styles.systemCard}>
          <Text style={styles.systemText}>HeatShield AI v1.2.0 (Android Mobile Native)</Text>
          <Text style={styles.systemSub}>
            Integrated with IMD Synoptic Radar, BBMP Disaster Relief & OpenStreetMap
          </Text>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Feather name="log-out" size={16} color="#DC2626" />
            <Text style={styles.logoutBtnText}>Sign Out of Device</Text>
          </TouchableOpacity>
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userPhone: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  userCity: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  roleContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  sectionMiniLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  roleChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#0284C7',
    fontWeight: '700',
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 16,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  prefTextCol: {
    flex: 1,
    marginRight: 10,
  },
  prefLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  prefDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  contactItemLeft: {
    flex: 1,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifyToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifyToggleActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  notifyToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  notifyToggleTextActive: {
    color: '#059669',
  },
  deleteContactBtn: {
    padding: 4,
  },
  addContactCard: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addContactHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#0F172A',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  relationRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  relChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  relChipActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  relChipText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  relChipTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  systemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  systemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  systemSub: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
});
