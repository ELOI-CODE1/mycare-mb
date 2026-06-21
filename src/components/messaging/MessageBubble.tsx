import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../ui'
import { colors, spacing, radius } from '../../theme'

export type Message = {
  id: number
  user_id: string
  sender: 'user' | 'admin'
  body: string
  is_read: boolean
  created_at: string
}

// `mine` = the message is from the person currently viewing (right-aligned).
export default function MessageBubble({ body, time, mine, accent }: { body: string; time: string; mine: boolean; accent: string }) {
  return (
    <View style={[styles.row, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.bubble, mine ? { backgroundColor: accent, borderBottomRightRadius: 4 } : { backgroundColor: colors.gray100, borderBottomLeftRadius: 4 }]}>
        <Text color={mine ? colors.white : colors.text}>{body}</Text>
        <Text variant="caption" color={mine ? 'rgba(255,255,255,0.8)' : colors.gray400} style={styles.time}>
          {time}
        </Text>
      </View>
    </View>
  )
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.sm },
  bubble: { maxWidth: '80%', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg },
  time: { marginTop: 2, alignSelf: 'flex-end' },
})
