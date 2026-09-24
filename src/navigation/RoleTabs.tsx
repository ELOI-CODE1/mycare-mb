import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import { Button, Card, EmptyState, Input, PasswordField, Segmented, Text } from '../components/ui'
import ProductCard from '../components/ProductCard'
import AddToCartModal from '../components/AddToCartModal'
import GirlCyclePanel from '../components/GirlCyclePanel'
import ChildTrackPanel from '../components/ChildTrackPanel'
import ParentReportPanel from '../components/ParentReportPanel'
import { ChildProvider, useChild } from '../context/ChildContext'
import HealthProfilePanel from '../components/HealthProfilePanel'
import ChildrenManager from '../components/ChildrenManager'
import OrderCheckoutPanel from '../components/OrderCheckoutPanel'
import OrderCard from '../components/OrderCard'
import WellnessCheckinCard from '../components/WellnessCheckinCard'
import { getNotifPrefs, setNotifPrefs } from '../utils/notificationService'
import MessagePanel from '../components/MessagePanel'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api, apiErrorMessage } from '../api/client'
import type { ApiOrder, ApiProduct } from '../api/types'
import { colors, radius, roleColors, spacing } from '../theme'

export type TabRole = 'girl' | 'boy' | 'parent'

const Tab = createBottomTabNavigator()

const TAB_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  Home: { label: 'Home', icon: 'home', outline: 'home-outline' },
  Track: { label: 'Track', icon: 'calendar', outline: 'calendar-outline' },
  Learn: { label: 'Learn', icon: 'book', outline: 'book-outline' },
  Shop: { label: 'Shop', icon: 'bag', outline: 'bag-outline' },
  Orders: { label: 'Orders', icon: 'receipt', outline: 'receipt-outline' },
  Family: { label: 'Family', icon: 'people', outline: 'people-outline' },
  Profile: { label: 'Profile', icon: 'person', outline: 'person-outline' },
  Cart: { label: 'Cart', icon: 'bag-handle', outline: 'bag-handle-outline' },
  Messages: { label: 'Messages', icon: 'chatbubble-ellipses', outline: 'chatbubble-ellipses-outline' },
}

function TabScreen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>
}

function useTabNav() {
  return useNavigation<{ navigate: (screen: string, params?: Record<string, unknown>) => void }>()
}

function HomeTab({ role, title, description }: { role: TabRole; title: string; description: string }) {
  const accent = roleColors[role].accent
  const nav = useTabNav()
  const isGirl = role === 'girl'
  const detailsTarget = role === 'boy' ? 'Learn' : 'Track'
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
        {role === 'parent' ? (
          <ParentReportPanel accent={accent} />
        ) : role === 'boy' ? (
          <BoyHome accent={accent} />
        ) : (
          <>
            {role === 'girl' ? <GirlCyclePanel accent={accent} mode="present" /> : <RoleHealthCard accent={accent} />}
            <View style={styles.sectionHeader}>
              <Text variant="heading">Your snapshot</Text>
              <TouchableOpacity accessibilityLabel="View health details" onPress={() => nav.navigate(detailsTarget)}>
                <Text variant="caption" color={accent}>View details</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.metricGrid}>
              <MetricTile icon="heart-outline" label="Wellness check-in" value="Log today" tint={accent} soft={roleColors[role].soft} onPress={() => nav.navigate(detailsTarget)} />
              <MetricTile icon="calendar-outline" label={isGirl ? 'Next period' : 'Next reminder'} value={isGirl ? 'Shop essentials' : 'Learn more'} tint={accent} soft={roleColors[role].soft} onPress={() => nav.navigate(isGirl ? 'Shop' : detailsTarget)} />
            </View>
            <TouchableOpacity accessibilityLabel="Explore education" onPress={() => nav.navigate('Learn')}>
              <Card style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: roleColors[role].soft }]}>
                  <Ionicons name="sparkles-outline" size={20} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="label">Understand your body</Text>
                  <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Clear answers on cycles, comfort, and when to seek care.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
              </Card>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </TabScreen>
  )
}

function RoleHealthCard({ accent }: { accent: string }) {
  const nav = useTabNav()
  return (
    <Card>
      <Text variant="caption" color={accent}>YOUR WELLNESS</Text>
      <Text variant="heading" style={{ marginTop: spacing.xs }}>Small steps, stronger health.</Text>
      <Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>Build a private health picture with check-ins, education, and timely reminders.</Text>
      <View style={styles.healthActionRow}>
        <TouchableOpacity style={{ flex: 1 }} accessibilityLabel="Explore education" onPress={() => nav.navigate('Learn')}>
          <HealthStat label="Education" value="Explore topics" accent={accent} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} accessibilityLabel="Open care shop" onPress={() => nav.navigate('Shop')}>
          <HealthStat label="Care shop" value="See products" accent={accent} />
        </TouchableOpacity>
      </View>
    </Card>
  )
}

function HealthStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return <View style={styles.healthStat}><Text variant="caption" muted>{label}</Text><Text variant="label" color={accent} style={{ marginTop: spacing.xs }}>{value}</Text></View>
}

// Boy learn paths — each tile deep-links Learn with a search preset so
// destinations actually differ instead of all landing on the same list.
const BOY_PATHS: Array<{ title: string; summary: string; icon: keyof typeof Ionicons.glyphMap; query: string }> = [
  { title: 'Protection & testing', summary: 'Condoms, testing, and safer choices.', icon: 'shield-checkmark-outline', query: 'protection' },
  { title: 'Know your body', summary: 'Puberty, hygiene, and what is normal.', icon: 'fitness-outline', query: 'health' },
  { title: 'Respect & consent', summary: 'Boundaries, pressure, and healthy talks.', icon: 'chatbubble-ellipses-outline', query: 'conversation' },
  { title: 'When to seek help', summary: 'Symptoms that deserve a professional.', icon: 'medkit-outline', query: 'help' },
]

function BoyHome({ accent }: { accent: string }) {
  const nav = useTabNav()
  const [kitCount, setKitCount] = useState<number | null>(null)
  const [activeOrder, setActiveOrder] = useState<ApiOrder | null>(null)

  useFocusEffect(
    useCallback(() => {
      let alive = true
      api
        .get<{ products: ApiProduct[] }>('/products?role=boy')
        .then((res) => {
          if (alive) setKitCount(res.data.products.length)
        })
        .catch(() => {
          if (alive) setKitCount(null)
        })
      api
        .get<{ orders: ApiOrder[] }>('/orders')
        .then((res) => {
          if (!alive) return
          const ongoing = res.data.orders.find((o) => ['pending', 'confirmed', 'shipped'].includes(o.status))
          setActiveOrder(ongoing ?? null)
        })
        .catch(() => {
          if (alive) setActiveOrder(null)
        })
      return () => {
        alive = false
      }
    }, []),
  )

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Protection kit — the boy equivalent of the cycle shop banner. */}
      <Card style={[styles.hero, { backgroundColor: roleColors.boy.soft }]}>
        <View style={styles.heroCopy}>
          <Text variant="caption" color={accent}>YOUR KIT</Text>
          <Text variant="title" style={{ marginTop: spacing.xs }}>Stay protected</Text>
          <Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>
            {kitCount === null ? 'Protection essentials picked for you.' : `${kitCount} protection essential${kitCount === 1 ? '' : 's'} picked for you.`}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Shop protection essentials"
            onPress={() => nav.navigate('Shop')}
            style={{ marginTop: spacing.md, alignSelf: 'flex-start', backgroundColor: accent, borderRadius: 999, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
          >
            <Text style={{ color: colors.white, fontWeight: '600' }}>Shop protection</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.heroMark, { backgroundColor: accent }]}>
          <Ionicons name="shield-checkmark-outline" size={28} color={colors.white} />
        </View>
      </Card>

      {/* Learn paths — distinct filtered destinations. */}
      <View style={styles.sectionHeader}>
        <Text variant="heading">Learn your way</Text>
        <TouchableOpacity accessibilityLabel="Open all education topics" onPress={() => nav.navigate('Learn')}>
          <Text variant="caption" color={accent}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.metricGrid}>
        {BOY_PATHS.slice(0, 2).map((path) => (
          <BoyPathTile key={path.title} path={path} accent={accent} />
        ))}
      </View>
      <View style={styles.metricGrid}>
        {BOY_PATHS.slice(2).map((path) => (
          <BoyPathTile key={path.title} path={path} accent={accent} />
        ))}
      </View>

      {/* Own tracking — boys can use check-ins too. */}
      <WellnessCheckinCard accent={accent} />

      {/* Live order state — a reason to come back. */}
      {activeOrder ? (
        <TouchableOpacity accessibilityLabel={`Open order ${activeOrder.id}`} onPress={() => nav.navigate('Orders')}>
          <Card style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: roleColors.boy.soft }]}>
              <Ionicons name="receipt-outline" size={20} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="label" style={{ textTransform: 'capitalize' }}>Order #{activeOrder.id} · {activeOrder.status}</Text>
              <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Tap to track it — we will call you about delivery.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </Card>
        </TouchableOpacity>
      ) : null}

      {/* Human help entry point. */}
      <TouchableOpacity accessibilityLabel="Ask a health expert" onPress={() => nav.navigate('Messages')}>
        <Card style={styles.insightCard}>
          <View style={[styles.insightIcon, { backgroundColor: roleColors.boy.soft }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label">Ask an expert</Text>
            <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Private answers from the MyCare+ care team.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </Card>
      </TouchableOpacity>
    </View>
  )
}

function BoyPathTile({ path, accent }: { path: (typeof BOY_PATHS)[number]; accent: string }) {
  const nav = useTabNav()
  return (
    <TouchableOpacity style={{ flex: 1 }} accessibilityLabel={`Learn about ${path.title}`} onPress={() => nav.navigate('Learn', { query: path.query })}>
      <Card style={styles.metricTile}>
        <View style={[styles.metricIcon, { backgroundColor: roleColors.boy.soft }]}>
          <Ionicons name={path.icon} size={18} color={accent} />
        </View>
        <Text variant="label" style={{ marginTop: spacing.sm }}>{path.title}</Text>
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{path.summary}</Text>
      </Card>
    </TouchableOpacity>
  )
}

function ChildrenSummary({ accent }: { accent: string }) {
  const nav = useTabNav()
  return (
    <Card style={styles.childrenCard}>
      <View style={styles.sectionHeader}>
        <Text variant="heading">Family care</Text>
        <TouchableOpacity accessibilityLabel="Manage child profiles" onPress={() => nav.navigate('Family')}>
          <Text variant="caption" color={accent}>Manage</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity accessibilityLabel="Add a child profile" onPress={() => nav.navigate('Family')}>
        <View style={styles.childPlaceholder}>
          <View style={[styles.childAvatar, { backgroundColor: roleColors.parent.soft }]}><Ionicons name="person-add-outline" size={20} color={accent} /></View>
          <View style={{ flex: 1 }}><Text variant="label">Add a child profile</Text><Text variant="caption" muted style={{ marginTop: spacing.xs }}>Track care and reminders with the right permissions.</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </View>
      </TouchableOpacity>
    </Card>
  )
}

function MetricTile({ icon, label, value, tint, soft, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tint: string; soft: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={{ flex: 1 }} accessibilityLabel={label} onPress={onPress} disabled={!onPress}>
      <Card style={styles.metricTile}>
        <View style={[styles.metricIcon, { backgroundColor: soft }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
        <Text variant="caption" muted style={{ marginTop: spacing.sm }}>{label}</Text>
        <Text variant="label" style={{ marginTop: spacing.xs }}>{value}</Text>
      </Card>
    </TouchableOpacity>
  )
}

function productImage(product: ApiProduct): string | undefined {
  return product.displayImage ?? product.imageData ?? product.imageUrl ?? product.imageUrls?.[0]
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
      <AppHeader role={role} title="Care shop" showCart />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text variant="heading">Care essentials</Text>
          <Text muted style={{ marginTop: spacing.xs }}>Thoughtful products selected for your wellness needs.</Text>
          {products === null && !error ? <ActivityIndicator color={accent} style={{ marginVertical: spacing.xl }} /> : null}
          {error ? (
            <View>
              <Text color={colors.danger} style={{ marginTop: spacing.lg }}>{error}</Text>
              <TouchableOpacity onPress={() => setProducts(null)}><Text color={accent}>Try again</Text></TouchableOpacity>
            </View>
          ) : null}
          {products?.length === 0 ? <EmptyState icon="bag-outline" title="No products yet" subtitle="Your care shop will appear here when products are available." /> : null}
          <View style={styles.productGrid}>{products?.map((product) => {
            const normalizedProduct = { ...product, id: Number(product.id), image_url: productImage(product), images: product.imageUrls }
            const image = productImage(product)
            return <ProductCard key={product.id} name={product.name} price={product.price} description={product.description} category={product.category} image={image} images={product.imageUrls} discountPercent={product.discountPercent} accent={accent} soft={roleColors[role].soft} onPress={() => setSelectedProduct(normalizedProduct)} onAdd={() => setSelectedProduct(normalizedProduct)} />
          })}</View>
        </Card>
      </ScrollView>
      <AddToCartModal visible={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} product={selectedProduct} accent={accent} />
    </TabScreen>
  )
}

function CartTab({ role }: { role: TabRole }) {
  const { items, removeItem, setQuantity, totalItems, totalPrice } = useCart()
  const accent = roleColors[role].accent
  return (
    <TabScreen>
      <AppHeader role={role} title="Your cart" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text variant="heading">Ready when you are</Text>
          <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{totalItems} item{totalItems === 1 ? '' : 's'} · {totalPrice.toLocaleString()} RWF</Text>
        </Card>
        {items.map(({ product, quantity }) => (
          <Card key={product.id} style={styles.cartRow}>
            <View style={{ flex: 1 }}><Text variant="label">{product.name}</Text><Text variant="caption" muted style={{ marginTop: spacing.xs }}>{product.price.toLocaleString()} RWF each</Text></View>
            <View style={styles.quantityRow}><TouchableOpacity onPress={() => setQuantity(product.id, quantity - 1)}><Ionicons name="remove-circle-outline" size={24} color={accent} /></TouchableOpacity><Text variant="label">{quantity}</Text><TouchableOpacity onPress={() => setQuantity(product.id, quantity + 1)}><Ionicons name="add-circle-outline" size={24} color={accent} /></TouchableOpacity></View>
            <TouchableOpacity accessibilityLabel={`Remove ${product.name}`} onPress={() => removeItem(product.id)}><Ionicons name="trash-outline" size={19} color={colors.danger} /></TouchableOpacity>
          </Card>
        ))}
        <OrderCheckoutPanel />
      </ScrollView>
    </TabScreen>
  )
}

function MessagesTab({ role }: { role: TabRole }) {
  return <TabScreen><AppHeader role={role} title="Support" /><ScrollView contentContainerStyle={styles.content}><MessagePanel accent={roleColors[role].accent} /></ScrollView></TabScreen>
}

function TrackTab({ role }: { role: TabRole }) {
  const accent = roleColors[role].accent

  return (
    <TabScreen>
      <AppHeader role={role} title="Track health" />
      <ScrollView contentContainerStyle={styles.content}>
        {role === 'parent' ? (
          <ParentTrackSection accent={accent} />
        ) : (
          <>
            <GirlCyclePanel accent={accent} />
            <WellnessCheckinCard accent={accent} />
        <HealthProfilePanel accent={accent} />
          </>
        )}
      </ScrollView>
    </TabScreen>
  )
}

function ParentTrackSection({ accent }: { accent: string }) {
  const nav = useTabNav()
  const { selected, children, refresh } = useChild()
  useFocusEffect(useCallback(() => { refresh() }, [refresh]))
  if (!selected) {
    return (
      <Card>
        <Text variant="heading">No child selected</Text>
        <Text muted style={{ marginTop: spacing.sm }}>Choose a child account in Family to see her track data here.</Text>
        <Button title="Go to Family" onPress={() => nav.navigate('Family')} accent={accent} style={{ marginTop: spacing.md }} />
      </Card>
    )
  }
  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Text variant="caption" color={accent}>NOW TRACKING</Text>
        <Text variant="title" style={{ marginTop: spacing.xs }}>{selected.fullName}</Text>
        {children.length > 1 ? (
          <TouchableOpacity accessibilityLabel="Switch child account" onPress={() => nav.navigate('Family')} style={{ marginTop: spacing.sm }}>
            <Text variant="caption" color={accent}>Switch child in Family →</Text>
          </TouchableOpacity>
        ) : null}
      </Card>
      <ChildTrackPanel childId={selected.id} childName={selected.fullName} accent={accent} />
    </View>
  )
}

function LearnTab({ role }: { role: TabRole }) {
  const accent = roleColors[role].accent
  const [articles, setArticles] = useState<Array<{ id: string; title: string; summary: string; body?: string; category: string }>>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  // Deep-link presets from Home tiles, e.g. navigate('Learn', { query: 'protection' }).
  const route = useRoute<{ key: string; name: string; params?: { query?: string; category?: string } }>()
  useFocusEffect(
    useCallback(() => {
      if (typeof route.params?.query === 'string') setQuery(route.params.query)
      if (typeof route.params?.category === 'string') setCategory(route.params.category)
    }, [route.params]),
  )
  const [showAll, setShowAll] = useState(false)
  const [learnError, setLearnError] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<{ title: string; summary: string; body?: string; category: string } | null>(null)
  useFocusEffect(useCallback(() => {
    let alive = true
    setLearnError('')
    api.get<{ articles: Array<{ id: string; title: string; summary: string; body?: string; category: string }> }>('/education').then((response) => { if (alive) setArticles(response.data.articles) }).catch((e) => { if (alive) setLearnError(apiErrorMessage(e, 'Could not load education content.')) })
    return () => { alive = false }
  }, []))
  const topics = role === 'girl'
    ? [['Menstrual health', 'Understand your cycle and common changes.', 'flower-outline'], ['Comfort and pain', 'Practical ways to care for yourself during your period.', 'heart-outline'], ['When to seek help', 'Know which symptoms deserve professional attention.', 'medkit-outline']]
    : role === 'parent'
    ? [['Supporting growing children', 'Helpful, age-appropriate guidance for family care.', 'people-outline'], ['Healthy conversations', 'Build trust around changing bodies and wellbeing.', 'chatbubble-ellipses-outline'], ['When to seek help', 'Know when a health concern needs professional care.', 'medkit-outline']]
    : [['Protection and testing', 'Make informed choices about sexual health.', 'shield-checkmark-outline'], ['Healthy conversations', 'Build confidence talking about wellbeing and boundaries.', 'chatbubble-ellipses-outline'], ['When to seek help', 'Know when a health concern needs professional care.', 'medkit-outline']]
  const rows = (articles.length > 0 ? articles.map((article) => [article.title, article.summary, 'book-outline', article] as const) : topics.map(([title, summary, icon]) => [title, summary, icon, undefined] as const))
    .filter(([title, summary, , article]) => {
      const q = query.trim().toLowerCase()
      const inQuery = !q || `${title} ${summary}`.toLowerCase().includes(q)
      const inCategory = category === 'All' || (article ? article.category === category : true)
      return inQuery && inCategory
    })
  const categories = ['All', ...Array.from(new Set(articles.map((a) => a.category))).slice(0, 8)]
  const visible = showAll ? rows : rows.slice(0, 5)
  return (
    <TabScreen>
      <AppHeader role={role} title="Learn" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.learnIntro, { backgroundColor: roleColors[role].soft }]}>
          <Text variant="caption" color={accent}>MYCARE+ LIBRARY</Text>
          <Text variant="title" style={{ marginTop: spacing.xs }}>Clear answers for better care.</Text>
          <Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>Trusted, easy-to-understand guidance for your health journey.</Text>
        </Card>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.gray500} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search education topics" placeholderTextColor={colors.gray400} style={styles.searchInput} />
        </View>
        {learnError ? <Text color={colors.danger}>{learnError}</Text> : null}
        {categories.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {categories.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
                <Text variant="caption" color={category === c ? colors.white : colors.gray700}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.sectionHeader}>
          <Text variant="heading">Recommended for you</Text>
          {rows.length > 5 ? (
            <TouchableOpacity accessibilityLabel={showAll ? 'Show fewer topics' : 'See all topics'} onPress={() => setShowAll((v) => !v)}>
              <Text variant="caption" color={accent}>{showAll ? 'Show less' : `See all (${rows.length})`}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {visible.length === 0 ? <EmptyState icon="book-outline" title="No matching topics" subtitle="Try a different search." /> : null}
        {visible.map(([title, summary, icon, article]) => (
          <Pressable key={title} onPress={() => setSelectedArticle(article || { title, summary, category: 'MyCare+ guidance' })} accessibilityLabel={`Open ${title}`}>
          <Card style={styles.articleRow}>
            <View style={[styles.articleIcon, { backgroundColor: roleColors[role].soft }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={21} color={accent} /></View>
            <View style={{ flex: 1 }}><Text variant="label">{title}</Text><Text variant="caption" muted style={{ marginTop: spacing.xs, lineHeight: 18 }}>{summary}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </Card>
          </Pressable>
        ))}
        <Text variant="caption" muted center>Education content is reviewed and published by the MyCare+ care team.</Text>
      </ScrollView>
      <Modal visible={Boolean(selectedArticle)} transparent animationType="slide" onRequestClose={() => setSelectedArticle(null)}><Pressable style={styles.modalOverlay} onPress={() => setSelectedArticle(null)}><Pressable style={styles.articleSheet} onPress={(event) => event.stopPropagation()}><Text variant="caption" color={accent}>{selectedArticle?.category}</Text><Text variant="title" style={{ marginTop: spacing.xs }}>{selectedArticle?.title}</Text><Text muted style={{ marginTop: spacing.lg, lineHeight: 23 }}>{selectedArticle?.body || selectedArticle?.summary}</Text><Button title="Close" variant="secondary" onPress={() => setSelectedArticle(null)} style={{ marginTop: spacing.xl }} /></Pressable></Pressable></Modal>
    </TabScreen>
  )
}

function orderSummary(order: ApiOrder): { name: string; qty: number; total: number } {
  const items = order.items ?? []
  if (items.length > 0) {
    const qty = items.reduce((n, i) => n + i.quantity, 0)
    const total = order.total ?? order.totalPrice ?? items.reduce((n, i) => n + (i.totalPrice ?? 0), 0)
    const name = items.length === 1 ? items[0].product?.name ?? order.product?.name ?? 'Order' : `${items[0].product?.name ?? 'Order'} +${items.length - 1} more`
    return { name, qty, total }
  }
  return { name: order.product?.name ?? 'Order', qty: order.quantity ?? 1, total: order.total ?? order.totalPrice ?? 0 }
}

function OrdersTab({ role }: { role: TabRole }) {
  const nav = useTabNav()
  const [orders, setOrders] = useState<ApiOrder[] | null>(null)
  const [error, setError] = useState('')
  const { checkoutCount } = useCart()

  const load = useCallback(async () => {
    setOrders(null)
    setError('')
    try {
      const response = await api.get<{ orders: ApiOrder[] }>('/orders')
      setOrders(response.data.orders)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load orders.'))
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load, checkoutCount]))

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
            <TouchableOpacity onPress={load} style={{ marginTop: spacing.sm }}><Text color={roleColors[role].accent}>Try again</Text></TouchableOpacity>
          </Card>
        ) : orders!.length === 0 ? (
          <Card>
            <Text variant="heading">Orders</Text>
            <EmptyState icon="receipt-outline" title="No orders yet" subtitle="Order products from the Shop tab to see them here." />
            <Button title="Browse shop" onPress={() => nav.navigate('Shop')} accent={roleColors[role].accent} style={{ marginTop: spacing.md }} />
          </Card>
        ) : (
          <>
            {orders!.map((order) => {
              const summary = orderSummary(order)
              return (
                <OrderCard
                  key={order.id}
                  orderId={order.id}
                  productName={summary.name}
                  quantity={summary.qty}
                  total={summary.total}
                  status={order.status}
                  date={order.createdAt}
                  phone={order.phone}
                  deliveryAddress={order.deliveryAddress}
                  paymentMethod={order.paymentMethod}
                  items={order.items}
                  cancellable
                  onChanged={load}
                />
              )
            })}
          </>
        )}
      </ScrollView>
    </TabScreen>
  )
}

const LANG_KEY = 'mycareplus_lang'

/** Change password for the signed-in account (all roles). Success signs out everywhere. */
function SecurityCard({ accent }: { accent: string }) {
  const { logout } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!current) {
      Alert.alert('Check entries', 'Enter your current password.')
      return
    }
    if (next.length < 8) {
      Alert.alert('Check entries', 'The new password needs at least 8 characters.')
      return
    }
    if (next !== confirm) {
      Alert.alert('Check entries', 'The new passwords do not match.')
      return
    }
    setSaving(true)
    try {
      const res = await api.post<{ message?: string }>('/auth/change-password', { currentPassword: current, newPassword: next })
      setCurrent('')
      setNext('')
      setConfirm('')
      Alert.alert('Password changed', res.data.message ?? 'Please log in again.', [{ text: 'OK', onPress: () => logout() }])
    } catch (e) {
      Alert.alert('Could not change password', apiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <Text variant="heading">Security</Text>
      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        <PasswordField label="Current password" value={current} onChangeText={setCurrent} />
        <PasswordField label="New password" value={next} onChangeText={setNext} />
        <PasswordField label="Confirm new password" value={confirm} onChangeText={setConfirm} />
      </View>
      <Button title="Change password" onPress={submit} loading={saving} accent={accent} style={{ marginTop: spacing.md }} />
      <Text variant="caption" muted>Changing your password signs you out on all devices.</Text>
    </Card>
  )
}

/** Boy data rights: check-in count + export + delete (girls get this via HealthProfilePanel). */
function BoyWellnessDataCard({ accent }: { accent: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  useFocusEffect(
    useCallback(() => {
      let alive = true
      api
        .get<{ checkIns: unknown[] }>('/health/check-ins')
        .then((res) => {
          if (alive) setCount(res.data.checkIns.length)
        })
        .catch(() => {
          if (alive) setCount(null)
        })
      return () => {
        alive = false
      }
    }, []),
  )

  const exportData = async () => {
    setBusy(true)
    try {
      const res = await api.get('/health/export')
      await Share.share({ message: JSON.stringify(res.data, null, 2), title: 'MyCare+ data export' })
    } catch (e) {
      Alert.alert('Could not export', apiErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const deleteData = () => {
    Alert.alert('Delete wellness data?', 'This permanently removes your check-ins. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/health/data')
            setCount(0)
            Alert.alert('Deleted', 'Your wellness data was removed.')
          } catch (e) {
            Alert.alert('Could not delete', apiErrorMessage(e))
          }
        },
      },
    ])
  }

  return (
    <Card>
      <Text variant="heading">My wellness data</Text>
      <Text muted style={{ marginTop: spacing.xs }}>
        {count === null ? 'Your private check-ins live here.' : `${count} check-in${count === 1 ? '' : 's'} stored privately.`}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button title={busy ? 'Working…' : 'Export'} variant="secondary" onPress={exportData} disabled={busy} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Delete" variant="danger" onPress={deleteData} disabled={busy} />
        </View>
      </View>
    </Card>
  )
}

function SupportRow({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityLabel={title} onPress={onPress} style={styles.articleRow}>
      <View style={[styles.articleIcon, { backgroundColor: colors.gray100 }]}>
        <Ionicons name={icon} size={20} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="label">{title}</Text>
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
    </TouchableOpacity>
  )
}

/** Help, trust, and about links (all roles). */
function SupportCard({ accent }: { accent: string }) {
  const nav = useTabNav()
  return (
    <Card>
      <Text variant="heading">Support & trust</Text>
      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        <SupportRow icon="chatbubble-ellipses-outline" title="Ask an expert" subtitle="Private answers from the care team." onPress={() => nav.navigate('Messages')} />
        <SupportRow
          icon="information-circle-outline"
          title="About MyCare+"
          subtitle="What this app is for."
          onPress={() => nav.navigate('About')}
        />
        <SupportRow
          icon="lock-closed-outline"
          title="Privacy"
          subtitle="How your data is handled."
          onPress={() => nav.navigate('Privacy')}
        />
      </View>
      <Text variant="caption" muted style={{ marginTop: spacing.md, color: accent }}>
        MyCare+ gives health information, not medical diagnosis. Seek a professional for concerning symptoms.
      </Text>
    </Card>
  )
}

/** Shell for Profile sub-pages (Security / About / Privacy) with a back link. */
function ProfileSubPage({ title, role, children }: { title: string; role: TabRole; children: React.ReactNode }) {
  const nav = useTabNav()
  return (
    <TabScreen>
      <AppHeader role={role} title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to profile" onPress={() => nav.navigate('Profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Ionicons name="chevron-back" size={18} color={roleColors[role].accent} />
          <Text variant="caption" color={roleColors[role].accent}>Profile</Text>
        </TouchableOpacity>
        {children}
      </ScrollView>
    </TabScreen>
  )
}

function SecurityScreen({ role }: { role: TabRole }) {
  return (
    <ProfileSubPage title="Security" role={role}>
      <SecurityCard accent={roleColors[role].accent} />
    </ProfileSubPage>
  )
}

function AboutScreen({ role }: { role: TabRole }) {
  return (
    <ProfileSubPage title="About" role={role}>
      <Card>
        <Text variant="caption" color={roleColors[role].accent}>MYCARE+</Text>
        <Text variant="title" style={{ marginTop: spacing.xs }}>Care. Educate. Empower.</Text>
        <Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>
          MyCare+ helps you learn about your health, get care essentials delivered with a simple call-to-confirm order, and reach real experts privately.
        </Text>
      </Card>
      <Card>
        <Text variant="heading">What you can do here</Text>
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          <Text muted style={{ lineHeight: 21 }}>• Track wellness with private daily check-ins.</Text>
          <Text muted style={{ lineHeight: 21 }}>• Learn from trusted, reviewed education topics.</Text>
          <Text muted style={{ lineHeight: 21 }}>• Shop care essentials and order with a callback number.</Text>
          <Text muted style={{ lineHeight: 21 }}>• Message the care team for private support.</Text>
        </View>
      </Card>
      <Card>
        <Text variant="heading">Version</Text>
        <Text muted style={{ marginTop: spacing.xs }}>MyCare+ 1.0.0 · built by the MyCare+ care team.</Text>
      </Card>
    </ProfileSubPage>
  )
}

function PrivacyScreen({ role }: { role: TabRole }) {
  return (
    <ProfileSubPage title="Privacy" role={role}>
      <Card>
        <Text variant="heading">What we store</Text>
        <Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>
          Your account details, private wellness check-ins, orders with callback numbers, and support messages. Health data is tied only to your account.
        </Text>
      </Card>
      <Card>
        <Text variant="heading">Who can see it</Text>
        <Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>
          Only you — except orders and support chats, which admins see to fulfil deliveries and answer you. Nothing is sold or shared.
        </Text>
      </Card>
      <Card>
        <Text variant="heading">Your rights</Text>
        <Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>
          Export or delete your wellness data at any time from Profile{role === 'boy' ? ' → My wellness data' : ' → your health panel'}. Changing your password signs you out on all devices.
        </Text>
      </Card>
    </ProfileSubPage>
  )
}

/** Account details + edit form. Lives on the Account page. */
function AccountCard({ accent }: { accent: string }) {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const startEdit = () => {
    setFullName(user?.fullName ?? '')
    setPhone(user?.phone ?? '')
    setEditing(true)
  }
  const saveEdit = async () => {
    if (fullName.trim().length < 3) {
      Alert.alert('Check name', 'Full name needs at least 3 characters.')
      return
    }
    setSaving(true)
    try {
      await api.patch('/auth/profile', { fullName: fullName.trim(), phone: phone.trim() || undefined })
      await refreshUser()
      Alert.alert('Saved', 'Your profile was updated.')
      setEditing(false)
    } catch (e) {
      Alert.alert('Could not save', apiErrorMessage(e))
    } finally { setSaving(false) }
  }
  return (
    <Card>
      <View style={styles.sectionHeader}>
        <Text variant="caption" color={accent}>ACCOUNT</Text>
        <TouchableOpacity accessibilityLabel="Edit profile" onPress={() => (editing ? saveEdit() : startEdit())}>
          <Text variant="caption" color={accent}>{editing ? (saving ? 'Saving…' : 'Save') : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
      {editing ? (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Input label="Full name" value={fullName} onChangeText={setFullName} />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
      ) : (
        <>
          <Text variant="title" style={{ marginTop: spacing.xs }}>{user?.fullName ?? '—'}</Text>
          <Text muted style={{ marginTop: spacing.xs }}>{user?.email ?? '—'}</Text>
          {user?.phone ? <Text muted style={{ marginTop: spacing.xs }}>{user.phone}</Text> : null}
        </>
      )}
      <Text variant="caption" muted style={{ marginTop: spacing.sm, textTransform: 'capitalize' }}>
        {user?.role ?? '—'} · member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
      </Text>
    </Card>
  )
}

/** Notification + language preferences. Lives on the Preferences page. */
function PreferencesCard({ role, accent }: { role: TabRole; accent: string }) {
  const [reminders, setReminders] = useState(true)
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [lang, setLang] = useState('en')
  useFocusEffect(
    useCallback(() => {
      let alive = true
      getNotifPrefs()
        .then((prefs) => {
          if (!alive) return
          setReminders(prefs.reminders)
          setOrderUpdates(prefs.orderUpdates)
        })
        .catch(() => undefined)
      AsyncStorage.getItem(LANG_KEY)
        .then((value) => {
          if (alive && (value === 'en' || value === 'rw')) setLang(value)
        })
        .catch(() => undefined)
      return () => {
        alive = false
      }
    }, []),
  )
  const toggleReminders = (value: boolean) => {
    setReminders(value)
    setNotifPrefs({ reminders: value, orderUpdates }).catch(() => undefined)
  }
  const toggleOrderUpdates = (value: boolean) => {
    setOrderUpdates(value)
    setNotifPrefs({ reminders, orderUpdates: value }).catch(() => undefined)
  }
  const changeLang = (value: string) => {
    setLang(value)
    AsyncStorage.setItem(LANG_KEY, value).catch(() => undefined)
  }
  return (
    <Card>
      <Text variant="heading">Notification preferences</Text>
      {role !== 'boy' ? (
        <View style={styles.prefRow}><Text style={{ flex: 1 }}>Cycle reminders</Text><Switch value={reminders} onValueChange={toggleReminders} /></View>
      ) : null}
      <View style={styles.prefRow}><Text style={{ flex: 1 }}>Order updates</Text><Switch value={orderUpdates} onValueChange={toggleOrderUpdates} /></View>
      <Text variant="heading" style={{ marginTop: spacing.md }}>Language</Text>
      <View style={{ marginTop: spacing.sm }}>
        <Segmented tabs={[{ key: 'en', label: 'English' }, { key: 'rw', label: 'Kinyarwanda' }]} value={lang} onChange={changeLang} accent={accent} />
      </View>
      <Text variant="caption" muted>Stored on this device{role !== 'boy' ? '; reminders use your timezone-safe health dates' : ''}. Kinyarwanda content is coming soon.</Text>
    </Card>
  )
}

function AccountScreen({ role }: { role: TabRole }) {
  return (
    <ProfileSubPage title="Account" role={role}>
      <AccountCard accent={roleColors[role].accent} />
    </ProfileSubPage>
  )
}

function PreferencesScreen({ role }: { role: TabRole }) {
  return (
    <ProfileSubPage title="Preferences" role={role}>
      <PreferencesCard role={role} accent={roleColors[role].accent} />
    </ProfileSubPage>
  )
}

function ProfileTab({ role }: { role: TabRole }) {
  const { logout } = useAuth()
  const nav = useTabNav()
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
          <View style={{ gap: spacing.md }}>
            <SupportRow icon="person-outline" title="Account" subtitle="Name, email, phone." onPress={() => nav.navigate('Account')} />
            <SupportRow icon="options-outline" title="Preferences" subtitle="Notifications, language." onPress={() => nav.navigate('Preferences')} />
            <SupportRow icon="key-outline" title="Security" subtitle="Change your password." onPress={() => nav.navigate('Security')} />
          </View>
        </Card>
        {role === 'boy' ? <BoyWellnessDataCard accent={roleColors[role].accent} /> : null}
        {role === 'girl' ? (
          <Card>
            <SupportRow icon="heart-outline" title="Health profile" subtitle="Cycle, symptoms, consent, data." onPress={() => nav.navigate('Track')} />
          </Card>
        ) : null}
        {role === 'parent' ? <HealthProfilePanel accent={roleColors[role].accent} /> : null}
        <SupportCard accent={roleColors[role].accent} />
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

function FamilyTab({ role }: { role: TabRole }) {
  const accent = roleColors[role].accent
  const { children, selected, select, refresh } = useChild()

  useFocusEffect(useCallback(() => { refresh() }, [refresh]))

  return (
    <TabScreen>
      <AppHeader role={role} title="Family" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text variant="caption" color={accent}>CHILD ACCOUNTS</Text>
          <Text variant="heading" style={{ marginTop: spacing.xs }}>Switch child</Text>
          {children.length === 0 ? (
            <Text variant="caption" muted style={{ marginTop: spacing.sm }}>Add a child profile below to start tracking.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {children.map((child) => (
                <TouchableOpacity key={child.id} accessibilityLabel={`Track ${child.fullName}`} onPress={() => select(child.id)} style={[styles.chip, selected?.id === child.id && styles.chipActive]}>
                  <Text variant="caption" color={selected?.id === child.id ? colors.white : colors.gray700}>{child.fullName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Card>
        {selected ? <ChildTrackPanel childId={selected.id} childName={selected.fullName} accent={accent} /> : null}
        <ChildrenManager accent={accent} />
      </ScrollView>
    </TabScreen>
  )
}

export default function RoleTabs({ role }: { role: TabRole }) {
  const accent = roleColors[role].accent
  return (
    <ChildProvider>
    <Tab.Navigator
      screenOptions={({ route }) => {
        const meta = TAB_META[route.name]
        return {
          headerShown: false,
          // Footer stays on one line: fixed height, single row, compact labels.
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
      {role !== 'boy' ? <Tab.Screen name="Track" options={{ tabBarLabel: 'Track' }}>
        {() => <TrackTab role={role} />}
      </Tab.Screen> : null}
      {role === 'parent' ? <Tab.Screen name="Family" options={{ tabBarLabel: 'Family' }}>
        {() => <FamilyTab role={role} />}
      </Tab.Screen> : null}
      <Tab.Screen name="Learn" options={{ tabBarLabel: 'Learn' }}>
        {() => <LearnTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Shop" options={{ tabBarLabel: 'Shop' }}>
        {() => <ShopTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Cart" options={{ tabBarButton: () => null, tabBarItemStyle: styles.hiddenTab }}>
        {() => <CartTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Messages" options={{ tabBarButton: () => null, tabBarItemStyle: styles.hiddenTab }}>
        {() => <MessagesTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Orders" options={{ tabBarLabel: 'Orders' }}>
        {() => <OrdersTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarButton: () => null, tabBarItemStyle: styles.hiddenTab }}>
        {() => <ProfileTab role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Account" options={{ tabBarButton: () => null, tabBarItemStyle: styles.hiddenTab }}>
        {() => <AccountScreen role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Preferences" options={{ tabBarButton: () => null, tabBarItemStyle: styles.hiddenTab }}>
        {() => <PreferencesScreen role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Security" options={{ tabBarButton: () => null, tabBarItemStyle: styles.hiddenTab }}>
        {() => <SecurityScreen role={role} />}
      </Tab.Screen>
      <Tab.Screen name="About" options={{ tabBarButton: () => null, tabBarItemStyle: styles.hiddenTab }}>
        {() => <AboutScreen role={role} />}
      </Tab.Screen>
      <Tab.Screen name="Privacy" options={{ tabBarButton: () => null, tabBarItemStyle: styles.hiddenTab }}>
        {() => <PrivacyScreen role={role} />}
      </Tab.Screen>
    </Tab.Navigator>
    </ChildProvider>
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
  productGrid: { flexDirection: 'column', gap: spacing.md, marginTop: spacing.lg },
  metricTile: { flex: 1, minHeight: 132 },
  metricIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  insightIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  healthActionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  healthStat: { flex: 1, backgroundColor: colors.gray100, borderRadius: radius.md, padding: spacing.md },
  childrenCard: { paddingBottom: spacing.sm },
  childPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg, paddingVertical: spacing.sm },
  childAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  learnIntro: { minHeight: 170, justifyContent: 'flex-end' },
  articleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  articleIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(23, 33, 31, 0.45)' },
  articleSheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, minHeight: 320 },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, minHeight: 44, color: colors.text },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  // Single-line footer: one row, evenly spaced, compact one-line labels.
  // Hidden tabs take no space so gaps stay even.
  tabBar: { height: 68, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-evenly', paddingTop: spacing.xs, paddingBottom: spacing.sm, paddingHorizontal: spacing.xs, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  tabBarLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  tabBarItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 2 },
  hiddenTab: { display: 'none', flex: 0, width: 0, height: 0 },
})
