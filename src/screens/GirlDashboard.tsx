import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
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
type PhaseKey = 'menstruation' | 'follicular' | 'ovulation' | 'luteal';

type PhaseDetails = {
  key: PhaseKey;
  title: string;
  duration: string;
  description: string;
  tips: string[];
};

const ACCENT = roleColors.girl.accent;
const SOFT = roleColors.girl.soft;

const phaseDetails: PhaseDetails[] = [
  {
    key: 'menstruation',
    title: 'Menstruation',
    duration: 'Days 1–5',
    description: 'Your body is shedding the uterine lining, so rest and comfort matter most.',
    tips: ['Hydrate well', 'Use heat for cramps', 'Keep your routine gentle'],
  },
  {
    key: 'follicular',
    title: 'Follicular',
    duration: 'Days 1–13',
    description: 'Energy often rises and your skin may feel fresher as estrogen builds.',
    tips: ['Try light movement', 'Focus on protein and sleep', 'Keep skincare simple'],
  },
  {
    key: 'ovulation',
    title: 'Ovulation',
    duration: 'Day 14 ±2',
    description: 'This is the most fertile window, and some people notice clearer energy or mild spotting.',
    tips: ['Track signs calmly', 'Avoid overthinking symptoms', 'Stay hydrated'],
  },
  {
    key: 'luteal',
    title: 'Luteal',
    duration: 'Days 15–28',
    description: 'Hormones shift and PMS symptoms can show up in mood, appetite, or sleep.',
    tips: ['Keep a steady routine', 'Reduce stress where you can', 'Have comfort snacks ready'],
  },
];

const symptomOptions = ['Cramps', 'Fatigue', 'Mood', 'Headache'];
const flowOptions = ['Light', 'Medium', 'Heavy'] as const;

export default function GirlDashboard() {
  const { checkoutCount } = useCart();
  const { profile } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [periodDates, setPeriodDates] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'shop' | 'orders'>('health');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [nextPeriodDate, setNextPeriodDate] = useState<string | null>(null);
  const [daysUntilNextPeriod, setDaysUntilNextPeriod] = useState<number | null>(null);
  const [cyclePhase, setCyclePhase] = useState<string>('Log your first period');
  const [predictionMessage, setPredictionMessage] = useState<string>('Log 2 periods to see predictions');
  const [expandedPhase, setExpandedPhase] = useState<PhaseKey>('menstruation');
  const [selectedFlow, setSelectedFlow] = useState<(typeof flowOptions)[number]>('Medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Cramps']);
  const [showPregnancy, setShowPregnancy] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    init();
  }, []);

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

  const handleQuickLog = () => {
    Alert.alert('Saved', `Flow: ${selectedFlow}. Symptoms: ${selectedSymptoms.join(', ') || 'none'}.`);
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(item => item !== symptom) : [...prev, symptom],
    );
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
        <Text variant="title">Hello, {firstName}</Text>
        <Text muted style={{ marginBottom: spacing.lg }}>
          Your body, your pace — here is a calm, private space to learn and track.
        </Text>

        <Segmented
          accent={ACCENT}
          value={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          tabs={[{ key: 'health', label: 'Health' }, { key: 'shop', label: 'Shop' }, { key: 'orders', label: 'Orders' }]}
        />

        {activeTab === 'health' && (
          <View>
            <Card style={[styles.hero, { backgroundColor: SOFT }]}>
              <View style={styles.heroTopRow}>
                <View style={styles.badge}>
                  <Text variant="caption" color={ACCENT}>🔒 Confidential & Secure</Text>
                </View>
              </View>
              <Text variant="caption" color={ACCENT} style={styles.heroLabel}>CURRENT PHASE</Text>
              <Text variant="title" color={ACCENT}>{cyclePhase}</Text>
              <Text muted style={{ marginTop: spacing.sm }}>
                Day {Math.max(1, differenceInDays(new Date(), parseISO(periodDates[0] || format(new Date(), 'yyyy-MM-dd'))) + 1)} of your cycle
              </Text>
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
              <View style={styles.heroActions}>
                <Button title="Log Cycle" accent={ACCENT} onPress={handleLogPeriod} style={{ marginRight: spacing.sm, flex: 1 }} />
                <Button title="View Shop" accent={ACCENT} variant="secondary" onPress={() => setActiveTab('shop')} style={{ flex: 1 }} />
              </View>
            </Card>

            <Card>
              <Text variant="heading">How your body is feeling today</Text>
              <Text muted style={{ marginTop: spacing.xs }}>
                Learn the phase you’re in and get supportive reminders that feel gentle, not overwhelming.
              </Text>
              <View style={{ marginTop: spacing.md }}>
                {phaseDetails.map(phase => {
                  const isOpen = expandedPhase === phase.key;
                  return (
                    <View key={phase.key} style={styles.phaseCard}>
                      <TouchableOpacity activeOpacity={0.8} onPress={() => setExpandedPhase(isOpen ? 'menstruation' : phase.key)}>
                        <View style={styles.phaseHeader}>
                          <View>
                            <Text variant="label">{phase.title}</Text>
                            <Text variant="caption" muted>{phase.duration}</Text>
                          </View>
                          <Text variant="heading" color={ACCENT}>{isOpen ? '−' : '+'}</Text>
                        </View>
                      </TouchableOpacity>
                      {isOpen && (
                        <View style={styles.phaseBody}>
                          <Text muted>{phase.description}</Text>
                          <View style={styles.tipList}>
                            {phase.tips.map(tip => (
                              <View key={tip} style={styles.tipPill}>
                                <Text variant="caption">• {tip}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </Card>

            <Card>
              <Text variant="heading">Cycle calendar</Text>
              <Text muted style={{ marginTop: spacing.xs }}>
                Tap a date to log or remove a period. Your calendar will keep the pattern visible and private.
              </Text>
              <View style={{ marginTop: spacing.md, overflow: 'hidden', borderRadius: 16 }}>
                <Calendar
                  markedDates={markedDates}
                  onDayPress={handleDayPress}
                  theme={{
                    todayTextColor: ACCENT,
                    arrowColor: ACCENT,
                    selectedDayBackgroundColor: ACCENT,
                    textSectionTitleColor: colors.gray700,
                    monthTextColor: colors.text,
                  }}
                />
              </View>
            </Card>

            <Card>
              <Text variant="heading">Quick log</Text>
              <Text muted style={{ marginTop: spacing.xs }}>
                Add a few details for your own notes without pressure.
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <Text variant="label">Flow</Text>
                <View style={styles.optionRow}>
                  {flowOptions.map(option => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setSelectedFlow(option)}
                      style={[styles.optionChip, selectedFlow === option && styles.optionChipActive]}
                    >
                      <Text color={selectedFlow === option ? colors.textInverse : colors.text}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text variant="label" style={{ marginTop: spacing.md }}>Symptoms</Text>
                <View style={styles.optionRow}>
                  {symptomOptions.map(option => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => toggleSymptom(option)}
                      style={[styles.optionChip, selectedSymptoms.includes(option) && styles.optionChipActive]}
                    >
                      <Text color={selectedSymptoms.includes(option) ? colors.textInverse : colors.text}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button title="Save quick log" accent={ACCENT} onPress={handleQuickLog} style={{ marginTop: spacing.lg }} />
              </View>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text variant="heading">Pregnancy & milestones</Text>
                <TouchableOpacity onPress={() => setShowPregnancy(prev => !prev)}>
                  <Text color={ACCENT}>{showPregnancy ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              {showPregnancy && (
                <View style={{ marginTop: spacing.md }}>
                  <Text muted>
                    This space can later hold prenatal reminders, medical appointments, and supportive milestones.
                  </Text>
                </View>
              )}
            </Card>

            <Card>
              <Text variant="heading">Support & resources</Text>
              <View style={{ marginTop: spacing.md }}>
                {[
                  { title: 'Confidential supplies', subtitle: 'Order wellness items privately from the shop.' },
                  { title: 'Expert advice', subtitle: 'Read gentle guidance and trusted tips.' },
                  { title: 'Need help now?', subtitle: 'Browse support options and helplines.' },
                ].map(item => (
                  <TouchableOpacity key={item.title} activeOpacity={0.8} style={styles.resourceItem}>
                    <View>
                      <Text variant="label">{item.title}</Text>
                      <Text variant="caption" muted>{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          </View>
        )}

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
  badge: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  heroActions: { flexDirection: 'row', marginTop: spacing.lg },
  phaseCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, marginTop: spacing.sm, backgroundColor: colors.surface },
  phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phaseBody: { marginTop: spacing.sm },
  tipList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: spacing.sm },
  tipPill: { backgroundColor: colors.gray100, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.sm, marginBottom: spacing.sm },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  optionChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, marginBottom: spacing.sm },
  optionChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resourceItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
});
