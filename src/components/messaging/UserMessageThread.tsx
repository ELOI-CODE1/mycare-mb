import React, { useEffect, useRef, useState } from 'react'
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Text, EmptyState } from '../ui'
import MessageBubble, { formatTime, type Message } from './MessageBubble'
import { colors, spacing, radius } from '../../theme'

export default function UserMessageThread({ accent }: { accent: string }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase.channel(`messages-user-${user.id}`)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${user.id}`,
      },
      () => {
        load()
      },
    )

    channel.subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const load = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setMessages((data as Message[]) || [])
    setLoading(false)
    // Mark admin replies as read.
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('sender', 'admin')
      .eq('is_read', false)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50)
  }

  const send = async () => {
    const body = text.trim()
    if (!body || !user?.id) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({ user_id: user.id, sender: 'user', body })
    setSending(false)
    if (!error) {
      setText('')
      await load()
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator color={accent} style={{ marginTop: spacing.xl }} />
      ) : messages.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No messages yet" subtitle="Send a message to our team below." />
      ) : (
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.md }}>
          {messages.map((m) => (
            <MessageBubble key={m.id} body={m.body} time={formatTime(m.created_at)} mine={m.sender === 'user'} accent={accent} />
          ))}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        style={styles.composerContainer}
      >
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={colors.gray400}
            value={text}
            onChangeText={setText}
            multiline
            autoCapitalize="sentences"
            textAlignVertical="top"
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: accent }]} onPress={send} disabled={sending || !text.trim()}>
            <Ionicons name="send" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  composerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.surface,
  },
  composer: { flexDirection: 'row', alignItems: 'flex-end' },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  sendBtn: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
})
