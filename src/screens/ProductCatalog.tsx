import React from 'react'
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  ScrollView, Alert 
} from 'react-native'
import * as Linking from 'expo-linking'
import { Product, getProductsByRole } from '../data/products'

type Props = {
  role: 'girl' | 'boy' | 'parent'
  onBack: () => void
}

export default function ProductCatalog({ role, onBack }: Props) {
  const products = getProductsByRole(role)

  function placeOrder(product: Product, quantity: number = 1) {
    const total = product.price * quantity
    const message = `MYCARE+ ORDER
Product: ${product.name}
Quantity: ${quantity}
Total: ${total} RWF
Role: ${role}
Delivery Address: 
Payment: Cash on delivery`
    
    Linking.openURL(`https://wa.me/250798252250?text=${encodeURIComponent(message)}`)
    Alert.alert('Order Initiated', 'Check WhatsApp to complete your order')
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
            onPress={() => placeOrder(product)}
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
        <Text style={styles.noteText}>✓ Cash on delivery</Text>
        <Text style={styles.noteText}>✓ Confidential delivery</Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
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
})