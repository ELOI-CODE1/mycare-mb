import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { EmptyState, Text } from './ui'
import { colors, radius, spacing } from '../theme'
import { api, apiErrorMessage } from '../api/client'

type Message = {
  id: string
  body: string
  senderId?: string
  sender?: 'user' | 'admin'
  senderRole?: string
  senderName?: string
  createdAt: string
}

function isMine(message: Message, myId?: string): boolean {
  if (myId && message.senderId) return message.senderId === myId
  return (message.senderRole ?? message.sender ?? 'user') !== 'admin'
}

export default function MessagePanel({ accent }: { accent: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [myId, setMyId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const me = await api.get<{ user: { id: string } }>('/auth/me').catch(() => null)
      if (me) setMyId(me.data.user.id)
      const conv = await api.get<{ conversations: Array<{ id: string }> }>('/support/conversations')
      const conversation = conv.data.conversations[0] || (await api.post<{ conversation: { id: string } }>('/support/conversations')).data.conversation
      const messageResponse = await api.get<{ messages: Message[] }>(`/support/conversations/${conversation.id}/messages`)
      setConversationId(conversation.id)
      setMessages(messageResponse.data.messages)
    } catch (err) {
      setError(apiErrorMessage(err, 'Support is temporarily unavailable.'))
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let alive = true
    load(true)
    // Poll for new messages every 8s.
    const timer = setInterval(async () => {
      if (!alive || documentHidden()) return
      try {
        if (!conversationId && !messages.length) return
        const id = conversationId ?? (await api.get<{ conversations: Array<{ id: string }> }>('/support/conversations')).data.conversations[0]?.id
        if (!id) return
        if (!conversationId) setConversationId(id)
        const last = messages[messages.length - 1]?.createdAt
        const res = await api.get<{ messages: Message[] }>(`/support/conversations/${id}/messages${last ? `?since=${encodeURIComponent(last)}` : ''}`)
        if (res.data.messages.length) {
          setMessages((current) => {
            const known = new Set(current.map((m) => m.id))
            return [...current, ...res.data.messages.filter((m) => !known.has(m.id))]
          })
          requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))
        }
      } catch { /* keep polling quietly */ }
    }, 8000)
    return () => { alive = false; clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  const send = async () => {
    const body = draft.trim()
    if (!body || sending || !conversationId) return
    setSending(true)
    // Optimistic bubble.
    const tempId = `temp-${Date.now()}`
    setMessages((current) => [...current, { id: tempId, body, senderRole: 'user', createdAt: new Date().toISOString() }])
    setDraft('')
    try {
      const response = await api.post<{ message: Message }>(`/support/conversations/${conversationId}/messages`, { body })
      setMessages((current) => current.map((m) => (m.id === tempId ? response.data.message : m)))
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))
    } catch (error) {
      setMessages((current) => current.filter((m) => m.id !== tempId))
      setDraft(body)
      setError(apiErrorMessage(error, 'Message could not be sent.'))
    } finally { setSending(false) }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text variant="heading">Message our team</Text>
          <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Replies appear automatically.</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Refresh messages" onPress={() => load(false)} style={styles.retry}>
          <Ionicons name="refresh-outline" size={18} color={accent} />
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color={accent} style={{ marginVertical: spacing.xl }} /> : error && messages.length === 0 ? (
        <View>
          <Text color={colors.danger} style={{ marginTop: spacing.lg }}>{error}</Text>
          <TouchableOpacity onPress={() => load(true)} style={styles.retryRow}><Text color={accent}>Try again</Text></TouchableOpacity>
        </View>
      ) : messages.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No messages yet" subtitle="Send a message to support below." />
      ) : (
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messageContent} keyboardShouldPersistTaps="handled">
          {messages.map((message) => {
            const mine = isMine(message, myId)
            return (
              <View key={message.id} style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
                <View style={[styles.bubble, mine ? { backgroundColor: accent, alignSelf: 'flex-end' } : styles.theirBubble]}>
                  {!mine ? <Text variant="caption" color={accent} style={styles.sender}>{message.senderName || 'Support'}</Text> : null}
                  <Text color={mine ? colors.white : colors.text}>{message.body}</Text>
                  <Text variant="caption" color={mine ? '#ffffffcc' : colors.gray500} style={styles.time}>
                    {message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}
                  </Text>
                </View>
              </View>
            )
          })}
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

function documentHidden(): boolean {
  try {
    return typeof document !== 'undefined' && document.hidden
  } catch { return false }
}

const styles = StyleSheet.create({
  panel: { padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  retry: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray100 },
  retryRow: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  messages: { maxHeight: 280, marginTop: spacing.md },
  messageContent: { gap: spacing.sm, paddingVertical: spacing.xs },
  row: { flexDirection: 'row' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '86%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  theirBubble: { backgroundColor: colors.gray100, alignSelf: 'flex-start' },
  sender: { fontWeight: '700', marginBottom: 2 },
  time: { marginTop: 4, fontSize: 10 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md, gap: spacing.sm },
  input: { flex: 1, minHeight: 46, maxHeight: 120, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, backgroundColor: colors.surface },
  send: { width: 46, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
})
