import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';

export interface MandatoryUpdateModalProps {
  visible: boolean;
  installedVersion?: string;
  requiredVersion?: string;
  downloadUrl?: string;
}

export default function MandatoryUpdateModal({
  visible,
  installedVersion = '1.0.2',
  requiredVersion = '1.1.0',
  downloadUrl = 'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk',
}: MandatoryUpdateModalProps) {
  const handleUpdatePress = async () => {
    try {
      const url = downloadUrl || 'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk');
      }
    } catch (err) {
      console.warn('[MandatoryUpdateModal] Failed to open download URL:', err);
      // Fallback
      Linking.openURL('https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk').catch(() => {});
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Blocking: Non-dismissible on Android back button
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Logo / Badge */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="shield-alert" size={44} color="#EF4444" />
            </View>
          </View>

          {/* Header */}
          <View style={styles.badgeRow}>
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalBadgeText}>CRITICAL UPDATE REQUIRED</Text>
            </View>
          </View>

          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.subtitle}>
            A mandatory security and emergency navigation update is required to continue using HeatShield AI.
          </Text>

          {/* Version Comparison Pill */}
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>
              Installed: v{installedVersion}  •  Required: v{requiredVersion}
            </Text>
          </View>

          {/* Release Notes Bullet List */}
          <View style={styles.releaseNotesBox}>
            <Text style={styles.releaseNotesHeader}>What's new in v{requiredVersion}:</Text>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletEmoji}>⚡</Text>
              <Text style={styles.bulletText}>Mobile-first React Native UI</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletEmoji}>🔒</Text>
              <Text style={styles.bulletText}>Secure Supabase authentication</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletEmoji}>📲</Text>
              <Text style={styles.bulletText}>Free real-time Android push notifications</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletEmoji}>🗺️</Text>
              <Text style={styles.bulletText}>Turn-by-turn road navigation & cooling corridors</Text>
            </View>
          </View>

          {/* Mandatory Notice */}
          <Text style={styles.blockingNote}>
            Due to safety-critical heat wave telemetry and emergency response protocols, this update cannot be postponed.
          </Text>

          {/* Prominent Action Button */}
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdatePress}
            activeOpacity={0.88}
          >
            <Feather name="download" size={18} color="#060D1E" style={{ marginRight: 8 }} />
            <Text style={styles.updateButtonText}>UPDATE NOW (APK)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.92)', // High opacity backdrop to block background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0B1329',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    marginBottom: 8,
  },
  criticalBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  criticalBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  versionPill: {
    backgroundColor: '#060D1E',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 16,
  },
  versionText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  releaseNotesBox: {
    width: '100%',
    backgroundColor: '#060D1E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  releaseNotesHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  bulletEmoji: {
    fontSize: 15,
    marginRight: 10,
    width: 22,
    textAlign: 'center',
  },
  bulletText: {
    fontSize: 13,
    color: '#F1F5F9',
    fontWeight: '500',
    flex: 1,
  },
  blockingNote: {
    fontSize: 11,
    lineHeight: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  updateButton: {
    width: '100%',
    backgroundColor: '#06B6D4',
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  updateButtonText: {
    color: '#060D1E',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
});
