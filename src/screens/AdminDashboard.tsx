import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native'
import { supabase } from '../lib/supabase'

type User = {
  id: string
  email: string
  full_name: string
  role: string
  phone: string
  created_at: string
}

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

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'products'>('users')
  const [users, setUsers] = useState<User[]>([])
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
    loadUsers()
    loadOrders()
    loadProducts()
  }, [])

  const loadUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error loading users:', error)
  } else {
    setUsers(data || [])
  }
}

  const loadOrders = async () => {
  // First get all orders
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (ordersError) {
    console.error('Error loading orders:', ordersError)
    return
  }
  
  if (!ordersData || ordersData.length === 0) {
    setOrders([])
    return
  }
  
  // Get all unique user IDs from orders
  const userIds = [...new Set(ordersData.map(order => order.user_id))]
  
  // Get profiles for these users
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds)
  
  if (profilesError) {
    console.error('Error loading profiles:', profilesError)
  }
  
  // Get all unique product IDs from orders
  const productIds = [...new Set(ordersData.map(order => order.product_id))]
  
  // Get products for these orders
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .in('id', productIds)
  
  if (productsError) {
    console.error('Error loading products:', productsError)
  }
  
  // Create maps for quick lookup
  const profileMap = new Map()
  profilesData?.forEach(profile => {
    profileMap.set(profile.id, profile)
  })
  
  const productMap = new Map()
  productsData?.forEach(product => {
    productMap.set(product.id, product)
  })
  
  // Combine the data
  const combinedOrders = ordersData.map(order => ({
    ...order,
    profiles: profileMap.get(order.user_id) || { email: 'Unknown' },
    products: productMap.get(order.product_id) || { name: 'Unknown' }
  }))
  
  setOrders(combinedOrders)
}

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id')
    
    if (error) {
      console.error('Error loading products:', error)
    } else {
      setProducts(data || [])
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    
    if (error) {
      Alert.alert('Error', 'Failed to update order status')
    } else {
      Alert.alert('Success', 'Order status updated')
      loadOrders()
    }
  }

  const saveProduct = async () => {
    if (!productName || !productPrice) {
      Alert.alert('Error', 'Please fill required fields')
      return
    }

    const visibleToArray = productVisibleTo.split(',').map(s => s.trim())
    const priceNum = parseInt(productPrice)

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({
          name: productName,
          description: productDescription,
          price: priceNum,
          category: productCategory,
          visible_to: visibleToArray
        })
        .eq('id', editingProduct.id)
      
      if (error) {
        Alert.alert('Error', 'Failed to update product')
      } else {
        Alert.alert('Success', 'Product updated')
        setShowProductModal(false)
        loadProducts()
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert({
          name: productName,
          description: productDescription,
          price: priceNum,
          category: productCategory,
          visible_to: visibleToArray,
          is_available: true
        })
      
      if (error) {
        Alert.alert('Error', 'Failed to create product')
      } else {
        Alert.alert('Success', 'Product created')
        setShowProductModal(false)
        loadProducts()
      }
    }
  }

  const deleteProduct = async (productId: number) => {
    Alert.alert('Confirm', 'Delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
          
          if (error) {
            Alert.alert('Error', 'Failed to delete product')
          } else {
            Alert.alert('Success', 'Product deleted')
            loadProducts()
          }
        }
      }
    ])
  }

  const deleteUser = async (userId: string) => {
    Alert.alert('Confirm', 'Delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('profiles').delete().eq('id', userId)
          loadUsers()
          Alert.alert('Success', 'User deleted')
        }
      }
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={styles.tabText}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={styles.tabText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={styles.tabText}>Products</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'users' && (
        <View>
          <Text style={styles.sectionTitle}>Registered Users</Text>
          {users.length === 0 ? (
            <Text style={styles.emptyText}>No users found</Text>
          ) : (
            users.map((user) => (
              <View key={user.id} style={styles.card}>
                <Text style={styles.cardTitle}>{user.full_name}</Text>
                <Text>Email: {user.email}</Text>
                <Text>Role: {user.role}</Text>
                <Text>Phone: {user.phone}</Text>
                <Text style={styles.cardDate}>
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </Text>
                {user.role !== 'admin' && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteUser(user.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete User</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === 'orders' && (
        <View>
          <Text style={styles.sectionTitle}>All Orders</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders found</Text>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.card}>
                <Text style={styles.cardTitle}>Order #{order.id}</Text>
                <Text>Customer: {order.profiles?.email || 'Unknown'}</Text>
                <Text>Product: {order.products?.name || 'Unknown'}</Text>
                <Text>Quantity: {order.quantity}</Text>
                <Text>Total: {order.total_price.toLocaleString()} RWF</Text>
                <Text>Address: {order.delivery_address}</Text>
                <Text>Status: {order.status}</Text>
                <View style={styles.statusButtons}>
                  {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusButton, order.status === status && styles.activeStatusButton]}
                      onPress={() => updateOrderStatus(order.id, status)}
                    >
                      <Text style={styles.statusButtonText}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === 'products' && (
        <View>
          <View style={styles.addButtonRow}>
            <Text style={styles.sectionTitle}>Products</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => openProductModal()}
            >
              <Text style={styles.addButtonText}>+ Add Product</Text>
            </TouchableOpacity>
          </View>
          
          {products.length === 0 ? (
            <Text style={styles.emptyText}>No products found</Text>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.card}>
                <Text style={styles.cardTitle}>{product.name}</Text>
                <Text>{product.description}</Text>
                <Text>Price: {product.price.toLocaleString()} RWF</Text>
                <Text>Category: {product.category}</Text>
                <Text>Visible to: {product.visible_to?.join(', ')}</Text>
                <View style={styles.productButtons}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => openProductModal(product)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButtonSmall}
                    onPress={() => deleteProduct(product.id)}
                  >
                    <Text style={styles.deleteButtonTextSmall}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <Modal visible={showProductModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={productName}
              onChangeText={setProductName}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={productDescription}
              onChangeText={setProductDescription}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Price (RWF)"
              value={productPrice}
              onChangeText={setProductPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Category (pads, condoms, pain, hygiene, test)"
              value={productCategory}
              onChangeText={setProductCategory}
            />
            <TextInput
              style={styles.input}
              placeholder="Visible to (girl, boy, parent) - comma separated"
              value={productVisibleTo}
              onChangeText={setProductVisibleTo}
            />
            
            <TouchableOpacity style={styles.saveButton} onPress={saveProduct}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowProductModal(false)}>
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
    color: '#f44336'
  },
  logoutButton: {
    padding: 8
  },
  logoutText: {
    color: '#f44336',
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
    backgroundColor: '#f44336'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  addButtonRow: {
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  cardDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 8
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8
  },
  statusButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 8,
    marginBottom: 5
  },
  activeStatusButton: {
    backgroundColor: '#4caf50'
  },
  statusButtonText: {
    fontSize: 12,
    color: '#333'
  },
  productButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10
  },
  editButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  deleteButtonSmall: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5
  },
  deleteButtonTextSmall: {
    color: '#fff',
    fontWeight: '600'
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
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
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
  }
})