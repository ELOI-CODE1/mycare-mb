import React, { useMemo, useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Card, EmptyState, Text } from './ui'
import AppHeader from './AppHeader'
import { colors, spacing, roleColors, type Role } from '../theme'
import { getProductsByRole } from '../data/products'
import ProductCard from './ProductCard'
import AddToCartModal from './AddToCartModal'
import MessagePanel from './MessagePanel'
import GirlCyclePanel from './GirlCyclePanel'
import OrderCheckoutPanel from './OrderCheckoutPanel'

export default function RoleDashboardShell({ role, title, description }: { role: Role; title: string; description: string }) {
  const accent = roleColors[role].accent
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const products = useMemo(() => role === 'admin' ? [] : getProductsByRole(role).map((product) => ({ ...product, id: Number(product.id), image_url: null })), [role])
  return (
    <View style={styles.root}>
      <AppHeader role={role} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ backgroundColor: roleColors[role].soft }}>
          <Text variant="caption" color={accent}>DASHBOARD</Text>
          <Text variant="title" color={accent} style={{ marginTop: spacing.xs }}>{title}</Text>
          <Text muted style={{ marginTop: spacing.sm, lineHeight: 22 }}>{description}</Text>
        </Card>
        {role === 'girl' ? <GirlCyclePanel accent={accent} /> : null}
        <Card>
          <Text variant="heading">Health tracking</Text>
          <Text muted style={{ marginTop: spacing.xs }}>Your personal health information will appear here.</Text>
          <EmptyState icon="cloud-outline" title="Waiting for API data" subtitle="Connect this screen to your backend endpoint to load your data." />
        </Card>
        <Card>
          <Text variant="heading">Shop and orders</Text>
          <Text muted style={{ marginTop: spacing.xs }}>Products and order history will be loaded from your API.</Text>
          {products.map((product) => (
            <ProductCard key={product.id} name={product.name} price={product.price} description={product.description} category={product.category} accent={accent} soft={roleColors[role].soft} onPress={() => setSelectedProduct(product)} onAdd={() => setSelectedProduct(product)} />
          ))}
        </Card>
        <MessagePanel accent={accent} />
        <OrderCheckoutPanel />
      </ScrollView>
      <AddToCartModal visible={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} product={selectedProduct} accent={accent} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
})
