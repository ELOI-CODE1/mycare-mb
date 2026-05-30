import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native'
import { supabase } from '../lib/supabase'

type Child = {
  id: number
  name: string
  date_of_birth: string
  role: string
}

type ChildCycle = {
  id: number
  start_date: string
  end_date: string | null
}

type Product = {
  id: number
  name: string
  description: string
  price: number
  visible_to: string[]
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

export default function ParentDashboard({ onLogout }: { onLogout: () => void }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'children' | 'products' | 'orders'>('children')
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [childCycles, setChildCycles] = useState<ChildCycle[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [showAddChild, setShowAddChild] = useState(false)
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [showCycleHistory, setShowCycleHistory] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [childName, setChildName] = useState('')
  const [childDob, setChildDob] = useState('')
  const [childRole, setChildRole] = useState('girl')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [prediction, setPrediction] = useState<string | null>(null)

  useEffect(() => {
    getUserId()
    loadProducts()
  }, [])

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      loadChildren(user.id)
      loadOrders(user.id)
      loadUserProfile(user.id)
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

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .contains('visible_to', ['parent'])
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
      .select('*, products(name)')
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

  const loadChildren = async (parentId: string) => {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading children:', error)
    } else {
      setChildren(data || [])
    }
  }

  const loadChildCycles = async (childId: number) => {
    const { data, error } = await supabase
      .from('child_cycle_entries')
      .select('*')
      .eq('child_id', childId)
      .order('start_date', { ascending: false })
    
    if (error) {
      console.error('Error loading child cycles:', error)
    } else {
      setChildCycles(data || [])
      calculatePrediction(data || [])
    }
  }

  const calculatePrediction = (cycles: ChildCycle[]) => {
    if (cycles.length < 2) {
      setPrediction('Log at least 2 periods to see predictions')
      return
    }

    const lengths: number[] = []
    for (let i = 0; i < Math.min(cycles.length - 1, 3); i++) {
      const start1 = new Date(cycles[i].start_date)
      const start2 = new Date(cycles[i+1].start_date)
      const days = Math.abs(Math.floor((start1.getTime() - start2.getTime()) / (1000 * 60 * 60 * 24)))
      if (days >= 21 && days <= 40) lengths.push(days)
    }

    const avgCycle = lengths.length > 0 
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 28

    const lastStart = new Date(cycles[0].start_date)
    const nextPeriod = new Date(lastStart)
    nextPeriod.setDate(lastStart.getDate() + avgCycle)
    
    const today = new Date()
    const daysUntil = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil <= 5 && daysUntil >= 0) {
      Alert.alert('Period Reminder', `${selectedChild?.name}'s period is coming in ${daysUntil} days! Consider ordering supplies.`)
    }
    
    setPrediction(`${selectedChild?.name}'s next period expected in ${daysUntil} days (around ${nextPeriod.toISOString().split('T')[0]})`)
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

  const addChild = async () => {
    if (!childName.trim()) {
      Alert.alert('Error', 'Please enter child name')
      return
    }
    
    const { error } = await supabase
      .from('children')
      .insert({
        parent_id: userId,
        name: childName,
        date_of_birth: childDob || null,
        role: childRole
      })
    
    if (error) {
      Alert.alert('Error', 'Failed to add child')
    } else {
      Alert.alert('Success', `${childName} added successfully!`)
      setShowAddChild(false)
      setChildName('')
      setChildDob('')
      if (userId) loadChildren(userId)
    }
  }

  const deleteChild = async (childId: number, childName: string) => {
    Alert.alert('Confirm', `Delete ${childName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('children')
            .delete()
            .eq('id', childId)
          
          if (error) {
            Alert.alert('Error', 'Failed to delete child')
          } else {
            Alert.alert('Success', `${childName} removed`)
            if (userId) loadChildren(userId)
            if (selectedChild?.id === childId) setSelectedChild(null)
          }
        }
      }
    ])
  }

  const logChildPeriod = async () => {
    if (!selectedChild) return
    if (!periodStart) {
      Alert.alert('Error', 'Please enter start date')
      return
    }
    
    const { error } = await supabase
      .from('child_cycle_entries')
      .insert({
        child_id: selectedChild.id,
        start_date: periodStart,
        end_date: periodEnd || null
      })
    
    if (error) {
      Alert.alert('Error', 'Failed to log period')
    } else {
      Alert.alert('Success', `Period logged for ${selectedChild.name}`)
      setPeriodStart('')
      setPeriodEnd('')
      setShowPeriodModal(false)
      loadChildCycles(selectedChild.id)
    }
  }

  const selectChild = (child: Child) => {
    setSelectedChild(child)
    loadChildCycles(child.id)
    setShowCycleHistory(true)
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Care</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'children' && styles.activeTab]}
          onPress={() => setActiveTab('children')}
        >
          <Text style={styles.tabText}>Children</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={styles.tabText}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={styles.tabText}>Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Children Tab */}
      {activeTab === 'children' && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Children</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddChild(true)}>
              <Text style={styles.addButtonText}>+ Add Child</Text>
            </TouchableOpacity>
          </View>
          
          {children.length === 0 ? (
            <Text style={styles.emptyText}>No children added yet. Tap "Add Child" to get started.</Text>
          ) : (
            children.map((child) => (
              <View key={child.id} style={styles.childCard}>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childRole}>{child.role === 'girl' ? '👧 Daughter' : '👦 Son'}</Text>
                  {child.date_of_birth && (
                    <Text style={styles.childDob}>DOB: {child.date_of_birth}</Text>
                  )}
                </View>
                <View style={styles.childActions}>
                  {child.role === 'girl' && (
                    <TouchableOpacity 
                      style={styles.periodButton}
                      onPress={() => {
                        setSelectedChild(child)
                        setShowPeriodModal(true)
                      }}
                    >
                      <Text style={styles.periodButtonText}>Log Period</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.trackButton}
                    onPress={() => selectChild(child)}
                  >
                    <Text style={styles.trackButtonText}>Track</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteChildButton}
                    onPress={() => deleteChild(child.id, child.name)}
                  >
                    <Text style={styles.deleteChildButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <View>
          <Text style={styles.sectionTitle}>All Products</Text>
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

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <View>
          <Text style={styles.sectionTitle}>Family Orders</Text>
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

      {/* Child Cycle History Modal */}
      <Modal visible={showCycleHistory} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedChild?.name}'s Cycle History
            </Text>
            
            {prediction && (
              <View style={styles.predictionCard}>
                <Text style={styles.predictionText}>{prediction}</Text>
              </View>
            )}
            
            <Text style={styles.subtitle}>Recent Periods</Text>
            {childCycles.length === 0 ? (
              <Text style={styles.emptyText}>No periods logged yet</Text>
            ) : (
              childCycles.slice(0, 10).map((cycle) => (
                <View key={cycle.id} style={styles.historyItem}>
                  <Text>Start: {cycle.start_date}</Text>
                  {cycle.end_date && <Text>End: {cycle.end_date}</Text>}
                </View>
              ))
            )}
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setShowCycleHistory(false)
                setSelectedChild(null)
                setChildCycles([])
                setPrediction(null)
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Log Period Modal */}
      <Modal visible={showPeriodModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Log Period for {selectedChild?.name}
            </Text>
            
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
            
            <TouchableOpacity style={styles.saveButton} onPress={logChildPeriod}>
              <Text style={styles.saveButtonText}>Save Period</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setShowPeriodModal(false)
                setPeriodStart('')
                setPeriodEnd('')
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Child Modal */}
      <Modal visible={showAddChild} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Child</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Child's Name"
              value={childName}
              onChangeText={setChildName}
            />
            <TextInput
              style={styles.input}
              placeholder="Date of Birth (YYYY-MM-DD) - Optional"
              value={childDob}
              onChangeText={setChildDob}
            />
            
            <View style={styles.roleSelect}>
              <TouchableOpacity 
                style={[styles.roleOption, childRole === 'girl' && styles.roleSelected]}
                onPress={() => setChildRole('girl')}
              >
                <Text style={styles.roleOptionText}>👧 Daughter</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleOption, childRole === 'boy' && styles.roleSelected]}
                onPress={() => setChildRole('boy')}
              >
                <Text style={styles.roleOptionText}>👦 Son</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={addChild}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddChild(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    color: '#4caf50'
  },
  logoutButton: {
    padding: 8
  },
  logoutText: {
    color: '#4caf50',
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
    backgroundColor: '#4caf50'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  addButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  childInfo: {
    flex: 1
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  childRole: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  childDob: {
    fontSize: 10,
    color: '#999'
  },
  childActions: {
    flexDirection: 'row',
    gap: 8
  },
  periodButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  periodButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  trackButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  deleteChildButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  deleteChildButtonText: {
    color: '#fff',
    fontSize: 14
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
    color: '#4caf50'
  },
  orderButton: {
    backgroundColor: '#4caf50',
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
    marginBottom: 15
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
    marginTop: 10
  },
  historyItem: {
    backgroundColor: '#f5f5f5',
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
    width: '90%',
    maxHeight: '80%'
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
    color: '#4caf50',
    textAlign: 'center',
    marginBottom: 15
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14
  },
  roleSelect: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10
  },
  roleOption: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8
  },
  roleSelected: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50'
  },
  roleOptionText: {
    fontSize: 14
  },
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  saveButtonText: {
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
  },
  closeButton: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600'
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
  }
})