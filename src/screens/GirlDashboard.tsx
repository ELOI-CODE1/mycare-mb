import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, parse, parseISO, differenceInDays, addDays } from 'date-fns';
import { PieChart } from 'react-native-chart-kit';
import { supabase } from '../lib/supabase';
import { loadPeriodDates, addPeriodDate, removePeriodDate } from '../utils/periodStorage';
import AddToCartModal from '../components/AddToCartModal';
import AppHeader from '../components/AppHeader';
import ProductCard from '../components/ProductCard';
import OrderCard from '../components/OrderCard';
import { Text, Card, Button, Input, Segmented, EmptyState } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, roleColors } from '../theme';

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
const chartWidth = Dimensions.get('window').width - spacing.lg * 2;
const pieChartData = [
  { name: 'Menstruation', population: 5, color: '#e91e63', legendFontColor: colors.gray700, legendFontSize: 12 },
  { name: 'Follicular', population: 8, color: '#f48fb1', legendFontColor: colors.gray700, legendFontSize: 12 },
  { name: 'Ovulation', population: 2, color: '#f06292', legendFontColor: colors.gray700, legendFontSize: 12 },
  { name: 'Luteal', population: 13, color: '#f8bbd0', legendFontColor: colors.gray700, legendFontSize: 12 },
];
const pieChartConfig = {
  backgroundGradientFrom: 'transparent',
  backgroundGradientTo: 'transparent',
  color: (opacity = 1) => `rgba(34, 34, 34, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(68, 68, 68, ${opacity})`,
};

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
  const [firstDayLastPeriod, setFirstDayLastPeriod] = useState('');
  const [lastDayLastPeriod, setLastDayLastPeriod] = useState('');
  const [averageCycleLength, setAverageCycleLength] = useState('28');
  const [periodDuration, setPeriodDuration] = useState('5');
  const [pregnancyLMP, setPregnancyLMP] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [pregnancyMessage, setPregnancyMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<'first' | 'last' | 'pregnancy' | null>(null);
  const [tempSelectedDate, setTempSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const firstName = profile?.full_name?.split(' ')[0] ?? '';
  const greeting = firstName ? `Hello ${firstName}` : 'Hello';

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

  const handleSaveCycle = async () => {
    if (!firstDayLastPeriod) {
      Alert.alert('Missing information', 'Please enter the first day of your last period.');
      return;
    }

    const parsedDate = parse(firstDayLastPeriod, 'MM/dd/yyyy', new Date());
    if (isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid date', 'Please use the format MM/DD/YYYY for the first day.');
      return;
    }

    const newDates = await addPeriodDate(format(parsedDate, 'yyyy-MM-dd'));
    setPeriodDates(newDates);
    await loadData();
    setSaveMessage('Datos de ciclo guardados. Predicciones actualizadas.');
  };

  const handleConfirmDatePicker = () => {
    if (!datePickerField) return;
    const selectedDate = parseISO(tempSelectedDate);
    if (isNaN(selectedDate.getTime())) {
      Alert.alert('Fecha inválida', 'No se pudo leer la fecha seleccionada.');
      return;
    }
    const formattedValue = format(selectedDate, 'MM/dd/yyyy');
    if (datePickerField === 'first') setFirstDayLastPeriod(formattedValue);
    if (datePickerField === 'last') setLastDayLastPeriod(formattedValue);
    if (datePickerField === 'pregnancy') setPregnancyLMP(formattedValue);
    setShowDatePicker(false);
  };

  const handleTrackPregnancy = () => {
    if (!pregnancyLMP) {
      Alert.alert('Falta información', 'Por favor ingresa el primer día de tu última menstruación.');
      return;
    }

    const parsedDate = parse(pregnancyLMP, 'MM/dd/yyyy', new Date());
    if (isNaN(parsedDate.getTime())) {
      Alert.alert('Fecha inválida', 'Por favor utiliza el formato MM/DD/YYYY.');
      return;
    }

    setPregnancyMessage(`LMP registrada: ${format(parsedDate, 'MMM d, yyyy')}. Mantendremos los hitos listos.`);
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
        <Text variant="title">{greeting}</Text>
        <Text muted style={{ marginBottom: spacing.lg }}>
          Tu cuerpo, tu ritmo — un espacio privado para monitorear tu ciclo.
        </Text>

        <Card style={[styles.pieCard, { backgroundColor: SOFT }]}> 
          <Text variant="caption" color={ACCENT} style={styles.heroLabel}>Distribución del ciclo</Text>
          <Text variant="heading" color={ACCENT}>Visualiza tu ciclo menstrual</Text>
          <Text muted style={{ marginTop: spacing.xs }}>Gráfico de fases de un ciclo típico de 28 días.</Text>
          <View style={styles.pieContainer}>
            <PieChart
              data={pieChartData}
              width={chartWidth}
              height={220}
              chartConfig={pieChartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </Card>

        <Segmented
          accent={ACCENT}
          value={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          tabs={[{ key: 'health', label: 'Salud' }, { key: 'shop', label: 'Tienda' }, { key: 'orders', label: 'Pedidos' }]}
        />

        {activeTab === 'health' && (
          <View>
            <View style={styles.statsRow}>
              <Card style={styles.statCard} padded={false}>
                <View style={styles.statContent}>
                  <Text variant="caption" muted>Fase actual</Text>
                  <Text variant="heading" color={ACCENT}>{cyclePhase}</Text>
                </View>
              </Card>
              <Card style={styles.statCard} padded={false}>
                <View style={styles.statContent}>
                  <Text variant="caption" muted>Ciclos registrados</Text>
                  <Text variant="heading">{periodDates.length}</Text>
                </View>
              </Card>
              <Card style={styles.statCard} padded={false}>
                <View style={styles.statContent}>
                  <Text variant="caption" muted>Artículos en carrito</Text>
                  <Text variant="heading">{checkoutCount}</Text>
                </View>
              </Card>
              <Card style={styles.statCard} padded={false}>
                <View style={styles.statContent}>
                  <Text variant="caption" muted>Disponible</Text>
                  <Text variant="heading">Ayuda experta</Text>
                </View>
              </Card>
            </View>

            <Card style={[styles.hero, { backgroundColor: SOFT }]}> 
              <Text variant="caption" color={ACCENT} style={styles.heroLabel}>TU CICLO HOY</Text>
              <Text variant="title" color={ACCENT}>{cyclePhase}</Text>
              <Text muted style={{ marginTop: spacing.sm, lineHeight: 22 }}>
                {predictionMessage}
              </Text>
              <View style={styles.heroRow}>
                <View>
                  <Text variant="caption" muted>Próximo periodo</Text>
                  <Text variant="heading">{nextPeriodDate ? format(parseISO(nextPeriodDate), 'MMM d') : 'TBD'}</Text>
                </View>
                <View>
                  <Text variant="caption" muted>Cuenta regresiva</Text>
                  <Text variant="heading">{daysUntilNextPeriod != null ? `${Math.max(0, daysUntilNextPeriod)} días` : '--'}</Text>
                </View>
              </View>
              <View style={styles.heroActions}>
                <Button title="Registrar ciclo" accent={ACCENT} onPress={handleLogPeriod} style={{ marginRight: spacing.sm, flex: 1 }} />
                <Button title="Ir a tienda" accent={ACCENT} variant="secondary" onPress={() => setActiveTab('shop')} style={{ flex: 1 }} />
              </View>
            </Card>

            <Card>
              <View style={styles.sectionHeader}>
                <Text variant="heading">Registrar nuevo ciclo</Text>
                <Text variant="caption" muted>Introduce las fechas para mejorar las predicciones.</Text>
              </View>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateInput}
                  activeOpacity={0.8}
                  onPress={() => {
                    setDatePickerField('first')
                    setTempSelectedDate(firstDayLastPeriod ? format(parse(firstDayLastPeriod, 'MM/dd/yyyy', new Date()), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
                    setShowDatePicker(true)
                  }}
                >
                  <Text variant="label">Primer día de la última menstruación</Text>
                  <Text>{firstDayLastPeriod || 'Selecciona fecha'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateInput}
                  activeOpacity={0.8}
                  onPress={() => {
                    setDatePickerField('last')
                    setTempSelectedDate(lastDayLastPeriod ? format(parse(lastDayLastPeriod, 'MM/dd/yyyy', new Date()), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
                    setShowDatePicker(true)
                  }}
                >
                  <Text variant="label">Último día de la menstruación</Text>
                  <Text>{lastDayLastPeriod || 'Selecciona fecha'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Input
                    label="Duración del ciclo (días)"
                    placeholder="28"
                    value={averageCycleLength}
                    keyboardType="numeric"
                    onChangeText={setAverageCycleLength}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Input
                    label="Duración del periodo (días)"
                    placeholder="5"
                    value={periodDuration}
                    keyboardType="numeric"
                    onChangeText={setPeriodDuration}
                  />
                </View>
              </View>
              <Button title="Guardar y calcular" accent={ACCENT} onPress={handleSaveCycle} style={{ marginTop: spacing.sm }} />
              {saveMessage ? <Text muted style={{ marginTop: spacing.sm }}>{saveMessage}</Text> : null}
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
              <Text variant="heading">Entiende tus fases</Text>
              <Text muted style={{ marginTop: spacing.xs }}>
                Aprender las cuatro fases y cómo pueden afectar tu energía, estado de ánimo y bienestar.
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
              <View style={styles.sectionHeader}>
                <Text variant="heading">Seguimiento del embarazo</Text>
                <Text variant="caption" muted>Hitos opcionales y recordatorios.</Text>
              </View>
              <TouchableOpacity
                style={styles.dateInput}
                activeOpacity={0.8}
                onPress={() => {
                  setDatePickerField('pregnancy')
                  setTempSelectedDate(pregnancyLMP ? format(parse(pregnancyLMP, 'MM/dd/yyyy', new Date()), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
                  setShowDatePicker(true)
                }}
              >
                <Text variant="label">Primer día de la última menstruación (LMP)</Text>
                <Text>{pregnancyLMP || 'Selecciona fecha'}</Text>
              </TouchableOpacity>
              <Button title="Seguir embarazo" accent={ACCENT} onPress={handleTrackPregnancy} style={{ marginTop: spacing.sm }} />
              {pregnancyMessage ? <Text muted style={{ marginTop: spacing.sm }}>{pregnancyMessage}</Text> : null}
            </Card>

            <Card>
              <Text variant="heading">Próximas alertas</Text>
              <Text muted style={{ marginTop: spacing.xs }}>
                Mantente a la par de tu ciclo con recordatorios y avisos útiles.
              </Text>
              <View style={{ marginTop: spacing.md }}>
                {[
                  'Cycle check-in tomorrow',
                  'Hydration reminder for your current phase',
                  'Order wellness essentials before next week',
                ].map(alert => (
                  <View key={alert} style={styles.alertItem}>
                    <Text variant="label">{alert}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <Card>
              <Text variant="heading">Apoyo y recursos</Text>
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

        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModal}>
              <Text variant="heading" style={styles.dateModalTitle}>
                {datePickerField === 'pregnancy' ? 'Selecciona la fecha de LMP' : 'Selecciona una fecha'}
              </Text>
              <Calendar
                current={tempSelectedDate}
                markedDates={{
                  ...markedDates,
                  [tempSelectedDate]: { selected: true, selectedColor: ACCENT },
                }}
                onDayPress={(day) => setTempSelectedDate(day.dateString)}
                theme={{
                  todayTextColor: ACCENT,
                  arrowColor: ACCENT,
                  selectedDayBackgroundColor: ACCENT,
                  monthTextColor: colors.text,
                  textSectionTitleColor: colors.gray700,
                }}
              />
              <View style={styles.modalActions}>
                <Button title="Cancelar" variant="secondary" onPress={() => setShowDatePicker(false)} style={{ flex: 1, marginRight: spacing.sm }} />
                <Button title="Guardar" accent={ACCENT} onPress={handleConfirmDatePicker} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>
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
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1, minWidth: 150, padding: spacing.md, backgroundColor: colors.surface },
  statContent: { justifyContent: 'space-between', minHeight: 80 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  dateInput: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md, minHeight: 90, justifyContent: 'space-between' },
  sectionHeader: { marginBottom: spacing.md },
  pieCard: { padding: spacing.md, borderRadius: 24, marginBottom: spacing.lg, shadowColor: colors.black, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
  pieContainer: { marginTop: spacing.md, alignItems: 'center' },
  dateModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: spacing.lg },
  dateModal: { backgroundColor: colors.background, borderRadius: 24, padding: spacing.lg, shadowColor: colors.black, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 },
  dateModalTitle: { marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', marginTop: spacing.lg },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  formHalf: { flex: 1 },
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
  alertItem: { backgroundColor: colors.gray100, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
});
