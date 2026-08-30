import React, { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import AppHeader from '../components/AppHeader'
import { Card, Text } from '../components/ui'
import { getProductsByRole } from '../data/products'
import { colors, radius, spacing } from '../theme'

type CustomerThread = { id: string; username: string; email: string; lastMessage: string; unread: number }

const demoThreads: CustomerThread[] = [
  { id: '1', username: 'Customer 1', email: 'customer1@example.com', lastMessage: 'I need help with my order.', unread: 1 },
  { id: '2', username: 'Customer 2', email: 'customer2@example.com', lastMessage: 'Can you advise me?', unread: 2 },
]

export default function AdminDashboard() {
  const [threads, setThreads] = useState(demoThreads)
  const [discounts, setDiscounts] = useState<Record<string, string>>({})
  const products = useMemo(() => getProductsByRole('girl'), [])
  return (
    <View style={styles.root}>
      <AppHeader role="admin" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text variant="title">Admin dashboard</Text>
          <Text muted style={{ marginTop: spacing.xs }}>Manage support conversations and product offers.</Text>
        </Card>
        <Card>
          <Text variant="heading">Customer messages</Text>
          {threads.map((thread) => (
            <View key={thread.id} style={styles.thread}>
              <View style={{ flex: 1 }}>
                <Text variant="label">{thread.username}</Text>
                <Text variant="caption" color={colors.primary}>{thread.email}</Text>
                <Text variant="caption" muted numberOfLines={1}>{thread.lastMessage}</Text>
              </View>
              <Text variant="caption" color={colors.primary}>{thread.unread} unread</Text>
            </View>
          ))}
          <Text variant="caption" muted style={{ marginTop: spacing.md }}>The API should return both a stable username and email. Email remains visible to distinguish customers with the same name.</Text>
        </Card>
        <Card>
          <Text variant="heading">Product discounts</Text>
          {products.map((product) => {
            const discount = Number(discounts[product.id] || 0)
            const finalPrice = Math.max(0, product.price * (1 - Math.min(100, discount) / 100))
            return (
              <View key={product.id} style={styles.product}>
                <View style={{ flex: 1 }}><Text variant="label">{product.name}</Text><Text variant="caption" muted>{discount ? `${finalPrice.toLocaleString()} RWF after discount` : `${product.price.toLocaleString()} RWF`}</Text></View>
                <TextInput value={discounts[product.id] || ''} onChangeText={(value) => setDiscounts((current) => ({ ...current, [product.id]: value.replace(/[^0-9]/g, '') }))} placeholder="%" keyboardType="number-pad" style={styles.discountInput} />
              </View>
            )
          })}
          <Text variant="caption" muted style={{ marginTop: spacing.md }}>Discount values are shown in the product response so every client can display the same offer.</Text>
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  thread: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  product: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  discountInput: { width: 58, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, textAlign: 'center', color: colors.text },
})
