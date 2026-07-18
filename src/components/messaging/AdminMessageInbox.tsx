import React, { useEffect, useRef, useState } from 'react'
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { Text, Card, Badge, EmptyState } from '../ui'
import MessageBubble, { formatTime, type Message } from './MessageBubble'
import { colors, spacing, radius } from '../../theme'

type Thread = {
  userId: string
  name: string
  email: string
  lastBody: string
  lastAt: string
  unread: number
}

export default function AdminMessageInbox({ accent }: { accent: string }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    loadThreads()
  }, [])

  useEffect(() => {
    const channel = supabase.channel('messages-admin')
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      async () => {
        await loadThreads()
        if (active?.userId) {
          await loadThreadMessages(active.userId)
        }
      },
    )

    channel.subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [active?.userId])

  const loadThreads = async () => {
    const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: false })
    const all = (msgs as Message[]) || []

    const byUser = new Map<string, { last: Message; unread: number }>()
    for (const m of all) {
      const entry = byUser.get(m.user_id)
      if (!entry) byUser.set(m.user_id, { last: m, unread: 0 })
      if (m.sender === 'user' && !m.is_read) {
        byUser.get(m.user_id)!.unread += 1
      }
    }

    const userIds = [...byUser.keys()]
    const profileMap = new Map<string, { full_name: string; email: string }>()
    if (userIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      profiles?.forEach((p: any) => profileMap.set(p.id, p))
    }

    const list: Thread[] = userIds.map((id) => {
      const e = byUser.get(id)!
      const p = profileMap.get(id)
      return {
        userId: id,
        name: p?.full_name || 'Unknown',
        email: p?.email || '',
        lastBody: e.last.body,
        lastAt: e.last.created_at,
        unread: e.unread,
      }
    })
    list.sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt))
    setThreads(list)
    setLoading(false)
  }

  const loadThreadMessages = async (userId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setMessages((data as Message[]) || [])
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender', 'user')
      .eq('is_read', false)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50)
  }

  const openThread = async (thread: Thread) => {
    setActive(thread)
    await loadThreadMessages(thread.userId)
  }

  const reply = async () => {
    const body = text.trim()
    if (!body || !active) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({ user_id: active.userId, sender: 'admin', body })
    setSending(false)
    if (!error) {
      setText('')
      const { data } = await supabase.from('messages').select('*').eq('user_id', active.userId).order('created_at', { ascending: true })
      setMessages((data as Message[]) || [])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    }
  }

  // ── Thread view ──
  if (active) {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backRow} onPress={() => { setActive(null); loadThreads() }}>
          <Ionicons name="chevron-back" size={20} color={accent} />
          <View>
            <Text variant="label">{active.name}</Text>
            <Text variant="caption" muted>{active.email}</Text>
          </View>
        </TouchableOpacity>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.md }}>
          {messages.map((m) => (
            // For admin, admin messages are "mine" (right-aligned).
            <MessageBubble key={m.id} body={m.body} time={formatTime(m.created_at)} mine={m.sender === 'admin'} accent={accent} />
          ))}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          style={styles.composerContainer}
        >
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Reply…"
              placeholderTextColor={colors.gray400}
              value={text}
              onChangeText={setText}
              multiline
              autoCapitalize="sentences"
              textAlignVertical="top"
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: accent }]} onPress={reply} disabled={sending || !text.trim()}>
              <Ionicons name="send" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    )
  }

  // ── Inbox list ──
  if (loading) return <ActivityIndicator color={accent} style={{ marginTop: spacing.xl }} />
  if (threads.length === 0) return <EmptyState icon="chatbubbles-outline" title="No messages" subtitle="Customer messages will appear here." />

  return (
    <ScrollView style={{ flex: 1 }}>
      {threads.map((t) => (
        <TouchableOpacity key={t.userId} onPress={() => openThread(t)} activeOpacity={0.8}>
          <Card>
            <View style={styles.threadTop}>
              <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>{t.name}</Text>
              {t.unread > 0 && <Badge label={String(t.unread)} bg={accent} fg={colors.white} />}
            </View>
            <Text variant="caption" muted numberOfLines={1} style={{ marginTop: 2 }}>{t.lastBody}</Text>
            <Text variant="caption" color={colors.gray400} style={{ marginTop: 2 }}>{formatTime(t.lastAt)}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  threadTop: { flexDirection: 'row', alignItems: 'center' },
  composerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.surface,
  },
  composer: { flexDirection: 'row', alignItems: 'flex-end' },
  input: { flex: 1, minHeight: 44, maxHeight: 120, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, backgroundColor: colors.surface },
  sendBtn: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
})
