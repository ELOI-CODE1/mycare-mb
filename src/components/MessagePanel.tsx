import React, { useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { EmptyState, Text } from './ui'
import { colors, radius, spacing } from '../theme'

type Message = { id: string; body: string; sender: 'user' | 'admin'; createdAt: string }

export default function MessagePanel({ accent }: { accent: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const send = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    // Render immediately. The API adapter can replace this optimistic append later.
    setMessages((current) => [...current, { id: `${Date.now()}`, body, sender: 'user', createdAt: new Date().toISOString() }])
    setDraft('')
    setSending(false)
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))
  }

  return (
    <View style={styles.panel}>
      <Text variant="heading">Message our team</Text>
      <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Your message appears here immediately while it is sent.</Text>
      {messages.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No messages yet" subtitle="Send a message to support below." />
      ) : (
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messageContent} keyboardShouldPersistTaps="handled">
          {messages.map((message) => (
            <View key={message.id} style={[styles.bubble, { backgroundColor: accent, alignSelf: 'flex-end' }]}>
              <Text color={colors.white}>{message.body}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a message…"
          placeholderTextColor={colors.gray400}
          multiline
          maxLength={2000}
          style={styles.input}
          textAlignVertical="top"
          returnKeyType="default"
        />
        <TouchableOpacity accessibilityLabel="Send message" onPress={send} disabled={!draft.trim() || sending} style={[styles.send, { backgroundColor: draft.trim() ? accent : colors.gray300 }]}>
          {sending ? <ActivityIndicator color={colors.white} /> : <Ionicons name="send" size={18} color={colors.white} />}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: { padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg },
  messages: { maxHeight: 220, marginTop: spacing.md },
  messageContent: { gap: spacing.sm, paddingVertical: spacing.xs },
  bubble: { maxWidth: '86%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  composer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md, gap: spacing.sm },
  input: { flex: 1, minHeight: 46, maxHeight: 120, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, backgroundColor: colors.surface },
  send: { width: 46, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
})
