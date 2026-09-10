import React, { useState } from 'react'
import { Alert, View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card, Badge } from './ui'
import { spacing, colors } from '../theme'
import { api, apiErrorMessage } from '../api/client'

export type OrderItem = { product?: { name?: string }; quantity: number; unitPrice?: number; totalPrice?: number }

interface Props {
  orderId?: number
  productName: string
  quantity?: number
  total?: number
  status?: string
  date?: string
  phone?: string | null
  deliveryAddress?: string | null
  paymentMethod?: string | null
  items?: OrderItem[] | null
  cancellable?: boolean
  onChanged?: () => void
  /** Extra content (e.g. admin status controls, customer info). */
  children?: React.ReactNode
}

const TERMINAL = new Set(['delivered', 'cancelled', 'rejected'])

export default function OrderCard({ orderId, productName, quantity, total, status, date, phone, deliveryAddress, paymentMethod, items, cancellable, onChanged, children }: Props) {
  const [cancelling, setCancelling] = useState(false)
  const canCancel = Boolean(cancellable && orderId && status && !TERMINAL.has(status.toLowerCase()))

  const cancel = async () => {
    if (!orderId) return
    Alert.alert('Cancel order?', 'Only pending or confirmed orders can be cancelled.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order', style: 'destructive',
        onPress: async () => {
          setCancelling(true)
          try {
            await api.post(`/orders/${orderId}/cancel`)
            onChanged?.()
          } catch (e) {
            Alert.alert('Could not cancel', apiErrorMessage(e))
          } finally { setCancelling(false) }
        },
      },
    ])
  }

  return (
    <Card>
      <View style={styles.topRow}>
        <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
          {productName}
        </Text>
        {status ? <Badge label={status} status={status} /> : null}
      </View>

      <View style={styles.metaRow}>
        {typeof quantity === 'number' ? <Text variant="caption" muted>Qty: {quantity}</Text> : null}
        {typeof total === 'number' ? <Text variant="caption" muted>{total.toLocaleString()} RWF</Text> : null}
        {date ? <Text variant="caption" muted>{new Date(date).toLocaleDateString()}</Text> : null}
      </View>

      {items && items.length > 1 ? (
        <View style={styles.itemsBox}>
          {items.map((item, index) => (
            <Text key={index} variant="caption" muted style={styles.itemLine}>
              {item.product?.name ?? 'Product'} × {item.quantity}{typeof item.totalPrice === 'number' ? ` · ${item.totalPrice.toLocaleString()} RWF` : ''}
            </Text>
          ))}
        </View>
      ) : null}

      {phone || deliveryAddress || paymentMethod ? (
        <View style={styles.detailBox}>
          {phone ? <Text variant="caption" muted>Call: {phone}</Text> : null}
          {deliveryAddress ? <Text variant="caption" muted>Deliver: {deliveryAddress}</Text> : null}
          {paymentMethod ? <Text variant="caption" muted>Payment: {paymentMethod === 'call' ? 'Call to confirm' : paymentMethod}</Text> : null}
        </View>
      ) : null}

      {children}

      {canCancel ? (
        <TouchableOpacity onPress={cancel} disabled={cancelling} style={styles.cancelRow}>
          <Text variant="caption" color={colors.danger}>{cancelling ? 'Cancelling…' : 'Cancel order'}</Text>
        </TouchableOpacity>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  itemsBox: { marginTop: spacing.sm, gap: 2 },
  itemLine: { lineHeight: 18 },
  detailBox: { marginTop: spacing.sm, gap: 2 },
  cancelRow: { marginTop: spacing.sm, alignSelf: 'flex-start' },
})
