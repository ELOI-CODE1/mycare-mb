import React, { useState } from 'react'
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text, Input, Button } from './ui'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { colors, spacing, radius } from '../theme'

interface Props {
  visible: boolean
  onClose: () => void
  accent?: string
}

export default function CartModal({ visible, onClose, accent = colors.primary }: Props) {
  const insets = useSafeAreaInsets()
  const { items, setQuantity, removeItem, totalPrice, totalItems, markCheckout } = useCart()
  const { user } = useAuth()
  const [address, setAddress] = useState('')
  const [placing, setPlacing] = useState(false)

  const placeOrder = async () => {
    if (items.length === 0) return
    if (!address.trim()) {
      Alert.alert('Delivery address', 'Please enter where we should deliver your order.')
      return
    }
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to place an order.')
      return
    }

    setPlacing(true)
    const rows = items.map((i) => ({
      user_id: user.id,
      product_id: i.product.id,
      quantity: i.quantity,
      total_price: i.product.price * i.quantity,
      delivery_address: address.trim(),
      status: 'pending',
    }))

    const { error } = await supabase.from('orders').insert(rows)
    setPlacing(false)

    if (error) {
      Alert.alert('Error', 'Failed to place your order. Please try again.')
      return
    }

    markCheckout()
    setAddress('')
    onClose()
    Alert.alert('Order placed', 'Your order has been received and is being processed.')
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="title">Your Cart</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={26} color={colors.gray700} />
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="cart-outline" size={56} color={colors.gray300} />
              <Text muted style={{ marginTop: spacing.md }}>
                Your cart is empty
              </Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.lg }}>
              {items.map((item) => (
                <View key={item.product.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="label">{item.product.name}</Text>
                    <Text variant="caption" muted>
                      {item.product.price.toLocaleString()} RWF each
                    </Text>
                  </View>

                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={18} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={18} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <Text variant="label" style={styles.lineTotal}>
                    {(item.product.price * item.quantity).toLocaleString()}
                  </Text>

                  <TouchableOpacity onPress={() => removeItem(item.product.id)} hitSlop={8} style={{ marginLeft: spacing.sm }}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Delivery address */}
              <Text variant="label" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
                Delivery address
              </Text>
              <Input
                placeholder="e.g. KG 123 St, Kigali — house / landmark"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </ScrollView>
          )}

          {/* Footer */}
          {items.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text muted>Total ({totalItems} item{totalItems === 1 ? '' : 's'})</Text>
                <Text variant="heading" color={accent}>
                  {totalPrice.toLocaleString()} RWF
                </Text>
              </View>
              <Button title="Place Order" onPress={placeOrder} loading={placing} accent={accent} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    flex: 1,
    marginTop: 60,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.sm },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { minWidth: 28, textAlign: 'center', fontSize: 16 },
  lineTotal: { minWidth: 64, textAlign: 'right' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
})
