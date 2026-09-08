import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { Text } from './ui'
import { colors, spacing, roleAccent, type Role } from '../theme'

export default function AppHeader({ role, title = 'Home' }: { role: Role | string; title?: string }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const firstName = user?.fullName?.split(' ')[0] || 'there'
  const initials = user?.fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'MC'

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) + spacing.sm }]}>
      <View>
        <Text variant="caption" muted>MYCARE+</Text>
        <Text variant="title" style={styles.title}>{title}</Text>
        <Text variant="caption" muted>Good to see you, {firstName}</Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.iconButton} accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
          <View style={styles.notificationDot} />
        </View>
        <View style={[styles.avatar, { backgroundColor: roleAccent(role) }]}>
          <Text variant="label" color={colors.white}>{initials}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { marginTop: 2, marginBottom: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
