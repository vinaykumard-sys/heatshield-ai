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
            <Ionicons name="notifications-outline" size={18} color="#06B6D4" />
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
              trackColor={{ false: '#334155', true: '#06B6D4' }}
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
              trackColor={{ false: '#334155', true: '#06B6D4' }}
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
              trackColor={{ false: '#334155', true: '#06B6D4' }}
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
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor={vulnerableSeniorMode ? '#FFFFFF' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Emergency SOS Contact List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="shield-account" size={18} color="#EF4444" />
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
                  <Feather name="trash-2" size={16} color="#EF4444" />
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
              placeholderTextColor="#64748B"
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={styles.textInput}
              placeholder="Phone Number (+91 ...)"
              placeholderTextColor="#64748B"
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

            <TouchableOpacity style={styles.addBtn} onPress={handleAddContact} activeOpacity={0.85}>
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Save Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System & Version Information */}
        <View style={styles.systemCard}>
          <Text style={styles.systemText}>HeatShield AI v2.4 (Android Mobile Build)</Text>
          <Text style={styles.systemSub}>
            Integrated with IMD Synoptic Radar, BBMP Disaster Relief & OpenStreetMap
          </Text>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Feather name="log-out" size={16} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Sign Out of Device</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  profileCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    color: '#FFFFFF',
  },
  userPhone: {
    fontSize: 12,
    color: '#06B6D4',
    fontWeight: '600',
    marginTop: 2,
  },
  userCity: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  roleContainer: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
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
    backgroundColor: '#1E293B60',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleChipActive: {
    backgroundColor: '#06B6D420',
    borderColor: '#06B6D4',
  },
  roleChipText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 16,
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
    color: '#94A3B8',
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
    borderBottomColor: '#1E293B60',
  },
  prefTextCol: {
    flex: 1,
    marginRight: 10,
  },
  prefLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  prefDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B40',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  contactItemLeft: {
    flex: 1,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  contactPhone: {
    fontSize: 11,
    color: '#94A3B8',
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
    backgroundColor: '#1E293B',
  },
  notifyToggleActive: {
    backgroundColor: '#10B98125',
  },
  notifyToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  notifyToggleTextActive: {
    color: '#10B981',
  },
  deleteContactBtn: {
    padding: 4,
  },
  addContactCard: {
    marginTop: 12,
    backgroundColor: '#1E293B30',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#33415550',
  },
  addContactHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
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
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  relChipActive: {
    borderColor: '#06B6D4',
    backgroundColor: '#06B6D420',
  },
  relChipText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  relChipTextActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  systemCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    alignItems: 'center',
  },
  systemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  systemSub: {
    fontSize: 10,
    color: '#64748B',
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
    color: '#EF4444',
  },
});
