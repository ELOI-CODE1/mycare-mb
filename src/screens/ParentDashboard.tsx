import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import AddToCartModal from '../components/AddToCartModal';
import AppHeader from '../components/AppHeader';
import ProductCard from '../components/ProductCard';
import OrderCard from '../components/OrderCard';
import { Text, Segmented, EmptyState } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, roleColors } from '../theme';

type Product = { id: number; name: string; description: string; price: number; category: string; };
type Order = { id: number; product_name: string; quantity: number; total_price: number; status: string; created_at: string; };

const ACCENT = roleColors.parent.accent;
const SOFT = roleColors.parent.soft;

export default function ParentDashboard() {
  const { checkoutCount } = useCart();
  const { profile } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'orders'>('shop');

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    init();
  }, []);

  // Refresh orders after a successful cart checkout.
  useEffect(() => {
    if (userId) loadOrders(userId);
  }, [checkoutCount]);

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
    const { data } = await supabase
      .from('orders')
      .select('*, products(name)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (data) setOrders(data.map((o: any) => ({ ...o, product_name: o.products?.name || 'Unknown' })));
  };

  const openProduct = (p: Product) => { setSelectedProduct(p); setIsOrderModalVisible(true); };

  return (
    <View style={styles.root}>
      <AppHeader role="parent" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="title">Hello, {firstName} </Text>
        <Text muted style={{ marginBottom: spacing.lg }}>Care essentials for your whole family.</Text>

        <Segmented
          accent={ACCENT}
          value={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          tabs={[{ key: 'shop', label: 'Shop' }, { key: 'orders', label: 'Orders' }]}
        />

        {activeTab === 'shop' && (
          products.length === 0 ? (
            <EmptyState icon="bag-handle-outline" title="No products yet" subtitle="Check back soon." />
          ) : (
            products.map(p => (
              <ProductCard
                key={p.id}
                name={p.name}
                price={p.price}
                description={p.description}
                category={p.category}
                accent={ACCENT}
                soft={SOFT}
                onAdd={() => openProduct(p)}
              />
            ))
          )
        )}

        {activeTab === 'orders' && (
          orders.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No orders yet" subtitle="Your orders will appear here." />
          ) : (
            orders.map(o => (
              <OrderCard
                key={(o as any).id}
                productName={o.product_name}
                quantity={o.quantity}
                total={o.total_price}
                status={o.status}
                date={o.created_at}
              />
            ))
          )
        )}

        <AddToCartModal
          visible={isOrderModalVisible}
          onClose={() => setIsOrderModalVisible(false)}
          product={selectedProduct}
          accent={ACCENT}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
