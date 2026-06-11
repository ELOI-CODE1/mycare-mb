import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  product: { id: number; name: string; price: number } | null;
  userId: string | null;
  onOrderSuccess: () => void;
}

export default function OrderModal({ visible, onClose, product, userId, onOrderSuccess }: OrderModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [address, setAddress] = useState('');

  const handleOrder = async () => {
    if (!product || !userId) return;

    const qty = parseInt(quantity);
    const { error } = await supabase.from('orders').insert({
      user_id: userId,
      product_id: product.id,
      quantity: qty,
      total_price: product.price * qty,
      delivery_address: address,
      status: 'pending'
    });

    if (error) {
      Alert.alert('Error', 'Failed to place order');
    } else {
      Alert.alert('Success', 'Order placed!');
      onOrderSuccess();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Order {product?.name}</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Quantity" 
            keyboardType="numeric" 
            value={quantity} 
            onChangeText={setQuantity} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Delivery Address" 
            value={address} 
            onChangeText={setAddress} 
          />
          <TouchableOpacity style={styles.button} onPress={handleOrder}>
            <Text style={styles.btnText}>Confirm Order</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancel}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '90%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
  button: { backgroundColor: '#2196f3', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  cancel: { marginTop: 10, alignItems: 'center' }
});