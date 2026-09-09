import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import AppHeader from '../components/AppHeader'
import { Badge, Button, Card, EmptyState, Text } from '../components/ui'
import { api, apiErrorMessage } from '../api/client'
import { colors, radius, roleColors, spacing } from '../theme'
import { useAuth } from '../context/AuthContext'

type AdminTab = 'Overview' | 'Users' | 'Products' | 'Orders' | 'Education' | 'Messages' | 'Settings'
const Tab = createBottomTabNavigator()
const TAB_META: Record<AdminTab, keyof typeof Ionicons.glyphMap> = { Overview: 'grid-outline', Users: 'people-outline', Products: 'cube-outline', Orders: 'receipt-outline', Education: 'book-outline', Messages: 'chatbubbles-outline', Settings: 'settings-outline' }
type User = { id: string; fullName: string; email: string; role: string; status: string }
type Product = { id: number; name: string; description?: string; price: number; category?: string; imageUrl?: string | null; visibleTo: string[]; isAvailable: boolean }
type Order = { id: number; status: string; totalPrice: number; createdAt: string; product: { name: string }; user: { fullName: string; email: string } }
type Article = { id: string; title: string; summary: string; body: string; category: string; status: string; visibleTo: string[]; updatedAt: string }

function AdminScreen({ children, title }: { children: React.ReactNode; title: string }) { return <View style={styles.screen}><AppHeader role="admin" title={title} /><ScrollView contentContainerStyle={styles.content}>{children}</ScrollView></View> }
function LoadingCard() { return <Card><ActivityIndicator color={colors.red} /></Card> }
function ErrorCard({ message }: { message: string }) { return <Card><Text variant="heading">Could not load this view</Text><Text color={colors.danger} style={{ marginTop: spacing.sm }}>{message}</Text></Card> }
function SectionIntro({ title, detail }: { title: string; detail: string }) { return <View style={styles.sectionIntro}><Text variant="heading">{title}</Text><Text muted style={{ marginTop: spacing.xs, lineHeight: 20 }}>{detail}</Text></View> }
function ActionRow({ icon, title, detail }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string }) { return <View style={styles.actionRow}><View style={styles.actionIcon}><Ionicons name={icon} size={19} color={colors.red} /></View><View style={{ flex: 1 }}><Text variant="label">{title}</Text><Text variant="caption" muted style={{ marginTop: 3 }}>{detail}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.gray400} /></View> }
function AdminStat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) { return <Card style={styles.adminStat}><View style={styles.adminStatIcon}><Ionicons name={icon} size={19} color={colors.red} /></View><Text variant="title" style={{ marginTop: spacing.sm }}>{value}</Text><Text variant="caption" muted>{label}</Text></Card> }

const ROLE_OPTIONS = ['girl', 'boy', 'parent'] as const
type ProductDraft = { name: string; description: string; price: string; category: string; imageUrl: string; visibleTo: string[]; isAvailable: boolean }
const EMPTY_PRODUCT: ProductDraft = { name: '', description: '', price: '', category: '', imageUrl: '', visibleTo: [...ROLE_OPTIONS], isAvailable: true }

function EditorInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.editorField}><Text variant="label" style={{ marginBottom: spacing.xs }}>{label}</Text><TextInput {...props} placeholderTextColor={colors.gray400} style={[styles.editorInput, props.multiline && styles.multilineInput]} /></View>
}

function ProductEditor({ visible, product, saving, uploading, onClose, onSave, onUpload }: { visible: boolean; product: Product | null; saving: boolean; uploading: boolean; onClose: () => void; onSave: (draft: ProductDraft) => void; onUpload: (asset: ImagePicker.ImagePickerAsset, setImageUrl: (url: string) => void) => void }) {
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_PRODUCT)
  React.useEffect(() => {
    setDraft(product ? { name: product.name, description: product.description || '', price: String(product.price), category: product.category || '', imageUrl: product.imageUrl || '', visibleTo: product.visibleTo || [...ROLE_OPTIONS], isAvailable: product.isAvailable } : EMPTY_PRODUCT)
  }, [product, visible])
  const toggleRole = (role: string) => setDraft((current) => ({ ...current, visibleTo: current.visibleTo.includes(role) ? current.visibleTo.filter((item) => item !== role) : [...current.visibleTo, role] }))
  const chooseImage = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 }); if (!result.canceled && result.assets[0]) onUpload(result.assets[0], (url) => setDraft((current) => ({ ...current, imageUrl: url }))) }
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.modalOverlay} onPress={onClose}><Pressable style={styles.editorSheet} onPress={(event) => event.stopPropagation()}><View style={styles.modalHandle} /><Text variant="caption" color={colors.red}>{product ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</Text><Text variant="title" style={{ marginTop: spacing.xs }}>{product ? 'Update product' : 'Add product'}</Text><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.lg }}><EditorInput label="Product name" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="e.g. Comfort pads" /><EditorInput label="Description" value={draft.description} onChangeText={(description) => setDraft({ ...draft, description })} placeholder="Short product description" multiline /><View style={styles.formColumns}><View style={{ flex: 1 }}><EditorInput label="Price (RWF)" value={draft.price} onChangeText={(price) => setDraft({ ...draft, price: price.replace(/[^0-9]/g, '') })} placeholder="2500" keyboardType="number-pad" /></View><View style={{ flex: 1 }}><EditorInput label="Category" value={draft.category} onChangeText={(category) => setDraft({ ...draft, category })} placeholder="hygiene" /></View></View><Text variant="label" style={{ marginBottom: spacing.xs }}>Product image</Text><Pressable onPress={chooseImage} disabled={uploading || saving} style={styles.uploadButton}><Ionicons name="cloud-upload-outline" size={20} color={colors.red} /><Text variant="label" color={colors.red}>{uploading ? 'Uploading image...' : draft.imageUrl ? 'Replace uploaded image' : 'Upload product image'}</Text></Pressable>{draft.imageUrl ? <Text variant="caption" muted numberOfLines={1} style={{ marginBottom: spacing.md }}>Image uploaded</Text> : null}<Text variant="label" style={{ marginBottom: spacing.sm }}>Visible to</Text><View style={styles.roleRow}>{ROLE_OPTIONS.map((role) => <Pressable key={role} onPress={() => toggleRole(role)} style={[styles.roleChip, draft.visibleTo.includes(role) && styles.roleChipActive]}><Text variant="caption" color={draft.visibleTo.includes(role) ? colors.white : colors.gray700}>{role}</Text></Pressable>)}</View><Pressable onPress={() => setDraft({ ...draft, isAvailable: !draft.isAvailable })} style={styles.availabilityRow}><Ionicons name={draft.isAvailable ? 'checkbox' : 'square-outline'} size={21} color={draft.isAvailable ? colors.red : colors.gray400} /><Text variant="label">Available in shop</Text></Pressable><Button title={product ? 'Save changes' : 'Create product'} loading={saving} disabled={saving || uploading} accent={colors.red} onPress={() => onSave(draft)} /><Button title="Cancel" variant="ghost" disabled={saving || uploading} onPress={onClose} /></ScrollView></Pressable></Pressable></Modal>
}

function OverviewTab() {
  const [counts, setCounts] = useState({ users: 0, products: 0, orders: 0 })
  const [loading, setLoading] = useState(true)
  useFocusEffect(useCallback(() => { let alive = true; setLoading(true); Promise.all([api.get<{ users: User[] }>('/users'), api.get<{ products: Product[] }>('/products/all'), api.get<{ orders: Order[] }>('/orders/all')]).then(([users, products, orders]) => { if (alive) setCounts({ users: users.data.users.length, products: products.data.products.length, orders: orders.data.orders.length }) }).catch(() => undefined).finally(() => { if (alive) setLoading(false) }); return () => { alive = false } }, []))
  return <AdminScreen title="Admin overview"><Card style={styles.welcomeCard}><Text variant="caption" color={colors.red}>CONTROL CENTER</Text><Text variant="title" style={{ marginTop: spacing.xs }}>Care, content, and commerce.</Text><Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>Keep the MyCare+ experience useful, trustworthy, and ready for every role.</Text></Card>{loading ? <LoadingCard /> : <View style={styles.statGrid}><AdminStat icon="people-outline" label="Users" value={counts.users} /><AdminStat icon="cube-outline" label="Products" value={counts.products} /><AdminStat icon="receipt-outline" label="Orders" value={counts.orders} /></View>}<Card><Text variant="heading">What needs attention</Text><ActionRow icon="book-outline" title="Publish education" detail="Keep trusted guidance fresh and useful." /><ActionRow icon="image-outline" title="Review product images" detail="Make every product feel ready to browse." /><ActionRow icon="shield-checkmark-outline" title="Review permissions" detail="Protect sensitive family health information." /></Card></AdminScreen>
}

function UsersTab() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [error, setError] = useState('')
  useFocusEffect(useCallback(() => { let alive = true; setUsers(null); setError(''); api.get<{ users: User[] }>('/users').then((r) => { if (alive) setUsers(r.data.users) }).catch((e) => { if (alive) setError(apiErrorMessage(e, 'Could not load users.')) }); return () => { alive = false } }, []))
  return <AdminScreen title="Users"><SectionIntro title="User management" detail="Roles, account status, and access are managed here." />{error ? <ErrorCard message={error} /> : users === null ? <LoadingCard /> : users.length === 0 ? <Card><EmptyState icon="people-outline" title="No users yet" /></Card> : users.map((user) => <Card key={user.id} style={styles.listRow}><View style={styles.userAvatar}><Text variant="label" color={colors.red}>{user.fullName.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text variant="label">{user.fullName}</Text><Text variant="caption" muted style={{ marginTop: 3 }}>{user.email}</Text><Text variant="caption" color={colors.gray500} style={{ marginTop: 3 }}>{user.role}</Text></View><Badge label={user.status} /></Card>)}</AdminScreen>
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [editorProduct, setEditorProduct] = useState<Product | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const loadProducts = useCallback(() => { let alive = true; setProducts(null); setError(''); api.get<{ products: Product[] }>('/products/all').then((r) => { if (alive) setProducts(r.data.products) }).catch((e) => { if (alive) { setProducts([]); setError(apiErrorMessage(e, 'Could not connect to the product service.')) } }); return () => { alive = false } }, [])
  useFocusEffect(useCallback(() => loadProducts(), [loadProducts]))
  const saveProduct = async (draft: ProductDraft) => {
    const price = Number(draft.price)
    if (!draft.name.trim() || !Number.isInteger(price) || price < 0 || draft.visibleTo.length === 0) { Alert.alert('Check product details', 'Add a name, a whole-number price, and at least one visible role.'); return }
    setSaving(true)
    try {
      const payload = { name: draft.name.trim(), description: draft.description.trim() || undefined, price, category: draft.category.trim() || undefined, imageUrl: draft.imageUrl || undefined, visibleTo: draft.visibleTo, isAvailable: draft.isAvailable }
      if (editorProduct) await api.put(`/products/${editorProduct.id}`, payload)
      else await api.post('/products', payload)
      setEditorProduct(undefined)
      loadProducts()
    } catch (e) { Alert.alert('Could not save product', apiErrorMessage(e, 'Check that you are signed in as an admin and the backend is running.')) } finally { setSaving(false) }
  }
  const uploadImage = async (asset: ImagePicker.ImagePickerAsset, setImageUrl: (url: string) => void) => {
    setUploading(true)
    try {
      const formData = new FormData()
      const filename = asset.fileName || `product-${Date.now()}.jpg`
      const type = asset.mimeType || 'image/jpeg'
      if (Platform.OS === 'web') {
        const blob = await (await fetch(asset.uri)).blob()
        formData.append('image', blob, filename)
      } else {
        formData.append('image', { uri: asset.uri, name: filename, type } as any)
      }
      const response = await api.post<{ imageUrl: string }>('/products/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setImageUrl(response.data.imageUrl)
    } catch (error) {
      Alert.alert('Could not upload image', apiErrorMessage(error, 'Choose another image and try again.'))
    } finally { setUploading(false) }
  }
  const deleteProduct = (product: Product) => Alert.alert('Delete product?', `Remove ${product.name} from the catalog?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(`/products/${product.id}`); loadProducts() } catch (e) { Alert.alert('Could not delete product', apiErrorMessage(e)) } } }])
  return <AdminScreen title="Products"><SectionIntro title="Product catalog" detail="Add product images and keep the care shop current." /><Button title="Add product" accent={colors.red} onPress={() => setEditorProduct(null)} />{error ? <ErrorCard message={error} /> : null}{products === null ? <LoadingCard /> : products.length === 0 ? <Card><EmptyState icon="cube-outline" title="No products yet" /></Card> : products.map((product) => <Card key={product.id} style={styles.productRow}><View style={styles.productIcon}>{product.imageUrl ? <Ionicons name="image-outline" size={19} color={colors.red} /> : <Ionicons name="cube-outline" size={19} color={colors.red} />}</View><View style={{ flex: 1 }}><Text variant="label">{product.name}</Text><Text variant="caption" muted style={{ marginTop: 3 }}>{product.price.toLocaleString()} RWF · {product.category || 'Uncategorized'}</Text><Text variant="caption" muted style={{ marginTop: 3 }}>Visible to: {product.visibleTo?.join(', ') || 'none'}</Text></View><View style={styles.productActions}><Badge label={product.isAvailable ? 'Available' : 'Hidden'} /><Pressable accessibilityLabel={`Edit ${product.name}`} onPress={() => setEditorProduct(product)} style={styles.smallIcon}><Ionicons name="create-outline" size={19} color={colors.red} /></Pressable><Pressable accessibilityLabel={`Delete ${product.name}`} onPress={() => deleteProduct(product)} style={styles.smallIcon}><Ionicons name="trash-outline" size={19} color={colors.danger} /></Pressable></View></Card>)}<ProductEditor visible={editorProduct !== undefined} product={editorProduct || null} saving={saving} uploading={uploading} onClose={() => setEditorProduct(undefined)} onUpload={uploadImage} onSave={saveProduct} /></AdminScreen>
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  useFocusEffect(useCallback(() => { let alive = true; setOrders(null); api.get<{ orders: Order[] }>('/orders/all').then((r) => { if (alive) setOrders(r.data.orders) }).catch(() => { if (alive) setOrders([]) }); return () => { alive = false } }, []))
  return <AdminScreen title="Orders"><SectionIntro title="Order operations" detail="Review delivery details and keep customers informed." />{orders === null ? <LoadingCard /> : orders.length === 0 ? <Card><EmptyState icon="receipt-outline" title="No orders yet" subtitle="Orders will appear here when customers check out." /></Card> : orders.map((order) => <Card key={order.id}><View style={styles.orderTop}><View style={{ flex: 1 }}><Text variant="label">{order.product.name}</Text><Text variant="caption" muted style={{ marginTop: 3 }}>{order.user.fullName} · {order.user.email}</Text></View><Badge label={order.status} status={order.status} /></View><Text variant="heading" color={colors.red} style={{ marginTop: spacing.md }}>{order.totalPrice.toLocaleString()} RWF</Text><Text variant="caption" muted style={{ marginTop: 3 }}>{new Date(order.createdAt).toLocaleDateString()}</Text></Card>)}</AdminScreen>
}

function ContentTab({ kind }: { kind: 'Education' | 'Messages' }) {
  const education = kind === 'Education'
  const [articles, setArticles] = useState<Article[] | null>(education ? null : [])
  const [conversations, setConversations] = useState<Array<{ id: string; user?: { fullName: string; email: string }; messages: Array<{ body: string; createdAt: string }> }> | null>(education ? [] : null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [draft, setDraft] = useState({ title: '', summary: '', body: '', category: 'Menstrual health' })
  const [saving, setSaving] = useState(false)
  useFocusEffect(useCallback(() => { if (!education) return undefined; let alive = true; api.get<{ articles: Article[] }>('/education/all').then((response) => { if (alive) setArticles(response.data.articles) }).catch(() => { if (alive) setArticles([]) }); return () => { alive = false } }, [education]))
  useFocusEffect(useCallback(() => { if (education) return undefined; let alive = true; api.get<{ conversations: Array<{ id: string; user?: { fullName: string; email: string }; messages: Array<{ body: string; createdAt: string }> }> }>('/support/conversations').then((response) => { if (alive) setConversations(response.data.conversations) }).catch(() => { if (alive) setConversations([]) }); return () => { alive = false } }, [education]))
  const publish = async () => { if (draft.title.trim().length < 3 || draft.summary.trim().length < 10 || draft.body.trim().length < 20) { Alert.alert('Complete the article', 'Add a title, summary, and a longer body before publishing.'); return }; setSaving(true); try { await api.post('/education', { ...draft, status: 'published', visibleTo: ['girl', 'boy', 'parent'] }); setEditorOpen(false); setDraft({ title: '', summary: '', body: '', category: 'Menstrual health' }); const response = await api.get<{ articles: Article[] }>('/education/all'); setArticles(response.data.articles) } catch (error) { Alert.alert('Could not publish article', apiErrorMessage(error)) } finally { setSaving(false) } }
  return <AdminScreen title={education ? 'Education' : 'Messages'}><Card style={styles.welcomeCard}><Text variant="caption" color={colors.red}>{education ? 'CONTENT STUDIO' : 'SUPPORT DESK'}</Text><Text variant="title" style={{ marginTop: spacing.xs }}>{education ? 'Teach with care.' : 'Stay close to customers.'}</Text><Text muted style={{ marginTop: spacing.sm, lineHeight: 21 }}>{education ? 'Write, review, and publish clear health guidance for Rwanda.' : 'Review customer conversations and keep support moving.'}</Text></Card>{education ? <><Button title="Write article" accent={colors.red} onPress={() => setEditorOpen(true)} />{articles === null ? <LoadingCard /> : articles.length === 0 ? <Card><EmptyState icon="book-outline" title="No articles yet" subtitle="Write the first trusted guide for your community." /></Card> : articles.map((article) => <Card key={article.id}><View style={styles.articleAdminTop}><View style={{ flex: 1 }}><Text variant="label">{article.title}</Text><Text variant="caption" muted style={{ marginTop: spacing.xs }}>{article.category} · updated {new Date(article.updatedAt).toLocaleDateString()}</Text></View><Badge label={article.status} /></View><Text variant="caption" muted style={{ marginTop: spacing.sm }}>{article.summary}</Text></Card>)}<Modal visible={editorOpen} transparent animationType="slide" onRequestClose={() => setEditorOpen(false)}><Pressable style={styles.modalOverlay} onPress={() => setEditorOpen(false)}><Pressable style={styles.editorSheet} onPress={(event) => event.stopPropagation()}><Text variant="caption" color={colors.red}>NEW ARTICLE</Text><Text variant="title" style={{ marginTop: spacing.xs }}>Write for care</Text><ScrollView contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.lg }}><EditorInput label="Title" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} placeholder="Article title" /><EditorInput label="Summary" value={draft.summary} onChangeText={(summary) => setDraft({ ...draft, summary })} placeholder="Short summary" multiline /><EditorInput label="Body" value={draft.body} onChangeText={(body) => setDraft({ ...draft, body })} placeholder="Write the article content" multiline /><EditorInput label="Category" value={draft.category} onChangeText={(category) => setDraft({ ...draft, category })} placeholder="Menstrual health" /><Button title="Publish article" loading={saving} disabled={saving} accent={colors.red} onPress={publish} /><Button title="Cancel" variant="ghost" disabled={saving} onPress={() => setEditorOpen(false)} /></ScrollView></Pressable></Pressable></Modal></> : conversations === null ? <LoadingCard /> : conversations.length === 0 ? <Card><EmptyState icon="chatbubbles-outline" title="No conversations yet" subtitle="Customer messages will appear here." /></Card> : conversations.map((conversation) => <Card key={conversation.id}><Text variant="label">{conversation.user?.fullName || 'Customer'}</Text><Text variant="caption" muted style={{ marginTop: spacing.xs }}>{conversation.user?.email || 'No email available'}</Text><Text style={{ marginTop: spacing.sm }}>{conversation.messages[0]?.body || 'Conversation started'}</Text></Card>)}</AdminScreen>
}

function SettingsTab() { const { logout } = useAuth(); return <AdminScreen title="Settings"><SectionIntro title="Admin settings" detail="Keep your account and operating preferences in order." /><Card><ActionRow icon="person-circle-outline" title="Admin account" detail="Manage your signed-in administrator profile." /><ActionRow icon="lock-closed-outline" title="Privacy and audit" detail="Sensitive actions are recorded for accountability." /><ActionRow icon="globe-outline" title="Rwanda content" detail="English now, with Kinyarwanda-ready content planned." /></Card><Button title="Log out" variant="danger" onPress={logout} /></AdminScreen> }

export default function AdminDashboard() {
  return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.red, tabBarInactiveTintColor: colors.gray500, tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.tabBarLabel, tabBarIcon: ({ color, size }) => <Ionicons name={TAB_META[route.name as AdminTab]} size={size} color={color} /> })}><Tab.Screen name="Overview" component={OverviewTab} options={{ tabBarLabel: 'Overview' }} /><Tab.Screen name="Users" component={UsersTab} /><Tab.Screen name="Products" component={ProductsTab} /><Tab.Screen name="Orders" component={OrdersTab} /><Tab.Screen name="Education" component={() => <ContentTab kind="Education" />} /><Tab.Screen name="Messages" component={() => <ContentTab kind="Messages" />} /><Tab.Screen name="Settings" component={SettingsTab} /></Tab.Navigator>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl * 2 },
  welcomeCard: { backgroundColor: roleColors.admin.soft, minHeight: 164, justifyContent: 'flex-end' },
  statGrid: { flexDirection: 'row', gap: spacing.sm },
  adminStat: { flex: 1, minHeight: 122 },
  adminStatIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: roleColors.admin.soft, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  actionIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: roleColors.admin.soft, alignItems: 'center', justifyContent: 'center' },
  sectionIntro: { paddingHorizontal: spacing.xs },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  userAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: roleColors.admin.soft, alignItems: 'center', justifyContent: 'center' },
  productIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: roleColors.admin.soft, alignItems: 'center', justifyContent: 'center' },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  productActions: { alignItems: 'flex-end', gap: spacing.sm },
  smallIcon: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(23, 33, 31, 0.45)' },
  editorSheet: { maxHeight: '92%', backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl },
  modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.gray300, alignSelf: 'center', marginBottom: spacing.lg },
  editorField: { marginBottom: spacing.md },
  editorInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, backgroundColor: colors.gray100 },
  multilineInput: { minHeight: 78, textAlignVertical: 'top' },
  formColumns: { flexDirection: 'row', gap: spacing.md },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  roleChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  roleChipActive: { backgroundColor: colors.red, borderColor: colors.red },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.red, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm },
  articleAdminTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tabBar: { height: 72, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  tabBarLabel: { fontSize: 10, fontWeight: '600' },
})
