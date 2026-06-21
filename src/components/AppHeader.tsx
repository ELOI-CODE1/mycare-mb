import React, { useState } from 'react'
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Pressable,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text, Button } from './ui'
import { useAuth } from '../context/AuthContext'
import { colors, spacing, radius, roleAccent, roleColors, type Role } from '../theme'

type Props = {
  role?: Role | string | null
  onNotificationsPress?: () => void
  onCartPress?: () => void
}

export default function AppHeader({ role, onNotificationsPress, onCartPress }: Props) {
  const insets = useSafeAreaInsets()
  const { profile, signOut } = useAuth()
  const [accountVisible, setAccountVisible] = useState(false)

  const accent = roleAccent(role)
  const soft = (role && roleColors[role as Role]?.soft) || colors.gray100

  const handleNotifications =
    onNotificationsPress ?? (() => Alert.alert('Notifications', 'You have no new notifications.'))
  const handleCart = onCartPress ?? (() => Alert.alert('Cart', 'Your cart is empty.'))

  const joined = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.border }]}>
      {/* Logo (left) */}
      <View style={styles.brand}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text variant="heading" color={accent}>
          MyCare+
        </Text>
      </View>

      {/* Action icons (right) */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleNotifications} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="notifications-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCart} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="cart-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAccountVisible(true)} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="person-circle-outline" size={26} color={accent} />
        </TouchableOpacity>
      </View>

      {/* Account details modal */}
      <Modal visible={accountVisible} animationType="slide" transparent onRequestClose={() => setAccountVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setAccountVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <View style={[styles.avatar, { backgroundColor: soft }]}>
              <Ionicons name="person" size={40} color={accent} />
            </View>

            <Text variant="heading" center>
              {profile?.full_name || 'My Account'}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: soft }]}>
              <Text variant="caption" color={accent} style={{ textTransform: 'capitalize' }}>
                {profile?.role || 'user'}
              </Text>
            </View>

            <View style={styles.detailsBlock}>
              <DetailRow icon="mail-outline" label="Email" value={profile?.email || '—'} />
              <DetailRow icon="call-outline" label="Phone" value={profile?.phone || '—'} />
              <DetailRow icon="calendar-outline" label="Joined" value={joined} />
            </View>

            <Button
              title="Logout"
              variant="danger"
              onPress={async () => {
                setAccountVisible(false)
                await signOut()
              }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAccountVisible(false)}>
              <Text muted>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.gray500} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" muted>
          {label}
        </Text>
        <Text variant="body">{value}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 28, height: 28, borderRadius: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  iconBtn: { padding: 2 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  detailsBlock: { alignSelf: 'stretch', marginBottom: spacing.xl, gap: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  closeBtn: { marginTop: spacing.lg, alignItems: 'center' },
})
