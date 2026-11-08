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
import { INITIAL_EMERGENCY_CONTACTS } from '../data/mockData';
import { EmergencyContact } from '../types';

export default function ProfileScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>(INITIAL_EMERGENCY_CONTACTS);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('Family');

  // Push notification preferences
  const [extremeHeatAlerts, setExtremeHeatAlerts] = useState(true);
  const [uvWarning, setUvWarning] = useState(true);
  const [smsFallbacks, setSmsFallbacks] = useState(true);
  const [vulnerableSeniorMode, setVulnerableSeniorMode] = useState(false);

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
    Alert.alert('Contact Added', 'This contact will now receive automated SMS alerts during extreme heat waves.');
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SETTINGS & PROFILE</Text>
        <Text style={styles.headerSub}>Emergency Dispatch & Alert Calibration</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarInitials}>AR</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.userName}>Arun Rao</Text>
            <Text style={styles.userLocality}>Primary: Yelahanka, Bengaluru (560064)</Text>
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>High Heat Vulnerability Zone</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contacts Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>EMERGENCY CONTACT CIRCLE</Text>
              <Text style={styles.sectionSub}>Auto-notified when you trigger SOS or when heat index {'>'} 45°C</Text>
            </View>
          </View>

          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>

              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={[
                    styles.notifyToggle,
                    contact.isNotifiedOnAlert ? styles.notifyToggleOn : styles.notifyToggleOff,
                  ]}
                  onPress={() => handleToggleNotify(contact.id)}
                >
                  <Text
                    style={[
                      styles.notifyToggleText,
                      contact.isNotifiedOnAlert ? styles.notifyOnText : styles.notifyOffText,
                    ]}
                  >
                    {contact.isNotifiedOnAlert ? 'Alerts ON' : 'Muted'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteContactBtn}
                  onPress={() => handleDeleteContact(contact.id)}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add Contact Mini Form */}
          <View style={styles.addContactForm}>
            <Text style={styles.addContactTitle}>+ Add Family or Physician</Text>
            <TextInput
              style={styles.textInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Contact Name"
              placeholderTextColor="#64748B"
            />
            <TextInput
              style={styles.textInput}
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="Phone Number (+91...)"
              keyboardType="phone-pad"
              placeholderTextColor="#64748B"
            />

            <TouchableOpacity
              style={styles.addContactBtn}
              onPress={handleAddContact}
            >
              <Text style={styles.addContactBtnText}>Save Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Push & SMS Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS & SAFETY ALERTS</Text>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.settingLabel}>Critical Heatwave Warning (Red Alert)</Text>
              <Text style={styles.settingSub}>Immediate push notification when Heat Index {'>'} 43°C</Text>
            </View>
            <Switch
              value={extremeHeatAlerts}
              onValueChange={setExtremeHeatAlerts}
              trackColor={{ false: '#334155', true: '#10B981' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.settingLabel}>High UV & Hydration Reminders</Text>
              <Text style={styles.settingSub}>Hourly fluid intake reminders during peak sunlight hours</Text>
            </View>
            <Switch
              value={uvWarning}
              onValueChange={setUvWarning}
              trackColor={{ false: '#334155', true: '#10B981' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.settingLabel}>Offline SMS Broadcast Fallback</Text>
              <Text style={styles.settingSub}>Receive critical BBMP alerts via cellular SMS when offline</Text>
            </View>
            <Switch
              value={smsFallbacks}
              onValueChange={setSmsFallbacks}
              trackColor={{ false: '#334155', true: '#10B981' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.settingLabel}>Senior & Vulnerable Individual Mode</Text>
              <Text style={styles.settingSub}>Lower thresholds for early heat warning triggers</Text>
            </View>
            <Switch
              value={vulnerableSeniorMode}
              onValueChange={setVulnerableSeniorMode}
              trackColor={{ false: '#334155', true: '#10B981' }}
            />
          </View>
        </View>

        {/* Offline Cache & Diagnostics */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>OFFLINE CAPABILITY & VERSION</Text>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Offline Cooling Shelters Cache</Text>
            <Text style={styles.diagVal}>Synchronized (48 shelters)</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Canopy Route Cache</Text>
            <Text style={styles.diagVal}>Active (OSRM 2.0)</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>App Version</Text>
            <Text style={styles.diagVal}>1.0.0 (Build 2026.11)</Text>
          </View>
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
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#0B1329',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    alignItems: 'center',
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#060D1E',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  userLocality: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  userBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
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
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#060D1E',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  contactPhone: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifyToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  notifyToggleOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  notifyToggleOff: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  notifyToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notifyOnText: {
    color: '#10B981',
  },
  notifyOffText: {
    color: '#64748B',
  },
  deleteContactBtn: {
    padding: 6,
  },
  addContactForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  addContactTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06B6D4',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#060D1E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 8,
  },
  addContactBtn: {
    backgroundColor: '#132147',
    borderWidth: 1,
    borderColor: '#06B6D4',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addContactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06B6D4',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  settingSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  diagLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  diagVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
});
