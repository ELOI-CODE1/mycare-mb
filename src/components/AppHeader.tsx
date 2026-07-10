import React, { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from './ui'
import { useCart } from '../context/CartContext'
import CartModal from './CartModal'
import MessageButton from './messaging/MessageButton'
import { colors, spacing, roleAccent, type Role } from '../theme'

type Props = {
  role?: Role | string | null
  onNotificationsPress?: () => void
  onCartPress?: () => void
}

export default function AppHeader({ role, onNotificationsPress, onCartPress }: Props) {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const { totalItems } = useCart()
  const [cartVisible, setCartVisible] = useState(false)

  const accent = roleAccent(role)
  // Admins manage the shop, they don't buy — so no cart for them.
  const showCart = role !== 'admin'

  const handleNotifications =
    onNotificationsPress ?? (() => Alert.alert('Notifications', 'You have no new notifications.'))
  const handleCart = onCartPress ?? (() => setCartVisible(true))

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.border }]}>
      {/* Brand name (left) */}
      <View style={styles.brand}>
        <Text variant="heading" color={accent}>
          MyCare+
        </Text>
      </View>

      {/* Action icons (right) */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleNotifications} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="notifications-outline" size={24} color={colors.gray700} />
        </TouchableOpacity>

        <MessageButton accent={accent} />

        {showCart && (
          <TouchableOpacity onPress={handleCart} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="cart-outline" size={24} color={colors.gray700} />
            {totalItems > 0 && (
              <View style={[styles.badge, { backgroundColor: accent }]}>
                <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
                  {totalItems > 99 ? '99+' : totalItems}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Account')} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="person-circle-outline" size={26} color={accent} />
        </TouchableOpacity>
      </View>

      {/* Cart + checkout */}
      <CartModal visible={cartVisible} onClose={() => setCartVisible(false)} accent={accent} />
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
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
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
