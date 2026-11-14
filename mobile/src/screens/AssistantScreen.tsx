import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { ChatMessage, CoolingCentre, Locality } from '../types';
import { LOCALITIES, COOLING_CENTRES } from '../data/mockData';
import {
  processAssistantQuery,
  SUGGESTED_PROMPTS,
  AssistantResponse,
} from '../services/assistantEngine';

interface Props {
  selectedLocality?: Locality;
  onBack?: () => void;
}

export default function AssistantScreen({ selectedLocality = LOCALITIES[0], onBack }: Props) {
  const currentLocality = selectedLocality || LOCALITIES[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I am HeatShield AI, your mobile thermal health assistant.\n\nToday's heat index in ${currentLocality.name} is ${currentLocality.heatIndex}°C (${currentLocality.riskLevel} Risk). How can I protect your health and hydration right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: [
        'What is my heat risk right now?',
        'Find closest drinking water',
        'How to treat heat exhaustion?',
        'Is it safe to run outside today?',
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollViewRef = useRef<any>(null);

  // Subtle breathing animation for live status dot and mic state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleSend = (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTyping(true);
    setIsListening(false);

    // Process using domain-specific intelligence engine
    setTimeout(() => {
      const response: AssistantResponse = processAssistantQuery(trimmed, currentLocality);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: response.quickReplies,
        severity: response.severity,
        relatedShelter: response.relatedShelter,
      };

      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 650);
  };

  const handleVoiceInputToggle = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    // Voice recognition simulation for mobile experience
    setTimeout(() => {
      setIsListening(false);
      setInputText('What is my heat risk right now?');
    }, 1800);
  };

  const handleEmergencyCall = (phoneNumber = '108') => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Emergency Helpline', `Please dial ${phoneNumber} directly from your phone.`);
    });
  };

  const handleNavigateShelter = (shelter: CoolingCentre) => {
    const query = encodeURIComponent(`${shelter.name}, ${shelter.address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
      Alert.alert('Location', `${shelter.name}\n${shelter.address}`);
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
      {/* 1. Header with Live Status Dot */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
              <Feather name="arrow-left" size={20} color="#0F172A" />
            </TouchableOpacity>
          )}
          <View style={styles.shieldBadge}>
            <MaterialCommunityIcons name="shield-sun" size={22} color="#0284C7" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>HeatShield AI Assistant</Text>
            <View style={styles.statusRow}>
              <Animated.View
                style={[
                  styles.liveDot,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Text style={styles.statusText}>Live • Urban Heat Intelligence</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.sosHeaderBtn}
          onPress={() => handleEmergencyCall('108')}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={13} color="#DC2626" />
          <Text style={styles.sosHeaderText}>108 SOS</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Conversational Message Bubble List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((item) => {
          const isUser = item.sender === 'user';
          const isUrgent = item.severity === 'urgent';

          return (
            <View
              key={item.id}
              style={[
                styles.messageRow,
                isUser ? styles.userMessageRow : styles.assistantMessageRow,
              ]}
            >
              {/* Branded shield badge on left for AI Assistant */}
              {!isUser && (
                <View style={styles.botShieldAvatar}>
                  <MaterialCommunityIcons name="shield-check" size={16} color="#0284C7" />
                </View>
              )}

              <View
                style={[
                  styles.bubbleContainer,
                  isUser ? styles.userBubbleContainer : styles.botBubbleContainer,
                ]}
              >
                {/* Assistant Label Header */}
                {!isUser && (
                  <View style={styles.botHeaderLine}>
                    <Text style={styles.botName}>HeatShield AI</Text>
                    {isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Ionicons name="alert-circle" size={12} color="#DC2626" />
                        <Text style={styles.urgentBadgeText}>URGENT</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Message Bubble: User (Blue) vs AI Assistant (White Clean Card) */}
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.botBubble,
                    isUrgent && styles.botBubbleUrgent,
                  ]}
                >
                  <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                    {item.text}
                  </Text>

                  {/* Contextual Action: Cooling Shelter Card */}
                  {item.relatedShelter && (
                    <View style={styles.shelterCard}>
                      <View style={styles.shelterCardHeader}>
                        <Ionicons name="location" size={16} color="#0284C7" />
                        <Text style={styles.shelterCardTitle} numberOfLines={1}>
                          {item.relatedShelter.name}
                        </Text>
                      </View>
                      <Text style={styles.shelterCardAddress}>
                        {item.relatedShelter.address}
                      </Text>
                      <View style={styles.shelterActionRow}>
                        <TouchableOpacity
                          style={styles.shelterNavBtn}
                          onPress={() => handleNavigateShelter(item.relatedShelter!)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="navigate" size={13} color="#FFF" />
                          <Text style={styles.shelterNavBtnText}>Open in Maps</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.shelterCallBtn}
                          onPress={() => handleEmergencyCall(item.relatedShelter!.contactPhone)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="call" size={13} color="#0284C7" />
                          <Text style={styles.shelterCallBtnText}>Call Shelter</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Contextual Action: Emergency 108 Call Button */}
                  {isUrgent && (
                    <TouchableOpacity
                      style={styles.emergencyActionBtn}
                      onPress={() => handleEmergencyCall('108')}
                      activeOpacity={0.88}
                    >
                      <Ionicons name="call" size={15} color="#FFF" />
                      <Text style={styles.emergencyActionText}>Call Emergency Medical (108)</Text>
                    </TouchableOpacity>
                  )}

                  <Text
                    style={[
                      styles.timestampText,
                      isUser ? styles.userTimestamp : styles.botTimestamp,
                    ]}
                  >
                    {item.timestamp}
                  </Text>
                </View>

                {/* Quick Reply Pills */}
                {!isUser && item.quickReplies && item.quickReplies.length > 0 && (
                  <View style={styles.inlineChipsWrap}>
                    {item.quickReplies.map((reply, rIdx) => (
                      <TouchableOpacity
                        key={rIdx}
                        style={styles.inlineChip}
                        onPress={() => handleSend(reply)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.inlineChipText}>{reply}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Typing Indicator */}
        {typing && (
          <View style={[styles.messageRow, styles.assistantMessageRow]}>
            <View style={styles.botShieldAvatar}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#0284C7" />
            </View>
            <View style={styles.typingBubble}>
              <Animated.View
                style={[
                  styles.typingDot,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Text style={styles.typingText}>HeatShield AI is analyzing thermal telemetry...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 3. Quick-Action Suggestion Chips (Required 4 Prompts) */}
      <View style={styles.suggestionChipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionChipsScroll}
        >
          {SUGGESTED_PROMPTS.map((prompt, index) => {
            const icons = ['🌡️', '💧', '🩺', '🏃'];
            return (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSend(prompt)}
                activeOpacity={0.75}
              >
                <Text style={styles.suggestionChipIcon}>{icons[index % icons.length]}</Text>
                <Text style={styles.suggestionChipText}>{prompt}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Voice Listening Banner */}
      {isListening && (
        <View style={styles.voiceListeningBanner}>
          <Animated.View
            style={[
              styles.voicePulseCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Feather name="mic" size={15} color="#FFF" />
          </Animated.View>
          <Text style={styles.voiceListeningText}>
            Listening for your heat safety question...
          </Text>
          <TouchableOpacity onPress={() => setIsListening(false)}>
            <Ionicons name="close-circle" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Input Bar with Microphone & Send Button */}
      <View style={styles.inputContainer}>
        {/* Voice Input Microphone */}
        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={handleVoiceInputToggle}
          activeOpacity={0.7}
        >
          <Feather
            name={isListening ? 'mic-off' : 'mic'}
            size={19}
            color={isListening ? '#FFF' : '#0284C7'}
          />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask HeatShield AI (symptoms, water, run)..."
          placeholderTextColor="#94A3B8"
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && !isListening && styles.sendButtonDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
          activeOpacity={0.88}
        >
          <Ionicons name="arrow-up" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },

  // 1. Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  shieldBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  sosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  sosHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },

  // 2. Chat Scroll & Bubbles
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  botShieldAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubbleContainer: {
    maxWidth: '85%',
  },
  userBubbleContainer: {
    alignItems: 'flex-end',
  },
  botBubbleContainer: {
    alignItems: 'flex-start',
  },
  botHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    marginLeft: 4,
  },
  botName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },

  // Bubbles
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#0284C7', // Clean primary blue
    borderBottomRightRadius: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  botBubbleUrgent: {
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
    backgroundColor: '#FEF2F2',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  botText: {
    color: '#1E293B',
  },
  timestampText: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  botTimestamp: {
    color: '#94A3B8',
  },

  // Shelter Card inside Bot Message
  shelterCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  shelterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shelterCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    flex: 1,
  },
  shelterCardAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  shelterActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  shelterNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  shelterNavBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  shelterCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  shelterCallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },

  // Emergency Action Button inside Bot Message
  emergencyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  emergencyActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },

  // Inline Quick Reply Chips under messages
  inlineChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  inlineChip: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  inlineChipText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },

  // Typing Indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },

  // 3. Quick-Action Suggestion Chips (Required 4 Prompts)
  suggestionChipsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
  },
  suggestionChipsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 6,
  },
  suggestionChipIcon: {
    fontSize: 13,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  // Voice Listening Banner
  voiceListeningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderTopWidth: 1,
    borderTopColor: '#BAE6FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  voicePulseCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceListeningText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },

  // 4. Input Bar
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    color: '#0F172A',
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
});
