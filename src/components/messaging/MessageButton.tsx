import React, { useCallback, useEffect, useState } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Text } from '../ui'
import MessagesModal from './MessagesModal'
import { colors } from '../../theme'

// Header button: opens the messaging modal and shows an unread badge.
// - Regular users: unread = admin replies they haven't read.
// - Admin: unread = customer messages not yet read.
export default function MessageButton({ accent }: { accent: string }) {
  const { user, role } = useAuth()
  const [visible, setVisible] = useState(false)
  const [unread, setUnread] = useState(0)

  const loadUnread = useCallback(async () => {
    if (!user?.id) return
    if (role === 'admin') {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender', 'user')
        .eq('is_read', false)
      setUnread(count ?? 0)
    } else {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sender', 'admin')
        .eq('is_read', false)
      setUnread(count ?? 0)
    }
  }, [user?.id, role])

  useEffect(() => {
    loadUnread()
  }, [loadUnread])

  const close = () => {
    setVisible(false)
    loadUnread()
  }

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.iconBtn} hitSlop={8}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.gray700} />
        {unread > 0 && (
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
              {unread > 99 ? '99+' : unread}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <MessagesModal visible={visible} onClose={close} accent={accent} />
    </>
  )
}

const styles = StyleSheet.create({
  iconBtn: { padding: 2 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700' as any, lineHeight: 14 },
})
