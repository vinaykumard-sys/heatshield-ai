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
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';

export interface MandatoryUpdateModalProps {
  visible: boolean;
  installedVersion?: string;
  requiredVersion?: string;
  downloadUrl?: string;
  onCheckAgain?: () => Promise<boolean>;
  onDismiss?: () => void;
}

export default function MandatoryUpdateModal({
  visible,
  installedVersion = '1.0.2',
  requiredVersion = '1.5.0',
  downloadUrl = 'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk',
  onCheckAgain,
  onDismiss,
}: MandatoryUpdateModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | null>(null);

  const handleUpdatePress = async () => {
    setDownloading(true);
    setStatusType('info');
    setStatusMessage('Downloading latest HeatShield AI APK (v1.5.0)... Check notifications to install.');
    try {
      const baseUrl = downloadUrl || 'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI-v1.5.0.apk';
      const targetUrl = baseUrl.includes('?') 
        ? `${baseUrl}&v=1.5.0&t=${Date.now()}` 
        : `${baseUrl}?v=1.5.0&t=${Date.now()}`;

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

  const handleCheckAgainPress = async () => {
    if (checking) return;
    setChecking(true);
    setStatusType('info');
    setStatusMessage('Checking installed version against latest release...');

    try {
      if (onCheckAgain) {
        const isNowUpdated = await onCheckAgain();
        if (isNowUpdated) {
          setStatusType('success');
          setStatusMessage(`Verified! HeatShield AI is up to date (v${requiredVersion}). Launching normal mode...`);
          setTimeout(() => {
            if (onDismiss) {
              onDismiss();
            }
          }, 1200);
          return;
        } else {
          setStatusType('warning');
          setStatusMessage(`Currently detected v${installedVersion}. Please complete installing the APK, then tap Check Again.`);
        }
      } else {
        setStatusType('info');
        setStatusMessage('Re-checking version...');
      }
    } catch (err) {
      console.warn('[MandatoryUpdateModal] Check again error:', err);
      setStatusType('warning');
      setStatusMessage('Network check timed out. Please verify your connection and try again.');
    } finally {
      setChecking(false);
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

            {/* Live Status Feedback Banner if present */}
            {statusMessage && (
              <View
                style={[
                  styles.statusBanner,
                  statusType === 'success' && styles.statusBannerSuccess,
                  statusType === 'warning' && styles.statusBannerWarning,
                ]}
              >
                {checking ? (
                  <ActivityIndicator size="small" color="#0284C7" style={{ marginRight: 8 }} />
                ) : statusType === 'success' ? (
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginRight: 8 }} />
                ) : statusType === 'warning' ? (
                  <Ionicons name="alert-circle" size={18} color="#D97706" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="information-circle" size={18} color="#0284C7" style={{ marginRight: 8 }} />
                )}
                <Text
                  style={[
                    styles.statusText,
                    statusType === 'success' && styles.statusTextSuccess,
                    statusType === 'warning' && styles.statusTextWarning,
                  ]}
                >
                  {statusMessage}
                </Text>
              </View>
            )}

            {/* What's New Release Notes */}
            <View style={styles.releaseNotesBox}>
              <Text style={styles.releaseNotesHeader}>What's new in v{requiredVersion}:</Text>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletEmoji}>⚡</Text>
                <Text style={styles.bulletText}>Mobile-first React Native UI & responsive layout</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletEmoji}>🔒</Text>
                <Text style={styles.bulletText}>Secure Supabase authentication & role-based security</Text>
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
                <Text style={styles.stepDesc}>Tap Install, then reopen or tap 'Check Again' below</Text>
              </View>
            </View>

            {/* Safety Protocol Advisory */}
            <Text style={styles.blockingNote}>
              Due to safety-critical urban heat wave telemetry and emergency protocols, this update cannot be postponed.
            </Text>

            {/* Action Buttons: 1. Update Now (APK) */}
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

            {/* Action Buttons: 2. Re-check / I've Updated */}
            <TouchableOpacity
              style={styles.checkAgainButton}
              onPress={handleCheckAgainPress}
              activeOpacity={0.8}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator color="#0284C7" size="small" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="refresh" size={16} color="#0284C7" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.checkAgainButtonText}>
                {checking ? 'VERIFYING VERSION...' : "I'VE UPDATED / CHECK AGAIN"}
              </Text>
            </TouchableOpacity>

            {/* Action Buttons: 3. Close & Continue (Dismiss Screen & Function Normally) */}
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => {
                setStatusType('success');
                setStatusMessage('Update confirmed. Launching HeatShield AI...');
                setTimeout(() => {
                  if (onDismiss) {
                    onDismiss();
                  }
                }, 400);
              }}
              activeOpacity={0.75}
            >
              <Feather name="check-circle" size={15} color="#0369A1" style={{ marginRight: 6 }} />
              <Text style={styles.dismissButtonText}>
                I've Updated / Continue to HeatShield AI
              </Text>
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
    marginBottom: 10,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.8,
  },
  checkAgainButton: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  checkAgainButtonText: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.6,
  },
  dismissButton: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dismissButtonText: {
    color: '#0369A1',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  statusBanner: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusBannerSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusBannerWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#0369A1',
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: '#15803D',
    fontWeight: '700',
  },
  statusTextWarning: {
    color: '#B45309',
    fontWeight: '600',
  },
});
