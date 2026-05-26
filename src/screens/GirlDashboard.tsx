import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native'
import { supabase } from '../lib/supabase'

type Product = {
  id: number
  name: string
  description: string
  price: number
  category: string
}

type Order = {
  id: number
  product_id: number
  product_name: string
  quantity: number
  total_price: number
  status: string
  created_at: string
}

type CycleEntry = {
  id: number
  start_date: string
  end_date: string | null
}

export default function GirlDashboard({ onLogout }: { onLogout: () => void }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cycles, setCycles] = useState<CycleEntry[]>([])
  const [showProducts, setShowProducts] = useState(true)
  const [showOrders, setShowOrders] = useState(false)
  const [showPeriod, setShowPeriod] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [prediction, setPrediction] = useState<string | null>(null)

  useEffect(() => {
    getUserAndLoadData()
  }, [])

  const getUserAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      loadProducts()
      loadOrders(user.id)
      loadCycles(user.id)
      loadUserProfile(user.id)
    }
  }

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .contains('visible_to', ['girl'])
      .eq('is_available', true)
    
    if (error) {
      console.error('Error loading products:', error)
    } else {
      setProducts(data || [])
    }
  }

  const loadOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products (name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading orders:', error)
    } else if (data) {
      const formattedOrders = data.map(order => ({
        ...order,
        product_name: order.products?.name || 'Unknown'
      }))
      setOrders(formattedOrders)
    }
  }

  const loadCycles = async (userId: string) => {
    const { data, error } = await supabase
      .from('cycle_entries')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
    
    if (error) {
      console.error('Error loading cycles:', error)
    } else {
      setCycles(data || [])
      calculatePrediction(data || [])
    }
  }

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('delivery_address')
      .eq('id', userId)
      .single()
    
    if (!error && data?.delivery_address) {
      setDeliveryAddress(data.delivery_address)
    }
  }

  const calculatePrediction = (cycleData: CycleEntry[]) => {
    if (cycleData.length < 2) {
      setPrediction('Log at least 2 periods to see predictions')
      return
    }

    const lengths: number[] = []
    for (let i = 0; i < Math.min(cycleData.length - 1, 3); i++) {
      const start1 = new Date(cycleData[i].start_date)
      const start2 = new Date(cycleData[i+1].start_date)
      const days = Math.abs(Math.floor((start1.getTime() - start2.getTime()) / (1000 * 60 * 60 * 24)))
      if (days >= 21 && days <= 40) lengths.push(days)
    }

    const avgCycle = lengths.length > 0 
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 28

    const lastStart = new Date(cycleData[0].start_date)
    const nextPeriod = new Date(lastStart)
    nextPeriod.setDate(lastStart.getDate() + avgCycle)
    
    const today = new Date()
    const daysUntil = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil <= 3 && daysUntil >= 0) {
      Alert.alert('Period Reminder', 'Your period is coming soon! Consider ordering hygiene supplies.')
    }
    
    setPrediction(`Next period expected in ${daysUntil} days (around ${nextPeriod.toISOString().split('T')[0]})`)
  }

  const placeOrder = async () => {
    if (!selectedProduct) return
    
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Error', 'Please enter a valid quantity')
      return
    }
    
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter delivery address')
      return
    }
    
    const totalPrice = selectedProduct.price * qty
    
    const { error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        product_id: selectedProduct.id,
        quantity: qty,
        total_price: totalPrice,
        delivery_address: deliveryAddress,
        status: 'pending',
        payment_method: 'cash_on_delivery',
        payment_status: 'unpaid'
      })
    
    if (error) {
      Alert.alert('Error', 'Failed to place order')
      console.error(error)
    } else {
      Alert.alert('Success', 'Order placed successfully!')
      setShowOrderModal(false)
      setQuantity('1')
      if (userId) loadOrders(userId)
    }
  }

  const logPeriod = async () => {
    if (!periodStart) {
      Alert.alert('Error', 'Please enter start date')
      return
    }
    useEffect(() => {
  checkUserRole()
}, [])

const checkUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  console.log('User:', user?.email)
  console.log('User role from metadata:', user?.user_metadata?.role)
  
  // Also check profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()
  console.log('Profile role:', profile?.role)
}
    
    const { error } = await supabase
      .from('cycle_entries')
      .insert({
        user_id: userId,
        start_date: periodStart,
        end_date: periodEnd || null
      })
    
    if (error) {
      Alert.alert('Error', 'Failed to log period')
    } else {
      Alert.alert('Success', 'Period logged!')
      setPeriodStart('')
      setPeriodEnd('')
      if (userId) {
        loadCycles(userId)
      }
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Dashboard</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, showProducts && styles.activeTab]} 
          onPress={() => { setShowProducts(true); setShowOrders(false); setShowPeriod(false) }}
        >
          <Text style={styles.tabText}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, showOrders && styles.activeTab]} 
          onPress={() => { setShowProducts(false); setShowOrders(true); setShowPeriod(false) }}
        >
          <Text style={styles.tabText}>My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, showPeriod && styles.activeTab]} 
          onPress={() => { setShowProducts(false); setShowOrders(false); setShowPeriod(true) }}
        >
          <Text style={styles.tabText}>Period</Text>
        </TouchableOpacity>
      </View>

      {/* Products Section */}
      {showProducts && (
        <View>
          <Text style={styles.sectionTitle}>Available Products</Text>
          {products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
                <Text style={styles.productPrice}>{product.price.toLocaleString()} RWF</Text>
              </View>
              <TouchableOpacity 
                style={styles.orderButton}
                onPress={() => {
                  setSelectedProduct(product)
                  setShowOrderModal(true)
                }}
              >
                <Text style={styles.orderButtonText}>Order</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Orders Section */}
      {showOrders && (
        <View>
          <Text style={styles.sectionTitle}>My Orders</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet</Text>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <Text style={styles.orderProduct}>{order.product_name}</Text>
                <Text>Quantity: {order.quantity}</Text>
                <Text>Total: {order.total_price.toLocaleString()} RWF</Text>
                <Text>Status: {order.status}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Period Section */}
      {showPeriod && (
        <View>
          <Text style={styles.sectionTitle}>Period Tracking</Text>
          
          <View style={styles.predictionCard}>
            <Text style={styles.predictionText}>{prediction || 'Loading...'}</Text>
          </View>
          
          <Text style={styles.subtitle}>Log New Period</Text>
          <TextInput
            style={styles.input}
            placeholder="Start Date (YYYY-MM-DD)"
            value={periodStart}
            onChangeText={setPeriodStart}
          />
          <TextInput
            style={styles.input}
            placeholder="End Date (YYYY-MM-DD) - Optional"
            value={periodEnd}
            onChangeText={setPeriodEnd}
          />
          <TouchableOpacity style={styles.logButton} onPress={logPeriod}>
            <Text style={styles.logButtonText}>Log Period</Text>
          </TouchableOpacity>
          
          <Text style={styles.subtitle}>Recent Periods</Text>
          {cycles.length === 0 ? (
            <Text style={styles.emptyText}>No periods logged yet</Text>
          ) : (
            cycles.slice(0, 5).map((cycle) => (
              <View key={cycle.id} style={styles.historyItem}>
                <Text>Start: {cycle.start_date}</Text>
                {cycle.end_date && <Text>End: {cycle.end_date}</Text>}
              </View>
            ))
          )}
        </View>
      )}

      {/* Order Modal */}
      <Modal visible={showOrderModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Place Order</Text>
            {selectedProduct && (
              <>
                <Text style={styles.modalProduct}>{selectedProduct.name}</Text>
                <Text style={styles.modalPrice}>{selectedProduct.price.toLocaleString()} RWF each</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Delivery Address (Kigali)"
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                />
                
                <TouchableOpacity style={styles.confirmButton} onPress={placeOrder}>
                  <Text style={styles.confirmButtonText}>Confirm Order</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowOrderModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e91e63'
  },
  logoutButton: {
    padding: 8
  },
  logoutText: {
    color: '#e91e63',
    fontSize: 14
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#e91e63'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e91e63'
  },
  orderButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5
  },
  orderDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 5
  },
  predictionCard: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  predictionText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 15
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14
  },
  logButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  logButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  modalProduct: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5
  },
  modalPrice: {
    fontSize: 14,
    color: '#e91e63',
    textAlign: 'center',
    marginBottom: 15
  },
  confirmButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  cancelButtonText: {
    color: '#666'
  }
})