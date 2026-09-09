import React from 'react'
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, Card } from './ui'
import { colors, spacing, radius } from '../theme'

interface Props {
  name: string
  price: number
  description?: string
  category?: string
  image?: string | null
  images?: string[] | null
  discountPercent?: number
  accent?: string
  soft?: string
  onAdd: () => void
  onPress?: () => void
}

export default function ProductCard({ name, price, description, category, image, discountPercent = 0, accent = colors.primary, soft = colors.gray100, onAdd, onPress }: Props) {
  const discountedPrice = Math.max(0, price * (1 - Math.min(100, Math.max(0, discountPercent)) / 100))
  return (
    <Card style={styles.card}>
      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.85}>
        {image ? (
          <Image source={{ uri: image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: soft }]}>
            <Text variant="caption" muted center>Image unavailable</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text variant="label" numberOfLines={1}>
            {name}
          </Text>
          {description ? (
            <Text variant="caption" muted numberOfLines={2} style={{ marginTop: 2 }}>
              {description}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
            <Text variant="heading" color={accent}>{discountedPrice.toLocaleString()} RWF</Text>
            {discountPercent > 0 ? <Text variant="caption" muted style={{ textDecorationLine: 'line-through' }}>{price.toLocaleString()}</Text> : null}
          </View>
          {discountPercent > 0 ? <Text variant="caption" color={colors.success}>{discountPercent}% off</Text> : null}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: accent }]} onPress={onAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={20} color={colors.white} />
      </TouchableOpacity>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, marginBottom: 0 },
  content: { flex: 1, marginBottom: spacing.sm },
  thumb: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: radius.md,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, paddingTop: spacing.sm },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
