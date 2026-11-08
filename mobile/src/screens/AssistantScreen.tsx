import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { ChatMessage } from '../types';

export default function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Hello, I am HeatShield AI Health Assistant. Today\'s heat index in the city is high. How can I help protect you and your family right now?',
      timestamp: '12:00 PM',
      quickReplies: [
        'Signs of heat stroke vs exhaustion',
        'ORS & hydration recipe',
        'Protecting seniors & infants',
        'Emergency cooling techniques',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollViewRef = useRef<any>(null);

  const getAssistantResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('stroke') || q.includes('exhaustion') || q.includes('symptom')) {
      return '⚠️ HEAT EXHAUSTION vs HEAT STROKE:\n\n• Heat Exhaustion: Heavy sweating, pale skin, muscle cramps, dizziness, nausea. Action: Move to shade, loosen clothing, sip cool salted water or ORS.\n\n• Heat STROKE (MEDICAL EMERGENCY): Body temp > 40°C, RED/HOT DRY SKIN (sweating stops), confusion, fainting. Action: Call 108 immediately! Apply cold wet towels or ice packs to armpits, groin, and neck while waiting.';
    }

    if (q.includes('ors') || q.includes('hydration') || q.includes('recipe') || q.includes('water')) {
      return '💧 EMERGENCY HYDRATION GUIDELINE:\n\n• WHO-standard Oral Rehydration Salt (ORS):\n  - 1 Liter clean boiled/potable water\n  - 6 level teaspoons of sugar\n  - 1/2 level teaspoon of salt\n  - Stir until completely dissolved.\n\n• Drink 250ml every 20-30 minutes during outdoor activities. Avoid caffeinated sodas and pure sugar drinks as they accelerate dehydration.';
    }

    if (q.includes('senior') || q.includes('elderly') || q.includes('infant') || q.includes('baby')) {
      return '🛡️ VULNERABLE GROUPS HEAT DEFENSE:\n\n• Seniors (60+): Sweat glands become less responsive. Keep them in rooms with cross-ventilation or active cooling. Check blood pressure frequently if taking diuretics.\n• Infants & Children: Their body heats up 3-5 times faster than adults. NEVER leave a child in a parked vehicle even with windows cracked. Keep them dressed in light cotton.';
    }

    if (q.includes('cooling') || q.includes('cramp') || q.includes('first aid')) {
      return '❄️ RAPID FIRST AID FOR HEAT STRESS:\n\n1. Move the individual into direct shade or an air-conditioned room.\n2. Mist or spray skin with cool water while fanning vigorously.\n3. Elevate feet 6-8 inches if feeling faint.\n4. Apply damp towels to the forehead, back of the neck, and wrists.\n5. If vomiting occurs, turn them on their side to protect the airway and dial 1070/108.';
    }

    return `Under the current heatwave conditions, keep direct sunlight off your neck and head. Ensure you consume at least 3.5 to 4 liters of fluid today. If you need navigation to the nearest government cooling station or emergency assistance, tap the SOS Relief tab.`;
  };

  const handleSend = (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTyping(true);

    setTimeout(() => {
      const replyText = getAssistantResponse(textToSend);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: ['ORS & hydration recipe', 'Signs of heat stroke vs exhaustion', 'Emergency cooling techniques'],
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <MaterialCommunityIcons name="robot" size={20} color="#06B6D4" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>HeatShield Clinical AI</Text>
          <Text style={styles.headerSub}>Active Urban Heat & Hydration Counsel</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Ready</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((item) => {
          const isUser = item.sender === 'user';
          return (
            <View
              key={item.id}
              style={[
                styles.messageBubbleWrap,
                isUser ? styles.userBubbleWrap : styles.botBubbleWrap,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                  {item.text}
                </Text>
                <Text style={styles.timestampText}>{item.timestamp}</Text>
              </View>

              {/* Quick Prompt Pills */}
              {!isUser && item.quickReplies && (
                <View style={styles.quickRepliesContainer}>
                  {item.quickReplies.map((qr, qidx) => (
                    <TouchableOpacity
                      key={qidx}
                      style={styles.quickReplyChip}
                      onPress={() => handleSend(qr)}
                    >
                      <Text style={styles.quickReplyText}>{qr}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {typing && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>HeatShield AI is synthesizing medical guidance...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about hydration, symptoms, first aid..."
          placeholderTextColor="#64748B"
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
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
    backgroundColor: '#060D1E',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B1329',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#132147',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubbleWrap: {
    marginBottom: 16,
    maxWidth: '88%',
  },
  userBubbleWrap: {
    alignSelf: 'flex-end',
  },
  botBubbleWrap: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    padding: 14,
  },
  userBubble: {
    backgroundColor: '#0E3B3A',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  botBubble: {
    backgroundColor: '#0B1329',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ECFDF5',
  },
  botText: {
    color: '#E2E8F0',
  },
  timestampText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickReplyChip: {
    backgroundColor: '#0F1D3D',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickReplyText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  typingIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#0B1329',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#060D1E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1E293B',
  },
});
