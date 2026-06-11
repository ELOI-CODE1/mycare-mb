import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import OrderModal from '../components/OrderModal';

export default function ParentDashboard({ onLogout }: { onLogout: () => void }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'children' | 'shop' | 'orders'>('shop');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadProducts();
      await loadOrders(user.id);
    }
  };

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('is_available', true);
    if (data) setProducts(data);
  };

  const loadOrders = async (uid: string) => {
    const { data } = await supabase.from('orders').select('*').eq('user_id', uid);
    if (data) setOrders(data);
  };

  // This function is the bridge that MUST be called
  const openOrderModal = (product: any) => {
    setSelectedProduct(product);
    setIsOrderModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Care</Text>
        <TouchableOpacity onPress={onLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>

      {/* Shop List */}
      {products.map((product) => (
        <View key={product.id} style={styles.card}>
          <View>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>{product.price.toLocaleString()} RWF</Text>
          </View>
          <TouchableOpacity 
            style={styles.orderButton} 
            onPress={() => openOrderModal(product)} // CALLING THE BRIDGE
          >
            <Text style={styles.btnText}>Order</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* MODAL IS PLACED HERE */}
      <OrderModal 
        visible={isOrderModalVisible}
        onClose={() => setIsOrderModalVisible(false)}
        product={selectedProduct}
        userId={userId}
        onOrderSuccess={() => {
          if (userId) loadOrders(userId);
          Alert.alert("Success", "Order confirmed!");
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#4caf50' },
  logoutText: { color: '#4caf50' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: 'bold', fontSize: 16 },
  price: { color: '#4caf50', marginTop: 5 },
  orderButton: { backgroundColor: '#4caf50', padding: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});