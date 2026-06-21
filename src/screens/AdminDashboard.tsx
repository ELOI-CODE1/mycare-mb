import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/AppHeader'
import { Text, Card, Button, Input, Badge, Segmented, EmptyState } from '../components/ui'
import { categoryEmoji } from '../components/ProductCard'
import AdminOverview from '../components/admin/AdminOverview'
import AdminUsers from '../components/admin/AdminUsers'
import { colors, spacing, radius, roleColors } from '../theme'

type Order = {
  id: number
  user_id: string
  product_id: number
  quantity: number
  total_price: number
  status: string
  delivery_address: string
  created_at: string
  profiles?: { email: string }
  products?: { name: string }
}

type Product = {
  id: number
  name: string
  description: string
  price: number
  category: string
  visible_to: string[]
  is_available: boolean
}

const ACCENT = roleColors.admin.accent
const SOFT = roleColors.admin.soft
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'products'>('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productVisibleTo, setProductVisibleTo] = useState('')

  useEffect(() => {
    loadOrders()
    loadProducts()
  }, [])

  const loadOrders = async () => {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) { console.error('Error loading orders:', ordersError); return }
    if (!ordersData || ordersData.length === 0) { setOrders([]); return }

    const userIds = [...new Set(ordersData.map(o => o.user_id))]
    const { data: profilesData } = await supabase.from('profiles').select('id, email').in('id', userIds)

    const productIds = [...new Set(ordersData.map(o => o.product_id))]
    const { data: productsData } = await supabase.from('products').select('id, name').in('id', productIds)

    const profileMap = new Map<string, any>()
    profilesData?.forEach(p => profileMap.set(p.id, p))
    const productMap = new Map<number, any>()
    productsData?.forEach(p => productMap.set(p.id, p))

    setOrders(ordersData.map(o => ({
      ...o,
      profiles: profileMap.get(o.user_id) || { email: 'Unknown' },
      products: productMap.get(o.product_id) || { name: 'Unknown' },
    })))
  }

  const loadProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('id')
    if (error) console.error('Error loading products:', error)
    else setProducts(data || [])
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (error) Alert.alert('Error', 'Failed to update order status')
    else loadOrders()
  }

  const saveProduct = async () => {
    if (!productName || !productPrice) {
      Alert.alert('Error', 'Please fill required fields')
      return
    }
    const visibleToArray = productVisibleTo.split(',').map(s => s.trim()).filter(Boolean)
    const priceNum = parseInt(productPrice)

    const payload = {
      name: productName,
      description: productDescription,
      price: priceNum,
      category: productCategory,
      visible_to: visibleToArray,
    }

    const { error } = editingProduct
      ? await supabase.from('products').update(payload).eq('id', editingProduct.id)
      : await supabase.from('products').insert({ ...payload, is_available: true })

    if (error) {
      Alert.alert('Error', `Failed to ${editingProduct ? 'update' : 'create'} product`)
    } else {
      setShowProductModal(false)
      loadProducts()
    }
  }

  const deleteProduct = (productId: number) => {
    Alert.alert('Confirm', 'Delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', productId)
          if (error) Alert.alert('Error', 'Failed to delete product')
          else loadProducts()
        },
      },
    ])
  }

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductName(product.name)
      setProductDescription(product.description || '')
      setProductPrice(product.price.toString())
      setProductCategory(product.category)
      setProductVisibleTo(product.visible_to?.join(', ') || '')
    } else {
      setEditingProduct(null)
      setProductName('')
      setProductDescription('')
      setProductPrice('')
      setProductCategory('')
      setProductVisibleTo('')
    }
    setShowProductModal(true)
  }

  return (
    <View style={styles.root}>
      <AppHeader role="admin" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="title">Admin Dashboard</Text>
        <Text muted style={{ marginBottom: spacing.lg }}>Manage users, orders and products.</Text>

        <Segmented
          accent={ACCENT}
          value={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          tabs={[
            { key: 'overview', label: 'Overview' },
            { key: 'users', label: 'Users' },
            { key: 'orders', label: 'Orders' },
            { key: 'products', label: 'Products' },
          ]}
        />

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <AdminOverview orders={orders} productCount={products.length} accent={ACCENT} soft={SOFT} />
        )}

        {/* USERS */}
        {activeTab === 'users' && <AdminUsers />}

        {/* ORDERS */}
        {activeTab === 'orders' && (
          orders.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No orders found" />
          ) : (
            orders.map(order => (
              <Card key={order.id}>
                <View style={styles.rowBetween}>
                  <Text variant="label">Order #{order.id}</Text>
                  <Badge label={order.status} status={order.status} />
                </View>
                <View style={{ marginTop: spacing.sm, gap: 2 }}>
                  <Text variant="caption" muted>Customer: {order.profiles?.email || 'Unknown'}</Text>
                  <Text variant="caption" muted>Product: {order.products?.name || 'Unknown'} × {order.quantity}</Text>
                  <Text variant="caption" muted>Total: {order.total_price.toLocaleString()} RWF</Text>
                  <Text variant="caption" muted>Address: {order.delivery_address || '—'}</Text>
                </View>
                <Text variant="caption" muted style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>Update status</Text>
                <View style={styles.statusRow}>
                  {STATUSES.map(status => {
                    const active = order.status === status
                    return (
                      <TouchableOpacity
                        key={status}
                        onPress={() => updateOrderStatus(order.id, status)}
                        style={[styles.statusChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                      >
                        <Text variant="caption" color={active ? colors.white : colors.gray700} style={{ textTransform: 'capitalize' }}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </Card>
            ))
          )
        )}

        {/* PRODUCTS */}
        {activeTab === 'products' && (
          <View>
            <Button
              title="+ Add Product"
              accent={ACCENT}
              onPress={() => openProductModal()}
              style={{ marginBottom: spacing.lg }}
            />
            {products.length === 0 ? (
              <EmptyState icon="cube-outline" title="No products found" />
            ) : (
              products.map(product => (
                <Card key={product.id} style={styles.productCard}>
                  <View style={[styles.thumb, { backgroundColor: SOFT }]}>
                    <Text style={{ fontSize: 24 }}>{categoryEmoji(product.category)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label">{product.name}</Text>
                    <Text variant="caption" muted numberOfLines={1}>{product.description}</Text>
                    <Text variant="label" color={ACCENT} style={{ marginTop: 2 }}>{product.price.toLocaleString()} RWF</Text>
                    <Text variant="caption" muted>Visible to: {product.visible_to?.join(', ') || '—'}</Text>
                    <View style={styles.productActions}>
                      <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.blueSoft }]} onPress={() => openProductModal(product)}>
                        <Ionicons name="create-outline" size={16} color={colors.blue} />
                        <Text variant="caption" color={colors.blue}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.redSoft }]} onPress={() => deleteProduct(product.id)}>
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        <Text variant="caption" color={colors.danger}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Product add/edit modal */}
      <Modal visible={showProductModal} animationType="slide" transparent onRequestClose={() => setShowProductModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="heading" center style={{ marginBottom: spacing.lg }}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            <ScrollView>
              <Input label="Name" placeholder="Product name" value={productName} onChangeText={setProductName} />
              <Input label="Description" placeholder="Short description" value={productDescription} onChangeText={setProductDescription} multiline />
              <Input label="Price (RWF)" placeholder="2500" value={productPrice} onChangeText={setProductPrice} keyboardType="numeric" />
              <Input label="Category" placeholder="pads, condoms, pain, hygiene, test" value={productCategory} onChangeText={setProductCategory} />
              <Input label="Visible to" placeholder="girl, boy, parent" value={productVisibleTo} onChangeText={setProductVisibleTo} />
              <Button title="Save" accent={ACCENT} onPress={saveProduct} />
              <Button title="Cancel" variant="secondary" onPress={() => setShowProductModal(false)} style={{ marginTop: spacing.sm }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productCard: { flexDirection: 'row', gap: spacing.md },
  thumb: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  productActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, maxHeight: '85%' },
})
