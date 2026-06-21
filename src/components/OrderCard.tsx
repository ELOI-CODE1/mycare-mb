import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Card, Badge } from './ui'
import { spacing, colors } from '../theme'

interface Props {
  productName: string
  quantity?: number
  total?: number
  status?: string
  date?: string
  /** Extra content (e.g. admin status controls, customer info). */
  children?: React.ReactNode
}

export default function OrderCard({ productName, quantity, total, status, date, children }: Props) {
  return (
    <Card>
      <View style={styles.topRow}>
        <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
          {productName}
        </Text>
        {status ? <Badge label={status} status={status} /> : null}
      </View>

      <View style={styles.metaRow}>
        {typeof quantity === 'number' ? (
          <Text variant="caption" muted>
            Qty: {quantity}
          </Text>
        ) : null}
        {typeof total === 'number' ? (
          <Text variant="caption" muted>
            {total.toLocaleString()} RWF
          </Text>
        ) : null}
        {date ? (
          <Text variant="caption" muted>
            {new Date(date).toLocaleDateString()}
          </Text>
        ) : null}
      </View>

      {children}
    </Card>
  )
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
})
