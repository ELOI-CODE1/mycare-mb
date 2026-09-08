import React, { useCallback, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import { Button, Card, EmptyState, Text } from '../components/ui'
import ProductCard from '../components/ProductCard'
import AddToCartModal from '../components/AddToCartModal'
import GirlCyclePanel from '../components/GirlCyclePanel'
import OrderCheckoutPanel from '../components/OrderCheckoutPanel'
import OrderCard from '../components/OrderCard'
import { useAuth } from '../context/AuthContext'
import { api, apiErrorMessage } from '../api/client'
import type { ApiProduct } from '../api/types'
import { colors, roleColors, spacing } from '../theme'

export type TabRole = 'girl' | 'boy' | 'parent'

const Tab = createBottomTabNavigator()

const TAB_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  Home: { label: 'Home', icon: 'home', outline: 'home-outline' },
  Track: { label: 'Track', icon: 'calendar', outline: 'calendar-outline' },
  Learn: { label: 'Learn', icon: 'book', outline: 'book-outline' },
  Shop: { label: 'Shop', icon: 'bag', outline: 'bag-outline' },
  Orders: { label: 'Orders', icon: 'receipt', outline: 'receipt-outline' },
  Profile: { label: 'Profile', icon: 'person', outline: 'person-outline' },
}

function TabScreen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>
}

function HomeTab({ role, title, description }: { role: TabRole; title: string; description: string }) {
  const accent = roleColors[role].accent
  const isGirl = role === 'girl'
  return (
    <TabScreen>
      <AppHeader role={role} title="Your health" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.hero, { backgroundColor: roleColors[role].soft }]}>
          <View style={styles.heroCopy}>
            <Text variant="caption" color={accent}>TODAY</Text>
            <Text variant="title" style={{ marginTop: spacing.xs }}>{title}</Text>
            <Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>{description}</Text>
          </View>
          <View style={[styles.heroMark, { backgroundColor: accent }]}>
            <Ionicons name={isGirl ? 'flower-outline' : role === 'parent' ? 'people-outline' : 'shield-checkmark-outline'} size={28} color={colors.white} />
          </View>
        </Card>
        {role === 'girl' ? <GirlCyclePanel accent={accent} /> : null}
        <View style={styles.sectionHeader}>
          <Text variant="heading">Your snapshot</Text>
          <Text variant="caption" color={accent}>View details</Text>
        </View>
        <View style={styles.metricGrid}>
          <MetricTile icon="heart-outline" label="Wellness check-in" value="Not logged" tint={accent} soft={roleColors[role].soft} />
          <MetricTile icon="calendar-outline" label={isGirl ? 'Next period' : 'Next reminder'} value={isGirl ? 'Log 2+ cycles' : 'Set a reminder'} tint={accent} soft={roleColors[role].soft} />
        </View>
        <Card style={styles.insightCard}>
          <View style={[styles.insightIcon, { backgroundColor: roleColors[role].soft }]}>
            <Ionicons name="sparkles-outline" size={20} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label">Build your health picture</Text>
            <Text variant="caption" muted style={{ marginTop: spacing.xs }}>A quick check-in helps MyCare+ make more useful suggestions over time.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </Card>
      </ScrollView>
    </TabScreen>
  )
}

function MetricTile({ icon, label, value, tint, soft }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tint: string; soft: string }) {
  return (
    <Card style={styles.metricTile}>
      <View style={[styles.metricIcon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text variant="caption" muted style={{ marginTop: spacing.sm }}>{label}</Text>
      <Text variant="label" style={{ marginTop: spacing.xs }}>{value}</Text>
    </Card>
  )
}

function ShopTab({ role }: { role: TabRole }) {
  const accent = roleColors[role].accent
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [products, setProducts] = useState<ApiProduct[] | null>(null)
  const [error, setError] = useState('')

  useFocusEffect(
    useCallback(() => {
      let alive = true
      setProducts(null)
      setError('')
      api
        .get<{ products: ApiProduct[] }>(`/products?role=${role}`)
        .then((response) => { if (alive) setProducts(response.data.products) })
        .catch((err) => { if (alive) setError(apiErrorMessage(err, 'Could not load products.')) })
      return () => { alive = false }
    }, [role]),
  )

  return (
    <TabScreen>
      <AppHeader role={role} title="Care shop" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text variant="heading">Care essentials</Text>
          <Text muted style={{ marginTop: spacing.xs }}>Thoughtful products selected for your wellness needs.</Text>
          {products === null && !error ? <ActivityIndicator color={accent} style={{ marginVertical: spacing.xl }} /> : null}
          {error ? <Text color={colors.danger} style={{ marginTop: spacing.lg }}>{error}</Text> : null}
          {products?.length === 0 ? <EmptyState icon="bag-outline" title="No products yet" subtitle="Your care shop will appear here when products are available." /> : null}
          {products?.map((product) => {
            const normalizedProduct = { ...product, id: Number(product.id), image_url: product.imageUrl }
            return <ProductCard key={product.id} name={product.name} price={product.price} description={product.description} category={product.category} image={product.imageUrl} discountPercent={product.discountPercent} accent={accent} soft={roleColors[role].soft} onPress={() => setSelectedProduct(normalizedProduct)} onAdd={() => setSelectedProduct(normalizedProduct)} />
          })}
        </Card>
      </ScrollView>
      <AddToCartModal visible={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} product={selectedProduct} accent={accent} />
    </TabScreen>
  )
}

function TrackTab({ role }: { role: TabRole }) {
  const accent = roleColors[role].accent
  return (
    <TabScreen>
      <AppHeader role={role} title="Track health" />
      <ScrollView contentContainerStyle={styles.content}>
        {role === 'girl' ? <GirlCyclePanel accent={accent} /> : null}
        <Card>
          <Text variant="heading">Daily check-in</Text>
          <Text muted style={{ marginTop: spacing.xs }}>A few quick notes help you notice patterns over time.</Text>
          <View style={styles.checkinRow}>
            <CheckinItem icon="happy-outline" label="Mood" accent={accent} />
            <CheckinItem icon="flash-outline" label="Energy" accent={accent} />
            <CheckinItem icon="moon-outline" label="Sleep" accent={accent} />
          </View>
          <Text variant="caption" muted style={{ marginTop: spacing.md }}>Full check-in history will be saved to your private health profile.</Text>
        </Card>
      </ScrollView>
    </TabScreen>
  )
}

function CheckinItem({ icon, label, accent }: { icon: keyof typeof Ionicons.glyphMap; label: string; accent: string }) {
  return (
    <View style={styles.checkinItem}>
      <View style={[styles.checkinIcon, { borderColor: accent }]}><Ionicons name={icon} size={19} color={accent} /></View>
      <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{label}</Text>
    </View>
  )
}

function LearnTab({ role }: { role: TabRole }) {
  const accent = roleColors[role].accent
  const topics = role === 'girl'
    ? [['Menstrual health', 'Understand your cycle and common changes.', 'flower-outline'], ['Comfort and pain', 'Practical ways to care for yourself during your period.', 'heart-outline'], ['When to seek help', 'Know which symptoms deserve professional attention.', 'medkit-outline']]
    : role === 'parent'
    ? [['Supporting growing children', 'Helpful, age-appropriate guidance for family care.', 'people-outline'], ['Healthy conversations', 'Build trust around changing bodies and wellbeing.', 'chatbubble-ellipses-outline'], ['When to seek help', 'Know when a health concern needs professional care.', 'medkit-outline']]
    : [['Protection and testing', 'Make informed choices about sexual health.', 'shield-checkmark-outline'], ['Healthy conversations', 'Build confidence talking about wellbeing and boundaries.', 'chatbubble-ellipses-outline'], ['When to seek help', 'Know when a health concern needs professional care.', 'medkit-outline']]
  return (
    <TabScreen>
      <AppHeader role={role} title="Learn" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.learnIntro, { backgroundColor: roleColors[role].soft }]}>
          <Text variant="caption" color={accent}>MYCARE+ LIBRARY</Text>
          <Text variant="title" style={{ marginTop: spacing.xs }}>Clear answers for better care.</Text>
          <Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>Trusted, easy-to-understand guidance for your health journey.</Text>
        </Card>
        <View style={styles.sectionHeader}><Text variant="heading">Recommended for you</Text><Text variant="caption" color={accent}>See all</Text></View>
        {topics.map(([title, summary, icon]) => (
          <Card key={title} style={styles.articleRow}>
            <View style={[styles.articleIcon, { backgroundColor: roleColors[role].soft }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={21} color={accent} /></View>
            <View style={{ flex: 1 }}><Text variant="label">{title}</Text><Text variant="caption" muted style={{ marginTop: spacing.xs, lineHeight: 18 }}>{summary}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </Card>
        ))}
        <Text variant="caption" muted center>Education content is reviewed and published by the MyCare+ care team.</Text>
      </ScrollView>
    </TabScreen>
  )
}

type Order = {
  id: number
  quantity: number
  totalPrice: number
  status: string
  createdAt: string
  deliveryAddress: string | null
  product: { name: string }
}

function OrdersTab({ role }: { role: TabRole }) {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState('')

  useFocusEffect(
    useCallback(() => {
      let alive = true
      setOrders(null)
      setError('')
      api
        .get<{ orders: Order[] }>('/orders')
        .then((response) => { if (alive) setOrders(response.data.orders) })
        .catch((err) => { if (alive) setError(apiErrorMessage(err, 'Could not load orders.')) })
      return () => { alive = false }
    }, []),
  )

  return (
    <TabScreen>
      <AppHeader role={role} title="Your orders" />
      <ScrollView contentContainerStyle={styles.content}>
        {orders === null && !error ? (
          <Card><ActivityIndicator color={roleColors[role].accent} /></Card>
        ) : error ? (
          <Card>
            <Text variant="heading">Orders</Text>
            <Text color="#B91C1C" style={{ marginTop: spacing.sm }}>{error}</Text>
          </Card>
        ) : orders!.length === 0 ? (
          <Card>
            <Text variant="heading">Orders</Text>
            <EmptyState icon="receipt-outline" title="No orders yet" subtitle="Order products from the Shop tab to see them here." />
          </Card>
        ) : (
          <>
            <OrderCheckoutPanel />
            {orders!.map((order) => (
              <OrderCard key={order.id} productName={order.product.name} quantity={order.quantity} total={order.totalPrice} status={order.status} date={order.createdAt} />
            ))}
          </>
        )}
      </ScrollView>
    </TabScreen>
  )
}

function ProfileTab({ role }: { role: TabRole }) {
  const { user, logout } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const handleLogout = async () => {
    setLeaving(true)
    try { await logout() }
    finally { setLeaving(false) }
  }
  return (
    <TabScreen>
      <AppHeader role={role} title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text variant="caption" color={roleColors[role].accent}>ACCOUNT</Text>
          <Text variant="title" style={{ marginTop: spacing.xs }}>{user?.fullName ?? '—'}</Text>
          <Text muted style={{ marginTop: spacing.xs }}>{user?.email ?? '—'}</Text>
          {user?.phone ? <Text muted style={{ marginTop: spacing.xs }}>{user.phone}</Text> : null}
          <Text variant="caption" muted style={{ marginTop: spacing.sm, textTransform: 'capitalize' }}>
            {user?.role ?? role} · member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
          </Text>
        </Card>
        <Button title="Log out" onPress={handleLogout} loading={leaving} accent={colors.danger} />
      </ScrollView>
    </TabScreen>
  )
}

const HOME_COPY: Record<TabRole, { title: string; description: string }> = {
  girl: { title: 'Your wellness space', description: 'Track your cycle, learn about your health, and manage your care.' },
  boy: { title: 'Your health hub', description: 'Prevention, protection, and health info — all in one place.' },
  parent: { title: 'Family care space', description: 'Track children, manage supplies, and stay on top of family health.' },
}

export default function RoleTabs({ role }: { role: TabRole }) {
  const accent = roleColors[role].accent
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const meta = TAB_META[route.name]
        return {
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: colors.gray500,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? meta.icon : meta.outline} size={size} color={color} />
          ),
        }
      }}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: 'Home' }}>
        {() => <HomeTab role={role} title={HOME_COPY[role].title} description={HOME_COPY[role].description} />}
      </Tab.Screen>
      <Tab.Screen name="Track" options={{ tabBarLabel: 'Track' }}>
        {() => <TrackTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Learn" options={{ tabBarLabel: 'Learn' }}>
        {() => <LearnTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Shop" options={{ tabBarLabel: 'Shop' }}>
        {() => <ShopTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Orders" options={{ tabBarLabel: 'Orders' }}>
        {() => <OrdersTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profile' }}>
        {() => <ProfileTab role={role} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl * 2 },
  hero: { minHeight: 166, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', overflow: 'hidden' },
  heroCopy: { flex: 1, paddingRight: spacing.lg },
  heroMark: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricGrid: { flexDirection: 'row', gap: spacing.md },
  metricTile: { flex: 1, minHeight: 132 },
  metricIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  insightIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  checkinRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  checkinItem: { alignItems: 'center', flex: 1 },
  checkinIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  learnIntro: { minHeight: 170, justifyContent: 'flex-end' },
  articleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  articleIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tabBar: { height: 70, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  tabBarLabel: { fontSize: 11, fontWeight: '600' },
  tabBarItem: { paddingTop: 2 },
})
