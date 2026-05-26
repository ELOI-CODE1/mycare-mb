import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native'
import { supabase } from '../lib/supabase'

type Product = {
  id: number
  name: string
  description: string
  price: number
}

type Order = {
  id: number
  product_name: string
  quantity: number
  total_price: number
  status: string
  created_at: string
}

type Child = {
  id: string
  name: string
  date_of_birth: string
  role: string
}

export default function ParentDashboard({ onLogout }: { onLogout: () => void }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [showProducts, setShowProducts] = useState(true)
  const [showOrders, setShowOrders] = useState(false)
  const [showChildren, setShowChildren] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  const [childName, setChildName] = useState('')
  const [childDob, setChildDob] = useState('')
  const [childRole, setChildRole] = useState('girl')

  useEffect(() => {
    getUserAndLoadData()
  }, [])

  const getUserAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      loadProducts()
      loadOrders(user.id)
      loadChildren(user.id)
      loadUserProfile(user.id)
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

  const loadChildren = async (userId: string) => {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', userId)
    
    if (error) {
      console.error('Error loading children:', error)
    } else {
      setChildren(data || [])
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
      console.error(error)
    } else {
      Alert.alert('Success', 'Child added successfully!')
      setShowAddChild(false)
      setChildName('')
      setChildDob('')
      if (userId) loadChildren(userId)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Care</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, showProducts && styles.activeTab]} 
          onPress={() => { setShowProducts(true); setShowOrders(false); setShowChildren(false) }}
        >
          <Text style={styles.tabText}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, showOrders && styles.activeTab]} 
          onPress={() => { setShowProducts(false); setShowOrders(true); setShowChildren(false) }}
        >
          <Text style={styles.tabText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, showChildren && styles.activeTab]} 
          onPress={() => { setShowProducts(false); setShowOrders(false); setShowChildren(true) }}
        >
          <Text style={styles.tabText}>Children</Text>
        </TouchableOpacity>
      </View>

      {showProducts && (
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

      {showOrders && (
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

      {showChildren && (
        <View>
          <View style={styles.addChildCard}>
            <Text style={styles.sectionTitle}>My Children</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddChild(true)}>
              <Text style={styles.addButtonText}>+ Add Child</Text>
            </TouchableOpacity>
          </View>
          
          {children.length === 0 ? (
            <Text style={styles.emptyText}>No children added yet</Text>
          ) : (
            children.map((child) => (
              <View key={child.id} style={styles.childCard}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text>Role: {child.role === 'girl' ? 'Daughter' : 'Son'}</Text>
                {child.date_of_birth && <Text>DOB: {child.date_of_birth}</Text>}
              </View>
            ))
          )}
        </View>
      )}

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
                <Text>Daughter</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleOption, childRole === 'boy' && styles.roleSelected]}
                onPress={() => setChildRole('boy')}
              >
                <Text>Son</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.confirmButton} onPress={addChild}>
              <Text style={styles.confirmButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddChild(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  addChildCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 10
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5
  },
  roleSelect: {
    flexDirection: 'row',
    marginBottom: 15
  },
  roleOption: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 5
  },
  roleSelected: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50'
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