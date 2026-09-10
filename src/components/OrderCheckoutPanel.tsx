import React, { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Button, Card, Input, Text } from './ui'
import { api, apiErrorMessage } from '../api/client'
import { isReachablePhone } from '../utils/validation'
import { useCart } from '../context/CartContext'
import { colors, spacing } from '../theme'

export default function OrderCheckoutPanel() {
  const { items, totalItems, totalPrice, markCheckout } = useCart()
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (items.length === 0) {
      Alert.alert('Your cart is empty', 'Add a care product before placing an order.')
      return
    }
    const cleanPhone = phone.trim()
    if (!isReachablePhone(cleanPhone)) {
      Alert.alert('Callback number required', 'Add a reachable phone number so our team can call you about payment and delivery.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/orders', {
        items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        deliveryAddress: deliveryAddress.trim(),
        phone: cleanPhone,
        paymentMethod: 'call',
        idempotencyKey: `app-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      })
      markCheckout()
      setDeliveryAddress('')
      setPhone('')
      Alert.alert('Order received', 'Thanks! Our team will call you shortly to agree on payment and delivery.')
    } catch (error) {
      Alert.alert('Could not place order', apiErrorMessage(error, 'Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text variant="heading">Your order</Text>
          <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{totalItems} item{totalItems === 1 ? '' : 's'} · {totalPrice.toLocaleString()} RWF</Text>
        </View>
        <Text variant="heading" color={colors.primary}>{totalPrice.toLocaleString()} RWF</Text>
      </View>
      <Input label="Callback phone number" placeholder="0788123456" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input label="Delivery address" placeholder="House, street, sector" value={deliveryAddress} onChangeText={setDeliveryAddress} />
      <Text variant="caption" muted style={{ marginBottom: spacing.md }}>No online payment needed — we call you to agree on payment and delivery.</Text>
      <Button title="Place order — we’ll call you" onPress={submit} loading={submitting} accent={colors.primary} />
    </Card>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
})
