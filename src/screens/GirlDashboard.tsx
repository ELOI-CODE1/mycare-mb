import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { loadPeriodDates, savePeriodDates, addPeriodDate, removePeriodDate } from '../utils/periodStorage';
import OrderModal from '../components/OrderModal';
import AppHeader from '../components/AppHeader';

type Product = { id: number; name: string; description: string; price: number; category: string; };
type Order = { id: number; product_id: number; product_name: string; quantity: number; total_price: number; status: string; created_at: string; };

export default function GirlDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [periodDates, setPeriodDates] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'calendar' | 'orders'>('shop');
  const [markedDates, setMarkedDates] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const [nextPeriodDate, setNextPeriodDate] = useState<string | null>(null);
  const [daysUntilNextPeriod, setDaysUntilNextPeriod] = useState<number | null>(null);
  const [cyclePhase, setCyclePhase] = useState<string>('');
  const [predictionMessage, setPredictionMessage] = useState<string>('');

  useEffect(() => {
    init();
  }, []);

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
    if (data) setOrders(data.map(o => ({ ...o, product_name: o.products?.name || 'Unknown' })));
  };

  const calculatePrediction = (dates: string[]) => {
    if (dates.length < 2) {
      setPredictionMessage('Log 2 periods to see predictions');
      return;
    }
    const avgCycle = 28;
    const lastStart = parseISO(dates[0]);
    const nextPeriod = addDays(lastStart, avgCycle);
    const daysUntil = differenceInDays(nextPeriod, new Date());
    setDaysUntilNextPeriod(daysUntil);
    setNextPeriodDate(format(nextPeriod, 'yyyy-MM-dd'));
    setPredictionMessage(daysUntil <= 0 ? 'Period late. Update log.' : `Next period in ${daysUntil} days.`);
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
    dates.forEach(d => marks[d] = { selected: true, selectedColor: '#e91e63' });
    setMarkedDates(marks);
  };

  const handleLogPeriod = async () => {
    const newDates = await addPeriodDate(format(new Date(), 'yyyy-MM-dd'));
    setPeriodDates(newDates);
    loadData();
    Alert.alert('Success', 'Period logged!');
  };

  const handleEditDate = async () => {
    const updated = periodDates.map(d => d === editDate ? newDate : d).sort().reverse();
    await savePeriodDates(updated);
    setPeriodDates(updated);
    loadData();
    setShowEditModal(false);
  };

  return (
    <View style={styles.root}>
      <AppHeader role="girl" />
      <ScrollView style={styles.container}>
      <View style={styles.tabBar}>
        {(['shop', 'calendar', 'orders'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={styles.tabText}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'shop' && products.map(p => (
        <View key={p.id} style={styles.card}>
          <View><Text style={styles.name}>{p.name}</Text><Text>{p.price} RWF</Text></View>
          <TouchableOpacity style={styles.orderButton} onPress={() => { setSelectedProduct(p); setIsModalVisible(true); }}>
            <Text style={styles.btnText}>Order</Text>
          </TouchableOpacity>
        </View>
      ))}

      {activeTab === 'calendar' && (
        <View>
          <Text style={styles.phase}>{cyclePhase}</Text>
          <TouchableOpacity style={styles.logButton} onPress={handleLogPeriod}><Text style={styles.btnText}>Log Period</Text></TouchableOpacity>
          <Calendar markedDates={markedDates} onDayPress={(d) => { setEditDate(d.dateString); setShowEditModal(true); }} />
        </View>
      )}

      {activeTab === 'orders' && orders.map(o => (
        <View key={o.id} style={styles.card}><Text>{o.product_name} - {o.status}</Text></View>
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
  tabBar: { flexDirection: 'row', marginBottom: 20 },
  tab: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#ddd' },
  activeTab: { backgroundColor: '#e91e63' },
  tabText: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: 'bold' },
  orderButton: { backgroundColor: '#e91e63', padding: 10, borderRadius: 8 },
  btnText: { color: '#fff' },
  phase: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  logButton: { backgroundColor: '#e91e63', padding: 15, borderRadius: 10, marginBottom: 10 }
});