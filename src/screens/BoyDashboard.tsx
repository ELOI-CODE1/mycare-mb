import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
};

type Order = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
};

export default function BoyDashboard({ onLogout }: { onLogout: () => void }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'orders'>('shop');

  useEffect(() => {
    getUserId();
  }, []);

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadProducts();
      await loadOrders(user.id);
      await loadUserProfile(user.id);
    }
  };

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('delivery_address')
      .eq('id', userId)
      .single();
    
    if (!error && data?.delivery_address) {
      setDeliveryAddress(data.delivery_address);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .contains('visible_to', ['boy'])
      .eq('is_available', true);
    
    if (!error && data) {
      setProducts(data);
    }
  };

  const loadOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, products(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      const formattedOrders = data.map(order => ({
        ...order,
        product_name: order.products?.name || 'Unknown'
      }));
      setOrders(formattedOrders);
    }
  };

  const placeOrder = async () => {
    if (!selectedProduct) return;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }
    
    const totalPrice = selectedProduct.price * qty;
    
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
      });
    
    if (error) {
      Alert.alert('Error', 'Failed to place order');
    } else {
      Alert.alert('Success', 'Order placed successfully!');
      setShowOrderModal(false);
      setQuantity('1');
      if (userId) loadOrders(userId);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyCare+</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* HIV Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>HIV Prevention</Text>
        <Text style={styles.infoText}>Use condoms correctly every time</Text>
        <Text style={styles.infoText}>Get tested every 3 months</Text>
        <Text style={styles.infoText}>PrEP is available at RBC centers</Text>
        <TouchableOpacity style={styles.callButton}>
          <Text style={styles.callButtonText}>Call 114 for HIV Testing Info</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar - Blue theme */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shop' && styles.activeTab]}
          onPress={() => setActiveTab('shop')}
        >
          <Text style={styles.tabText}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={styles.tabText}>Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <View>
          <Text style={styles.sectionTitle}>Products for Men</Text>
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
                  setSelectedProduct(product);
                  setShowOrderModal(true);
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

      {/* Order Modal - Blue theme */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#2196f3',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  callButton: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2196f3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  orderButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalProduct: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalPrice: {
    fontSize: 14,
    color: '#2196f3',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#666',
  },
});