import React, { useState, useEffect } from 'react'
import { Modal, View, TouchableOpacity, StyleSheet, Pressable, ScrollView, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, Button } from './ui'
import { useCart } from '../context/CartContext'
import { colors, spacing, radius } from '../theme'

type Product = { id: number; name: string; price: number; description?: string; category?: string; image_url?: string | null; images?: string[] | null }

interface Props {
  visible: boolean
  onClose: () => void
  product: Product | null
  /** Accent color (per-role). */
  accent?: string
}

function parseImages(value?: string | null, fallback?: string[] | null) {
  const sources = fallback?.filter(Boolean) || []
  if (sources.length > 0) return sources
  if (!value) return []
  return value
    .split(/\|\||\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function AddToCartModal({ visible, onClose, product, accent = colors.primary }: Props) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Reset quantity each time the modal opens.
  useEffect(() => {
    if (visible) {
      setQuantity(1)
      setActiveImageIndex(0)
    }
  }, [visible, product?.id])

  if (!product) return null

  const images = parseImages(product.image_url, product.images)
  const lineTotal = product.price * quantity

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price: product.price }, quantity)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text variant="caption" muted>
            Add to cart
          </Text>
          <Text variant="heading" style={{ marginTop: 2, marginBottom: spacing.sm }}>
            {product.name}
          </Text>

          {images.length > 0 ? (
            <View style={styles.galleryCard}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width)
                  setActiveImageIndex(index)
                }}
              >
                {images.map((url, index) => (
                  <Image key={`${product.id}-${index}`} source={{ uri: url }} style={styles.galleryImage} />
                ))}
              </ScrollView>
              {images.length > 1 ? (
                <View style={styles.dotRow}>
                  {images.map((_, index) => (
                    <View key={index} style={[styles.dot, index === activeImageIndex && styles.dotActive]} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.detailsBox}>
            {product.description ? <Text variant="caption" muted>{product.description}</Text> : null}
            {product.category ? (
              <Text variant="caption" muted style={{ textTransform: 'capitalize', marginTop: 4 }}>
                Category: {product.category}
              </Text>
            ) : null}
            <Text variant="label" color={accent} style={{ marginTop: 6 }}>
              {product.price.toLocaleString()} RWF
            </Text>
          </View>

          <Text variant="caption" muted style={{ marginTop: spacing.md }}>
            Quantity
          </Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepBtn, { borderColor: colors.border }]}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Ionicons name="remove" size={22} color={colors.text} />
            </TouchableOpacity>

            <Text variant="title" style={styles.qtyValue}>
              {quantity}
            </Text>

            <TouchableOpacity
              style={[styles.stepBtn, { borderColor: colors.border }]}
              onPress={() => setQuantity((q) => q + 1)}
            >
              <Ionicons name="add" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.totalRow}>
            <Text muted>Subtotal</Text>
            <Text variant="heading" color={accent}>
              {lineTotal.toLocaleString()} RWF
            </Text>
          </View>

          <Button title="Add to Cart" onPress={handleAdd} accent={accent} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text muted>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  galleryCard: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  galleryImage: {
    width: 260,
    height: 180,
    resizeMode: 'cover',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.gray300,
  },
  dotActive: {
    backgroundColor: accent,
  },
  detailsBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { minWidth: 64, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  closeBtn: { marginTop: spacing.md, alignItems: 'center' },
})
