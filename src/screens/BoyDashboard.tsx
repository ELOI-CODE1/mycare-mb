import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import AddToCartModal from '../components/AddToCartModal';
import AppHeader from '../components/AppHeader';
import ProductCard from '../components/ProductCard';
import OrderCard from '../components/OrderCard';
import { Text, Card, Button, Input, Segmented, EmptyState } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, roleColors } from '../theme';

type Product = { id: number; name: string; description: string; price: number; category: string; image_url?: string | null; };
type Order = { id: number; product_id: number; product_name: string; quantity: number; total_price: number; status: string; created_at: string; };

const ACCENT = roleColors.boy.accent;
const SOFT = roleColors.boy.soft;

export default function BoyDashboard() {
  const { checkoutCount } = useCart();
  const { profile } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'orders'>('shop');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

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
      await Promise.all([loadProducts(), loadOrders(user.id)]);
    }
  };

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').contains('visible_to', ['boy']).eq('is_available', true);
    if (data) setProducts(data);
  };

  const loadOrders = async (uid: string) => {
    const { data } = await supabase.from('orders').select('*, products(name)').eq('user_id', uid).order('created_at', { ascending: false });
    if (data) setOrders(data.map((o: any) => ({ ...o, product_name: o.products?.name || 'Unknown' })));
  };

  const openProduct = (p: Product) => { setSelectedProduct(p); setIsModalVisible(true); };

  const pq = productSearch.trim().toLowerCase();
  const filteredProducts = pq
    ? products.filter(p => p.name.toLowerCase().includes(pq) || (p.description || '').toLowerCase().includes(pq))
    : products;

  const oq = orderSearch.trim().toLowerCase();
  const filteredOrders = oq
    ? orders.filter(o => o.product_name.toLowerCase().includes(oq) || (o.status || '').toLowerCase().includes(oq))
    : orders;

  return (
    <View style={styles.root}>
      <AppHeader role="boy" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={[styles.headerCard, { backgroundColor: SOFT }]}> 
          <View style={styles.headerTopRow}>
            <View>
              <Text variant="caption" color={ACCENT} style={styles.heroLabel}>Dashboard</Text>
              <Text variant="heading">Wellness essentials</Text>
            </View>
            <View style={styles.statusChip}>
              <Text variant="caption" color={ACCENT}>Ready</Text>
            </View>
          </View>
          <View style={styles.headerInfoRow}>
            <View style={styles.infoCard}>
              <Text variant="caption" muted>Items in cart</Text>
              <Text variant="heading">{checkoutCount}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text variant="caption" muted>Recent orders</Text>
              <Text variant="heading">{orders.length}</Text>
            </View>
          </View>
          <Text muted style={{ marginTop: spacing.sm, lineHeight: 22 }}>
            Browse trusted items and manage your orders from one clear dashboard.
          </Text>
        </Card>

        <Card style={[styles.hero, { backgroundColor: SOFT }]}> 
          <View style={styles.heroTopRow}>
            <Text variant="caption" color={ACCENT} style={styles.heroLabel}>Top picks</Text>
            <Text variant="caption" muted>Built for your needs</Text>
          </View>
          <Text variant="title" color={ACCENT}>Shop essentials</Text>
          <Text muted style={{ marginTop: spacing.sm, lineHeight: 22 }}>
            Find quality wellness supplies, discreetly selected for you.
          </Text>
          <View style={styles.heroActions}>
            <Button title="Shop now" accent={ACCENT} onPress={() => setActiveTab('shop')} style={{ marginRight: spacing.sm, flex: 1 }} />
            <Button title="My orders" accent={ACCENT} variant="secondary" onPress={() => setActiveTab('orders')} style={{ flex: 1 }} />
          </View>
        </Card>

        <Segmented
          accent={ACCENT}
          value={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          tabs={[{ key: 'shop', label: 'Shop' }, { key: 'orders', label: 'Orders' }]}
        />

        {activeTab === 'shop' && (
          <View>
            {products.length > 0 && (
              <Input placeholder="Search products…" value={productSearch} onChangeText={setProductSearch} />
            )}
            {products.length === 0 ? (
              <EmptyState icon="bag-handle-outline" title="No products yet" subtitle="Check back soon." />
            ) : filteredProducts.length === 0 ? (
              <EmptyState icon="search-outline" title="No products match your search" />
            ) : (
              filteredProducts.map(p => (
                <ProductCard
                  key={p.id}
                  name={p.name}
                  price={p.price}
                  description={p.description}
                  category={p.category}
                  image={p.image_url}
                  accent={ACCENT}
                  soft={SOFT}
                  onAdd={() => openProduct(p)}
                  onPress={() => openProduct(p)}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'orders' && (
          <View>
            {orders.length > 0 && (
              <Input placeholder="Search orders by product or status…" value={orderSearch} onChangeText={setOrderSearch} />
            )}
            {orders.length === 0 ? (
              <EmptyState icon="receipt-outline" title="No orders yet" subtitle="Your orders will appear here." />
            ) : filteredOrders.length === 0 ? (
              <EmptyState icon="search-outline" title="No orders match your search" />
            ) : (
              filteredOrders.map(o => (
                <OrderCard
                  key={o.id}
                  productName={o.product_name}
                  quantity={o.quantity}
                  total={o.total_price}
                  status={o.status}
                  date={o.created_at}
                />
              ))
            )}
          </View>
        )}

        <AddToCartModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
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
  hero: { marginBottom: spacing.lg },
  heroLabel: { letterSpacing: 1, marginBottom: 2 },
  heroTopRow: { alignItems: 'flex-start', marginBottom: spacing.sm },
  headerCard: { padding: spacing.md, borderRadius: 24, marginBottom: spacing.lg, shadowColor: colors.black, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusChip: { backgroundColor: colors.surface, borderRadius: 999, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  headerInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  infoCard: { flex: 1, backgroundColor: colors.background, borderRadius: 18, padding: spacing.md, minHeight: 90, justifyContent: 'space-between' },
  heroActions: { flexDirection: 'row', marginTop: spacing.lg },
});
