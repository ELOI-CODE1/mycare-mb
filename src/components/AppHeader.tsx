import React from 'react'
import { Alert, Pressable, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { Text } from './ui'
import { colors, spacing, roleAccent, type Role } from '../theme'

export default function AppHeader({ role, title = 'Home', showCart = false }: { role: Role | string; title?: string; showCart?: boolean }) {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const rawFirstName = user?.fullName?.split(' ')[0]
  const firstName = rawFirstName && rawFirstName.toLowerCase() !== 'string' ? rawFirstName : 'there'
  const initials = user?.fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'MC'
  const navigateIfAvailable = (route: string, fallback: string) => {
    const routeNames = navigation.getState()?.routeNames || []
    if (routeNames.includes(route)) navigation.navigate(route)
    else Alert.alert(fallback)
  }

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) + spacing.sm }]}>
      <View>
        <Text variant="caption" muted>MYCARE+</Text>
        <Text variant="title" style={styles.title}>{title}</Text>
        <Text variant="caption" muted>Good to see you, {firstName}</Text>
      </View>
      <View style={styles.actions}>
        {showCart ? <Pressable style={styles.iconButton} accessibilityLabel="Open cart" onPress={() => navigateIfAvailable('Cart', 'Your cart is available from the Shop area.')}>
          <Ionicons name="bag-handle-outline" size={20} color={colors.ink} />
        </Pressable> : null}
        <Pressable style={styles.iconButton} accessibilityLabel="Open support messages" onPress={() => navigateIfAvailable('Messages', 'Support messages are not available in this account yet.')}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.iconButton} accessibilityLabel="Notifications" onPress={() => Alert.alert('Notifications', 'You have no new notifications.') }>
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
          <View style={styles.notificationDot} />
        </Pressable>
        <Pressable accessibilityLabel={role === 'admin' ? 'Open admin settings' : 'Open profile'} onPress={() => navigateIfAvailable(role === 'admin' ? 'Settings' : 'Profile', role === 'admin' ? 'Admin settings are not available in this account.' : 'Profile details are managed from this account screen.')} style={[styles.avatar, { backgroundColor: roleAccent(role) }]}>
          <Ionicons name={role === 'admin' ? 'settings-outline' : 'person-outline'} size={19} color={colors.white} />
        </Pressable>
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
