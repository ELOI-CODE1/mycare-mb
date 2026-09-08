import React, { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Button, Card, Input, Text } from './ui'
import { api, apiErrorMessage } from '../api/client'
import { useCart } from '../context/CartContext'
import { colors, spacing } from '../theme'

export default function OrderCheckoutPanel() {
  const { items, totalItems, totalPrice, markCheckout } = useCart()
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (items.length === 0) {
      Alert.alert('Your cart is empty', 'Add a care product before placing an order.')
      return
    }
    if (!deliveryAddress.trim()) {
      Alert.alert('Delivery address required', 'Add a delivery address so your order can be prepared.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/orders', {
        items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        deliveryAddress: deliveryAddress.trim(),
      })
      markCheckout()
      setDeliveryAddress('')
      Alert.alert('Order received', 'Your order is pending confirmation. Payment will be added later.')
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
      <Input label="Delivery address" placeholder="House, street, sector" value={deliveryAddress} onChangeText={setDeliveryAddress} />
      <Text variant="caption" muted style={{ marginBottom: spacing.md }}>Payment is not enabled yet. Orders are created for confirmation.</Text>
      <Button title="Place order" onPress={submit} loading={submitting} accent={colors.primary} />
    </Card>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
})
