import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import {
  registerForPushNotificationsAsync,
  requestNotificationPermission,
} from '../services/pushNotificationService';

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: (token?: string) => void;
  userId?: string;
}

export default function NotificationPermissionModal({
  visible,
  onClose,
  onPermissionGranted,
  userId,
}: NotificationPermissionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleEnableNotifications = async () => {
    try {
      setLoading(true);
      const isGranted = await requestNotificationPermission();

      if (isGranted) {
        const record = await registerForPushNotificationsAsync(userId);
        if (onPermissionGranted) {
          onPermissionGranted(record?.token);
        }
      }
    } catch (err) {
      console.warn('[NotificationModal] Error enabling notifications:', err);
    } finally {
      setLoading(false);
      onClose(); // Cleanly close without locking the user out
    }
  };

  const handleMaybeLater = () => {
    // Dismiss without blocking the user
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Decorative Icon */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-sun" size={36} color="#06B6D4" />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Stay protected with HeatShield AI</Text>
          <Text style={styles.subtitle}>Allow notifications to receive:</Text>

          {/* Value Propositions / Bullet List */}
          <View style={styles.benefitList}>
            <View style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>🌡️</Text>
              <Text style={styles.benefitText}>Real-time heatwave alerts</Text>
            </View>

            <View style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>☀️</Text>
              <Text style={styles.benefitText}>Morning weather briefings</Text>
            </View>

            <View style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>🚨</Text>
              <Text style={styles.benefitText}>Local heat emergency warnings</Text>
            </View>

            <View style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>💧</Text>
              <Text style={styles.benefitText}>Cooling-centre availability</Text>
            </View>

            <View style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>🛣️</Text>
              <Text style={styles.benefitText}>Safe-route warnings</Text>
            </View>
          </View>

          <Text style={styles.privacyNote}>
            Zero spam. You can calibrate or mute alerts anytime in Settings.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.enableButton}
              onPress={handleEnableNotifications}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#060D1E" size="small" />
              ) : (
                <View style={styles.buttonInner}>
                  <Feather name="bell" size={16} color="#060D1E" style={{ marginRight: 6 }} />
                  <Text style={styles.enableButtonText}>Enable Notifications</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleMaybeLater}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0B1329',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 18,
  },
  benefitList: {
    width: '100%',
    backgroundColor: '#060D1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  benefitEmoji: {
    fontSize: 16,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E2E8F0',
    flex: 1,
  },
  privacyNote: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  enableButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#060D1E',
    fontWeight: '700',
    fontSize: 15,
  },
  laterButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  laterButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
});
