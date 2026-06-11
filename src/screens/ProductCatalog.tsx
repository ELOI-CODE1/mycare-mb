import React, { useState } from 'react'
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, Modal, TextInput, ActivityIndicator 
} from 'react-native'
import * as Linking from 'expo-linking'
import { Product, getProductsByRole } from '../data/products'
import { initiatePayment } from '../services/paypackService' // Importing your paypack helper

type Props = {
  role: 'girl' | 'boy' | 'parent'
  onBack: () => void
}

export default function ProductCatalog({ role, onBack }: Props) {
  const products = getProductsByRole(role)

  // --- Payment Modal States ---
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // 1. Triggered when user clicks "Order"
  function handleOrderPress(product: Product) {
    setSelectedProduct(product)
    setModalVisible(true)
  }

  // 2. Processes Mobile Money transaction & diverts to WhatsApp
  async function processPaymentAndOrder() {
    if (!selectedProduct) return
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile money phone number.')
      return
    }

    setIsProcessing(true)

    try {
      // Initiate Paypack API integration call
      const response = await initiatePayment(phoneNumber, selectedProduct.price)
      
      // Close modal and reset state
      setModalVisible(false)
      setIsProcessing(false)
      
      // Compose WhatsApp message indicating successful MoMo prompt trigger
      const total = selectedProduct.price * 1
      const message = `MYCARE+ ORDER
Product: ${selectedProduct.name}
Quantity: 1
Total: ${total} RWF
Role: ${role}
Delivery Address: 
Payment: Paid via Mobile Money (Ref: ${response.ref || 'Pending MoMo Confirmation'})`
      
      Alert.alert(
        'Payment Initiated', 
        'Please look out for a Mobile Money PIN prompt on your phone screen to confirm payment.',
        [
          {
            text: 'OK',
            onPress: () => {
              Linking.openURL(`https://wa.me/250798252250?text=${encodeURIComponent(message)}`)
            }
          }
        ]
      )
    } catch (error) {
      setIsProcessing(false)
      Alert.alert('Payment Error', 'Failed to connect to Mobile Money. Please try again.')
    }
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyText}>No products available for your role</Text>
        <TouchableOpacity onPress={onBack} style={styles.emptyBackButton}>
          <Text style={styles.emptyBackText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.roleBadge}>
          {role === 'girl' && '👩 Products for Women'}
          {role === 'boy' && '👨 Products for Men'}
          {role === 'parent' && '👨‍👩‍👧 Products for Family'}
        </Text>

        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productEmoji}>{product.imageEmoji}</Text>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
              <Text style={styles.productPrice}>{product.price.toLocaleString()} RWF</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleOrderPress(product)}
              style={styles.orderButton}
            >
              <Text style={styles.orderButtonText}>Order</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>🔒 Privacy Guarantee</Text>
          <Text style={styles.noteText}>✓ Plain, unmarked packaging</Text>
          <Text style={styles.noteText}>✓ No product names on SMS</Text>
          <Text style={styles.noteText}>✓ Secure Mobile Money Payment</Text>
          <Text style={styles.noteText}>✓ Confidential delivery</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* --- Mobile Money Checkout Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mobile Money Checkout</Text>
            <Text style={styles.modalSubtitle}>
              Paying for: <Text style={{ fontWeight: 'bold' }}>{selectedProduct?.name}</Text>
            </Text>
            <Text style={styles.modalAmount}>
              Amount: {selectedProduct?.price.toLocaleString()} RWF
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter MoMo Number (e.g., 078XXXXXXX)"
              keyboardType="numeric"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={!isProcessing}
            />

            {isProcessing ? (
              <ActivityIndicator size="large" color="#e91e63" style={{ marginVertical: 15 }} />
            ) : (
              <View style={styles.modalActionRow}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]} 
                  onPress={processPaymentAndOrder}
                >
                  <Text style={styles.confirmButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  // ... Keeping your existing styles exactly as they were ...
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  emptyBackButton: {
    padding: 12,
  },
  emptyBackText: {
    fontSize: 16,
    color: '#e91e63',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#e91e63',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  roleBadge: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    overflow: 'hidden',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productEmoji: {
    fontSize: 44,
    marginRight: 16,
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
    fontSize: 15,
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
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  noteCard: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
    textAlign: 'center',
  },
  noteText: {
    color: '#1b5e20',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },

  // --- NEW MODAL STYLES ADDED HERE ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  modalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#e91e63',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
})