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
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { loadPeriodDates, savePeriodDates, addPeriodDate, removePeriodDate } from '../utils/periodStorage';

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

export default function GirlDashboard({ onLogout }: { onLogout: () => void }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [periodDates, setPeriodDates] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'calendar' | 'orders'>('shop');
  const [markedDates, setMarkedDates] = useState({});
  const [editDate, setEditDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [nextPeriodDate, setNextPeriodDate] = useState<string | null>(null);
  const [daysUntilNextPeriod, setDaysUntilNextPeriod] = useState<number | null>(null);
  const [cyclePhase, setCyclePhase] = useState<string>('');
  const [predictionMessage, setPredictionMessage] = useState<string>('');

  useEffect(() => {
    getUserId();
  }, []);

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadData();
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

  const loadData = async () => {
    const dates = await loadPeriodDates();
    setPeriodDates(dates);
    calculatePrediction(dates);
    updateCalendarMarks(dates);
    updateCyclePhase(dates);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .contains('visible_to', ['girl'])
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

  const calculatePrediction = (dates: string[]) => {
    if (dates.length < 2) {
      setNextPeriodDate(null);
      setDaysUntilNextPeriod(null);
      setPredictionMessage('Log 2 periods to see predictions');
      return;
    }
    
    const lengths: number[] = [];
    for (let i = 0; i < Math.min(dates.length - 1, 4); i++) {
      const start1 = parseISO(dates[i]);
      const start2 = parseISO(dates[i + 1]);
      const days = Math.abs(Math.floor((start1.getTime() - start2.getTime()) / (1000 * 60 * 60 * 24)));
      if (days >= 21 && days <= 40) lengths.push(days);
    }
    
    const avgCycle = lengths.length > 0 
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 28;
      
    const lastStart = parseISO(dates[0]);
    const nextPeriod = new Date(lastStart);
    nextPeriod.setDate(lastStart.getDate() + avgCycle);
    
    const today = new Date();
    const daysUntil = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    setDaysUntilNextPeriod(daysUntil);
    setNextPeriodDate(format(nextPeriod, 'yyyy-MM-dd'));
    
    if (daysUntil <= 0) {
      setPredictionMessage('Your period may be late. Update your log.');
    } else if (daysUntil <= 3) {
      setPredictionMessage(`Your period is expected very soon! In ${daysUntil} days.`);
      Alert.alert('Period Coming Soon', `Your period is expected in ${daysUntil} days. Check the shop for supplies!`);
    } else {
      setPredictionMessage(`Next period expected in ${daysUntil} days (around ${format(nextPeriod, 'MMM dd')})`);
    }
  };

  const updateCyclePhase = (dates: string[]) => {
    if (dates.length === 0) {
      setCyclePhase('Log your first period');
      return;
    }
    
    const lastStart = parseISO(dates[0]);
    const today = new Date();
    const daysSinceLast = differenceInDays(today, lastStart);
    const cycleDay = daysSinceLast + 1;
    
    if (cycleDay <= 5) setCyclePhase('Menstrual Phase');
    else if (cycleDay <= 13) setCyclePhase('Follicular Phase');
    else if (cycleDay <= 16) setCyclePhase('Ovulation Phase');
    else setCyclePhase('Luteal Phase');
  };

  const updateCalendarMarks = (dates: string[]) => {
    const marks: any = {};
    
    // Mark period start dates
    dates.forEach(date => {
      marks[date] = {
        selected: true,
        selectedColor: '#e91e63',
        selectedTextColor: 'white',
      };
    });
    
    // Mark prediction window
    if (nextPeriodDate && daysUntilNextPeriod && daysUntilNextPeriod <= 14 && daysUntilNextPeriod > -5) {
      const predDate = parseISO(nextPeriodDate);
      const startDate = addDays(predDate, -2);
      const endDate = addDays(predDate, 2);
      let current = startDate;
      
      while (current <= endDate) {
        const dateStr = format(current, 'yyyy-MM-dd');
        if (!marks[dateStr]) {
          marks[dateStr] = {
            color: '#fce4ec',
            textColor: '#e91e63',
          };
        } else {
          marks[dateStr] = {
            ...marks[dateStr],
            color: '#fce4ec',
          };
        }
        current = addDays(current, 1);
      }
    }
    
    setMarkedDates(marks);
  };

  const handleLogPeriod = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const existingToday = periodDates.some(date => date === today);
    
    if (existingToday) {
      Alert.alert('Already Logged', 'Period already logged for today. Replace?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          onPress: async () => {
            await removePeriodDate(today);
            const newDates = await addPeriodDate(today);
            setPeriodDates(newDates);
            calculatePrediction(newDates);
            updateCalendarMarks(newDates);
            updateCyclePhase(newDates);
            Alert.alert('Success', 'Period updated!');
          },
        },
      ]);
    } else {
      const newDates = await addPeriodDate(today);
      setPeriodDates(newDates);
      calculatePrediction(newDates);
      updateCalendarMarks(newDates);
      updateCyclePhase(newDates);
      Alert.alert('Success', 'Period logged!');
    }
  };

  const handleEditDate = async () => {
    if (!editDate || !newDate) {
      Alert.alert('Error', 'Please enter both dates');
      return;
    }
    
    const index = periodDates.indexOf(editDate);
    if (index !== -1) {
      const updatedDates = [...periodDates];
      updatedDates[index] = newDate;
      updatedDates.sort().reverse();
      await savePeriodDates(updatedDates);
      setPeriodDates(updatedDates);
      calculatePrediction(updatedDates);
      updateCalendarMarks(updatedDates);
      updateCyclePhase(updatedDates);
      setShowEditModal(false);
      setEditDate('');
      setNewDate('');
      Alert.alert('Success', 'Date updated!');
    } else {
      Alert.alert('Error', 'Date not found');
    }
  };

  const handleDeleteDate = async (date: string) => {
    Alert.alert('Confirm Delete', `Delete period on ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newDates = await removePeriodDate(date);
          setPeriodDates(newDates);
          calculatePrediction(newDates);
          updateCalendarMarks(newDates);
          updateCyclePhase(newDates);
          Alert.alert('Success', 'Period deleted');
        },
      },
    ]);
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

  const onDayPress = (day: DateData) => {
    setEditDate(day.dateString);
    setNewDate(day.dateString);
    setShowEditModal(true);
  };

  const getRecommendedProducts = () => {
    return products.filter(p => ['pads', 'pain', 'hygiene'].includes(p.category));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyCare+</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Prediction Summary Card - Shows on all tabs */}
      {nextPeriodDate && daysUntilNextPeriod !== null && daysUntilNextPeriod > 0 && (
        <View style={styles.predictionSummaryCard}>
          <Text style={styles.predictionSummaryText}>{predictionMessage}</Text>
          {daysUntilNextPeriod <= 5 && (
            <TouchableOpacity 
              style={styles.shopNowButton}
              onPress={() => setActiveTab('shop')}
            >
              <Text style={styles.shopNowText}>Shop for Supplies</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tab Bar - Shop first */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shop' && styles.activeTab]}
          onPress={() => setActiveTab('shop')}
        >
          <Text style={styles.tabText}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={styles.tabText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={styles.tabText}>Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Shop Tab - DEFAULT / FIRST TAB */}
      {activeTab === 'shop' && (
        <View>
          {/* Recommendation Section - Shows when period is near */}
          {daysUntilNextPeriod !== null && daysUntilNextPeriod <= 7 && daysUntilNextPeriod > 0 && (
            <View style={styles.recommendationCard}>
              <Text style={styles.recommendationTitle}>Recommended for You</Text>
              <Text style={styles.recommendationText}>
                Your period is expected in {daysUntilNextPeriod} days.
              </Text>
              <View style={styles.recommendationProducts}>
                {getRecommendedProducts().slice(0, 3).map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.recommendProductButton}
                    onPress={() => {
                      setSelectedProduct(product);
                      setShowOrderModal(true);
                    }}
                  >
                    <Text style={styles.recommendProductText}>{product.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>All Products</Text>
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

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <View>
          {/* Current Cycle Info */}
          <View style={styles.cycleInfoCard}>
            <Text style={styles.cyclePhaseText}>{cyclePhase}</Text>
            {nextPeriodDate && daysUntilNextPeriod !== null && daysUntilNextPeriod > 0 && (
              <Text style={styles.nextPeriodText}>
                Next period: {nextPeriodDate} (in {daysUntilNextPeriod} days)
              </Text>
            )}
            {!nextPeriodDate && (
              <Text style={styles.nextPeriodText}>Log your periods to see predictions</Text>
            )}
          </View>

          <TouchableOpacity style={styles.logButton} onPress={handleLogPeriod}>
            <Text style={styles.logButtonText}>Period Started Today</Text>
          </TouchableOpacity>

          <Calendar
            markedDates={markedDates}
            onDayPress={onDayPress}
            markingType="period"
            theme={{
              todayTextColor: '#e91e63',
              selectedDayBackgroundColor: '#e91e63',
              arrowColor: '#e91e63',
            }}
          />

          <Text style={styles.calendarLegend}>
            Red = Period start | Pink = Prediction window
          </Text>

          {/* Period History List */}
          <Text style={styles.sectionTitle}>Period History</Text>
          {periodDates.length === 0 ? (
            <Text style={styles.emptyText}>No periods logged yet</Text>
          ) : (
            periodDates.map((date) => (
              <View key={date} style={styles.historyItem}>
                <Text style={styles.historyDate}>{date}</Text>
                <TouchableOpacity
                  style={styles.deleteHistoryButton}
                  onPress={() => handleDeleteDate(date)}
                >
                  <Text style={styles.deleteHistoryButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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

      {/* Edit Date Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Period Date</Text>
            
            <Text style={styles.modalLabel}>Current Date:</Text>
            <TextInput
              style={styles.input}
              value={editDate}
              onChangeText={setEditDate}
              placeholder="YYYY-MM-DD"
            />
            
            <Text style={styles.modalLabel}>New Date:</Text>
            <TextInput
              style={styles.input}
              value={newDate}
              onChangeText={setNewDate}
              placeholder="YYYY-MM-DD"
            />
            
            <TouchableOpacity style={styles.saveButton} onPress={handleEditDate}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Order Modal */}
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
    color: '#e91e63',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#e91e63',
    fontSize: 14,
  },
  predictionSummaryCard: {
    backgroundColor: '#e91e63',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionSummaryText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  shopNowButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  shopNowText: {
    color: '#e91e63',
    fontSize: 12,
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
    backgroundColor: '#e91e63',
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
    color: '#e91e63',
  },
  orderButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  recommendationCard: {
    backgroundColor: '#fce4ec',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e91e63',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  recommendationProducts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recommendProductButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e91e63',
  },
  recommendProductText: {
    color: '#e91e63',
    fontSize: 12,
  },
  cycleInfoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  cyclePhaseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 8,
  },
  nextPeriodText: {
    fontSize: 14,
    color: '#666',
  },
  logButton: {
    backgroundColor: '#e91e63',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
  },
  logButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  calendarLegend: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 16,
  },
  deleteHistoryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteHistoryButtonText: {
    color: '#fff',
    fontSize: 12,
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
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  modalProduct: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalPrice: {
    fontSize: 14,
    color: '#e91e63',
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
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
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
  confirmButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});