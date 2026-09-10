import React from 'react'
import { Alert, Modal, Pressable, ScrollView, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { Text } from './ui'
import { useNotifications, type NoticeKind } from '../hooks/useNotifications'
import { colors, radius, spacing, roleAccent, type Role } from '../theme'

const KIND_ICON: Record<NoticeKind, keyof typeof Ionicons.glyphMap> = {
  order: 'receipt-outline',
  article: 'book-outline',
  period: 'calendar-outline',
  child: 'people-outline',
  support: 'chatbubble-ellipses-outline',
}

export default function AppHeader({ role, title = 'Home', showCart = false }: { role: Role | string; title?: string; showCart?: boolean }) {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const { totalItems } = useCart()
  const { items, unread, refresh, markRead } = useNotifications(typeof role === 'string' ? role : 'girl')
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openPanel = () => {
    refresh()
    setOpen(true)
  }

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
      </View>
      <View style={styles.actions}>
        {showCart ? <Pressable style={styles.iconButton} accessibilityLabel={`Open cart, ${totalItems} items`} onPress={() => navigateIfAvailable('Cart', 'Your cart is available from the Shop area.')}>
          <Ionicons name="bag-handle-outline" size={20} color={colors.ink} />
          {totalItems > 0 ? <View style={styles.countBadge}><Text style={styles.countText}>{totalItems > 99 ? '99+' : totalItems}</Text></View> : null}
        </Pressable> : null}
        <Pressable style={styles.iconButton} accessibilityLabel="Open support messages" onPress={() => navigateIfAvailable('Messages', 'Support messages are not available in this account yet.')}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.ink} />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          accessibilityLabel={unread > 0 ? `Open notifications, ${unread} unread` : 'Open notifications'}
          onPress={openPanel}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
          {unread > 0 ? <View style={styles.countBadge}><Text style={styles.countText}>{unread > 99 ? '99+' : unread}</Text></View> : null}
        </Pressable>
        <Pressable accessibilityLabel={role === 'admin' ? 'Open admin settings' : 'Open profile'} onPress={() => navigateIfAvailable(role === 'admin' ? 'Settings' : 'Profile', role === 'admin' ? 'Admin settings are not available in this account.' : 'Profile details are managed from this account screen.')} style={[styles.avatar, { backgroundColor: roleAccent(role) }]}>
          <Ionicons name={role === 'admin' ? 'settings-outline' : 'person-outline'} size={19} color={colors.white} />
        </Pressable>
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.notificationOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.notificationPanel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.notificationHeader}>
              <Text variant="heading">Notifications{unread > 0 ? ` (${unread})` : ''}</Text>
              <Pressable accessibilityLabel="Close notifications" onPress={() => setOpen(false)}><Ionicons name="close" size={20} color={colors.ink} /></Pressable>
            </View>
            <ScrollView style={styles.notificationList}>
              {items.length === 0 ? (
                <Text variant="caption" muted>You're all caught up. Order updates, new articles, and cycle reminders will appear here.</Text>
              ) : items.map((item) => (
                <Pressable key={item.id} onPress={() => markRead(item)} style={[styles.notificationItem, !item.read && styles.notificationUnread]}>
                  <Ionicons name={KIND_ICON[item.kind]} size={20} color={roleAccent(role)} />
                  <View style={{ flex: 1 }}>
                    <Text variant="label">{item.title}</Text>
                    <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{item.body}</Text>
                    {item.date ? <Text variant="caption" muted style={{ marginTop: 2 }}>{new Date(item.date).toLocaleDateString()}</Text> : null}
                  </View>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, alignSelf: 'flex-start', marginTop: 4 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationOverlay: { flex: 1, backgroundColor: 'rgba(23, 33, 31, 0.35)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 86, paddingRight: spacing.lg },
  notificationPanel: { width: 330, maxWidth: '92%', maxHeight: '70%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)', elevation: 5 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  notificationList: { flexGrow: 0 },
  notificationItem: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray100 },
  notificationUnread: { backgroundColor: colors.gray100, borderRadius: radius.sm, paddingHorizontal: spacing.sm },
})
