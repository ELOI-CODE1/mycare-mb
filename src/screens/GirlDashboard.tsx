import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { loadPeriodDates, addPeriodDate, removePeriodDate } from '../utils/periodStorage';
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

const ACCENT = roleColors.girl.accent;
const SOFT = roleColors.girl.soft;

export default function GirlDashboard() {
  const { checkoutCount } = useCart();
  const { profile } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [periodDates, setPeriodDates] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'cycle' | 'orders'>('shop');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [nextPeriodDate, setNextPeriodDate] = useState<string | null>(null);
  const [daysUntilNextPeriod, setDaysUntilNextPeriod] = useState<number | null>(null);
  const [cyclePhase, setCyclePhase] = useState<string>('Log your first period');
  const [predictionMessage, setPredictionMessage] = useState<string>('Log 2 periods to see predictions');

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
      await loadData();
      await loadProducts();
      await loadOrders(user.id);
    }
  };

  const loadData = async () => {
    const dates = await loadPeriodDates();
    setPeriodDates(dates);
    calculatePrediction(dates);
    updateCalendarMarks(dates);
    updateCyclePhase(dates);
  };

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').contains('visible_to', ['girl']).eq('is_available', true);
    if (data) setProducts(data);
  };

  const loadOrders = async (uid: string) => {
    const { data } = await supabase.from('orders').select('*, products(name)').eq('user_id', uid).order('created_at', { ascending: false });
    if (data) setOrders(data.map((o: any) => ({ ...o, product_name: o.products?.name || 'Unknown' })));
  };

  const calculatePrediction = (dates: string[]) => {
    if (dates.length < 2) {
      setPredictionMessage('Log 2 periods to see predictions');
      setDaysUntilNextPeriod(null);
      setNextPeriodDate(null);
      return;
    }
    const avgCycle = 28;
    const lastStart = parseISO(dates[0]);
    const nextPeriod = addDays(lastStart, avgCycle);
    const daysUntil = differenceInDays(nextPeriod, new Date());
    setDaysUntilNextPeriod(daysUntil);
    setNextPeriodDate(format(nextPeriod, 'yyyy-MM-dd'));
    setPredictionMessage(daysUntil <= 0 ? 'Your period is late — update your log.' : `Next period in ${daysUntil} days.`);
  };

  const updateCyclePhase = (dates: string[]) => {
    if (dates.length === 0) return setCyclePhase('Log your first period');
    const cycleDay = differenceInDays(new Date(), parseISO(dates[0])) + 1;
    if (cycleDay <= 5) setCyclePhase('Menstrual Phase');
    else if (cycleDay <= 13) setCyclePhase('Follicular Phase');
    else if (cycleDay <= 16) setCyclePhase('Ovulation Phase');
    else setCyclePhase('Luteal Phase');
  };

  const updateCalendarMarks = (dates: string[]) => {
    const marks: any = {};
    dates.forEach(d => marks[d] = { selected: true, selectedColor: ACCENT });
    setMarkedDates(marks);
  };

  const handleLogPeriod = async () => {
    const newDates = await addPeriodDate(format(new Date(), 'yyyy-MM-dd'));
    setPeriodDates(newDates);
    loadData();
    Alert.alert('Logged', 'Today has been added to your period log.');
  };

  const handleDayPress = (d: { dateString: string }) => {
    const date = d.dateString;
    if (periodDates.includes(date)) {
      Alert.alert('Period date', `Remove ${date} from your log?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => { const nd = await removePeriodDate(date); setPeriodDates(nd); loadData(); },
        },
      ]);
    } else {
      Alert.alert('Log period', `Log a period on ${date}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log',
          onPress: async () => { const nd = await addPeriodDate(date); setPeriodDates(nd); loadData(); },
        },
      ]);
    }
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
      <AppHeader role="girl" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="title">Hello, {firstName} </Text>
        <Text muted style={{ marginBottom: spacing.lg }}>Take care of yourself today.</Text>

        <Segmented
          accent={ACCENT}
          value={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          tabs={[{ key: 'shop', label: 'Shop' }, { key: 'cycle', label: 'Cycle' }, { key: 'orders', label: 'Orders' }]}
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

        {activeTab === 'cycle' && (
          <View>
            <Card style={[styles.hero, { backgroundColor: SOFT }]}>
              <Text variant="caption" color={ACCENT} style={styles.heroLabel}>CURRENT PHASE</Text>
              <Text variant="title" color={ACCENT}>{cyclePhase}</Text>
              {daysUntilNextPeriod != null && nextPeriodDate ? (
                <View style={styles.heroRow}>
                  <View>
                    <Text variant="caption" muted>Next period</Text>
                    <Text variant="heading">{format(parseISO(nextPeriodDate), 'MMM d')}</Text>
                  </View>
                  <View>
                    <Text variant="caption" muted>Countdown</Text>
                    <Text variant="heading">{Math.max(0, daysUntilNextPeriod)} days</Text>
                  </View>
                </View>
              ) : (
                <Text muted style={{ marginTop: spacing.sm }}>{predictionMessage}</Text>
              )}
            </Card>

            <Button title="Log Today's Period" accent={ACCENT} onPress={handleLogPeriod} style={{ marginBottom: spacing.lg }} />

            <Card padded={false} style={{ overflow: 'hidden' }}>
              <Calendar
                markedDates={markedDates}
                onDayPress={handleDayPress}
                theme={{
                  todayTextColor: ACCENT,
                  arrowColor: ACCENT,
                  selectedDayBackgroundColor: ACCENT,
                }}
              />
            </Card>
            <Text variant="caption" muted center style={{ marginTop: spacing.sm }}>
              Tap a date to log or remove a period.
            </Text>
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
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
});
