import React, { useState, useEffect } from 'react'
import { Modal, View, TouchableOpacity, StyleSheet, Pressable, ScrollView, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, Button } from './ui'
import { useCart } from '../context/CartContext'
import { colors, spacing, radius } from '../theme'

type Product = { id: number; name: string; price: number; description?: string; category?: string; image_url?: string | null; images?: string[] | null; discountPercent?: number }

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
  const [fullImageVisible, setFullImageVisible] = useState(false)

  // Reset quantity each time the modal opens.
  useEffect(() => {
    if (visible) {
      setQuantity(1)
      setActiveImageIndex(0)
      setFullImageVisible(false)
    }
  }, [visible, product?.id])

  if (!product) return null

  const images = parseImages(product.image_url, product.images)
  const discountPercent = product.discountPercent || 0
  const unitPrice = Math.max(0, product.price * (1 - Math.min(100, discountPercent) / 100))
  const lineTotal = unitPrice * quantity

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price: product.price }, quantity)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.sheet}>
          <View style={styles.pageHeader}><TouchableOpacity accessibilityLabel="Close product details" onPress={onClose}><Ionicons name="arrow-back" size={23} color={colors.ink} /></TouchableOpacity><Text variant="label">Product details</Text><View style={{ width: 23 }} /></View>

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
                  <Pressable key={`${product.id}-${index}`} onPress={() => setFullImageVisible(true)} accessibilityLabel="View product image full screen">
                    <Image source={{ uri: url }} style={styles.galleryImage} />
                  </Pressable>
                ))}
              </ScrollView>
              {images.length > 1 ? (
                <View style={styles.dotRow}>
                  {images.map((_, index) => (
                    <View key={index} style={[styles.dot, index === activeImageIndex && styles.dotActive]} />
                  ))}
                </View>
              ) : null}
              <View style={styles.imageHint}><Ionicons name="expand-outline" size={14} color={colors.gray700} /><Text variant="caption" muted>Tap image to view full screen</Text></View>
            </View>
          ) : null}

          {images.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailRow}>{images.map((url, index) => <TouchableOpacity key={`thumb-${url}`} onPress={() => setActiveImageIndex(index)} style={[styles.thumbnail, index === activeImageIndex && { borderColor: accent }]}><Image source={{ uri: url }} style={styles.thumbnailImage} /></TouchableOpacity>)}</ScrollView> : null}

          <View style={styles.detailsBox}>
            {product.description ? <Text variant="caption" muted>{product.description}</Text> : null}
            {product.category ? (
              <Text variant="caption" muted style={{ textTransform: 'capitalize', marginTop: 4 }}>
                Category: {product.category}
              </Text>
            ) : null}
            <Text variant="label" color={accent} style={{ marginTop: 6 }}>
              {unitPrice.toLocaleString()} RWF {discountPercent ? `(${discountPercent}% off)` : ''}
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
        </View>
      <Modal visible={fullImageVisible} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setFullImageVisible(false)}>
        <View style={styles.fullscreenViewer}>
          <Pressable accessibilityLabel="Close full screen image" onPress={() => setFullImageVisible(false)} style={styles.fullscreenClose}><Ionicons name="close" size={26} color={colors.white} /></Pressable>
          {images[activeImageIndex] ? <Image source={{ uri: images[activeImageIndex] }} style={styles.fullscreenImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  galleryCard: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  galleryImage: {
    width: 320,
    height: 230,
    resizeMode: 'cover',
  },
  imageHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  thumbnailRow: { gap: spacing.sm, paddingBottom: spacing.md },
  thumbnail: { width: 58, height: 58, borderRadius: radius.sm, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbnailImage: { width: '100%', height: '100%' },
  fullscreenViewer: { flex: 1, backgroundColor: '#101514', justifyContent: 'center', alignItems: 'center' },
  fullscreenImage: { width: '100%', height: '82%' },
  fullscreenClose: { position: 'absolute', top: 48, right: 20, zIndex: 2, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
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
    backgroundColor: colors.primary,
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
