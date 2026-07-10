import React from 'react'
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, Card } from './ui'
import { colors, spacing, radius } from '../theme'

const CATEGORY_EMOJI: Record<string, string> = {
  pads: '🩹',
  condoms: '🛡️',
  pain: '💊',
  hygiene: '🧼',
  test: '🔬',
}

export function categoryEmoji(category?: string): string {
  return (category && CATEGORY_EMOJI[category]) || '🛒'
}

interface Props {
  name: string
  price: number
  description?: string
  category?: string
  image?: string | null
  accent?: string
  soft?: string
  onAdd: () => void
}

export default function ProductCard({ name, price, description, category, image, accent = colors.primary, soft = colors.gray100, onAdd }: Props) {
  return (
    <Card style={styles.card}>
      {image ? (
        <Image source={{ uri: image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: soft }]}>
          <Text style={styles.emoji}>{categoryEmoji(category)}</Text>
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
        <Text variant="heading" color={accent} style={{ marginTop: spacing.xs }}>
          {price.toLocaleString()} RWF
        </Text>
      </View>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: accent }]} onPress={onAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={20} color={colors.white} />
      </TouchableOpacity>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  info: { flex: 1 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
