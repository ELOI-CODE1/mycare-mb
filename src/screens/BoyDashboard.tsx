import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import OrderModal from '../components/OrderModal'; // Shared component
import AppHeader from '../components/AppHeader';

type Product = { id: number; name: string; description: string; price: number; category: string; };
type Order = { id: number; product_id: number; product_name: string; quantity: number; total_price: number; status: string; created_at: string; };

export default function BoyDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'orders'>('shop');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await Promise.all([loadProducts(), loadOrders(user.id)]);
    }
  };

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').contains('visible_to', ['boy']).eq('is_available', true);
    if (data) setProducts(data);
  };

  const loadOrders = async (uid: string) => {
    const { data } = await supabase.from('orders').select('*, products(name)').eq('user_id', uid).order('created_at', { ascending: false });
    if (data) setOrders(data.map(o => ({ ...o, product_name: o.products?.name || 'Unknown' })));
  };

  return (
    <View style={styles.root}>
      <AppHeader role="boy" />
      <ScrollView style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>HIV Prevention</Text>
        <Text style={styles.infoText}>Use condoms correctly every time</Text>
        <Text style={styles.infoText}>Get tested every 3 months</Text>
        <TouchableOpacity style={styles.callButton}><Text style={styles.callButtonText}>Call 114</Text></TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {(['shop', 'orders'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={styles.tabText}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'shop' && products.map(p => (
        <View key={p.id} style={styles.productCard}>
          <View style={{flex: 1}}>
            <Text style={styles.productName}>{p.name}</Text>
            <Text style={styles.productPrice}>{p.price.toLocaleString()} RWF</Text>
          </View>
          <TouchableOpacity style={styles.orderButton} onPress={() => { setSelectedProduct(p); setIsModalVisible(true); }}>
            <Text style={styles.orderButtonText}>Order</Text>
          </TouchableOpacity>
        </View>
      ))}

      {activeTab === 'orders' && orders.map(o => (
        <View key={o.id} style={styles.orderCard}>
          <Text style={styles.orderProduct}>{o.product_name}</Text>
          <Text>Status: {o.status}</Text>
        </View>
      ))}

      <OrderModal 
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        product={selectedProduct}
        userId={userId}
        onOrderSuccess={() => { if (userId) loadOrders(userId); }}
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  infoCard: { backgroundColor: '#e3f2fd', padding: 15, borderRadius: 12, marginBottom: 20 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#2196f3' },
  infoText: { fontSize: 14, color: '#333' },
  callButton: { backgroundColor: '#2196f3', padding: 10, borderRadius: 8, marginTop: 10 },
  callButtonText: { color: '#fff', textAlign: 'center' },
  tabBar: { flexDirection: 'row', marginBottom: 20 },
  tab: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#ddd' },
  activeTab: { backgroundColor: '#2196f3' },
  tabText: { color: '#fff' },
  productCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  productName: { fontWeight: 'bold' },
  productPrice: { color: '#2196f3' },
  orderButton: { backgroundColor: '#2196f3', padding: 10, borderRadius: 8 },
  orderButtonText: { color: '#fff' },
  orderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  orderProduct: { fontWeight: 'bold' }
});