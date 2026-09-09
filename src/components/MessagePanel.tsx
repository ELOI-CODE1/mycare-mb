import React, { useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { EmptyState, Text } from './ui'
import { colors, radius, spacing } from '../theme'
import { api, apiErrorMessage } from '../api/client'

type Message = { id: string; body: string; sender: 'user' | 'admin'; createdAt: string }

export default function MessagePanel({ accent }: { accent: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  React.useEffect(() => {
    let alive = true
    api.get<{ conversations: Array<{ id: string }> }>('/support/conversations')
      .then(async (response) => {
        const conversation = response.data.conversations[0] || (await api.post<{ conversation: { id: string } }>('/support/conversations')).data.conversation
        const messageResponse = await api.get<{ messages: Message[] }>(`/support/conversations/${conversation.id}/messages`)
        if (alive) { setConversationId(conversation.id); setMessages(messageResponse.data.messages) }
      })
      .catch((err) => { if (alive) setError(apiErrorMessage(err, 'Support is temporarily unavailable.')) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const send = async () => {
    const body = draft.trim()
    if (!body || sending) return
    if (!conversationId) return
    setSending(true)
    try {
      const response = await api.post<{ message: Message }>(`/support/conversations/${conversationId}/messages`, { body })
      setMessages((current) => [...current, response.data.message])
      setDraft('')
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))
    } catch (error) { setError(apiErrorMessage(error, 'Message could not be sent.')) } finally { setSending(false) }
  }

  return (
    <View style={styles.panel}>
      <Text variant="heading">Message our team</Text>
      <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Your message appears here immediately while it is sent.</Text>
      {loading ? <ActivityIndicator color={accent} style={{ marginVertical: spacing.xl }} /> : error ? <Text color={colors.danger} style={{ marginTop: spacing.lg }}>{error}</Text> : messages.length === 0 ? (
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
