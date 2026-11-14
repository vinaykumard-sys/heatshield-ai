import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

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
  const [downloading, setDownloading] = useState(false);

  const handleUpdatePress = async () => {
    setDownloading(true);
    try {
      const targetUrl = downloadUrl || 'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk';
      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
      } else {
        await Linking.openURL('https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk');
      }
    } catch (err) {
      console.warn('[MandatoryUpdateModal] Failed to open download URL:', err);
      Linking.openURL('https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk').catch(() => {});
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Blocking: Non-dismissible on Android back button (strictly required)
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* HeatShield AI Brand Logo & Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="shield-alert" size={42} color="#0284C7" />
              </View>
            </View>

            {/* Brand Title Pill */}
            <View style={styles.badgeRow}>
              <View style={styles.brandBadge}>
                <MaterialCommunityIcons name="shield-sun" size={12} color="#0284C7" style={{ marginRight: 4 }} />
                <Text style={styles.brandBadgeText}>HEATSHIELD AI</Text>
              </View>
            </View>

            {/* Modal Title & Subtitle */}
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

            {/* What's New Release Notes */}
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

            {/* Clear APK Download / Installer Flow Steps */}
            <View style={styles.installerFlowBox}>
              <Text style={styles.installerFlowTitle}>Simple 3-Step Installation Flow</Text>
              <View style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepDesc}>Tap UPDATE NOW (APK) to begin downloading</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepDesc}>Open download notification or browser Downloads</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepDesc}>Tap Install to update HeatShield AI without losing data</Text>
              </View>
            </View>

            {/* Safety Protocol Advisory */}
            <Text style={styles.blockingNote}>
              Due to safety-critical urban heat wave telemetry and emergency protocols, this update cannot be postponed.
            </Text>

            {/* Primary Blue Action Button */}
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdatePress}
              activeOpacity={0.88}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
              ) : (
                <Feather name="download" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.updateButtonText}>UPDATE NOW (APK)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)', // Smooth backdrop dimming
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF', // Clean light theme card
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 10,
  },
  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    marginBottom: 8,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  brandBadgeText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 14,
  },
  versionPill: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  versionText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  releaseNotesBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  releaseNotesHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bulletEmoji: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  bulletText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
  },
  installerFlowBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  installerFlowTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  stepDesc: {
    fontSize: 12,
    color: '#14532D',
    fontWeight: '500',
    flex: 1,
  },
  blockingNote: {
    fontSize: 11,
    lineHeight: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    fontStyle: 'italic',
  },
  updateButton: {
    width: '100%',
    backgroundColor: '#0284C7', // Clean primary blue button
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.8,
  },
});
