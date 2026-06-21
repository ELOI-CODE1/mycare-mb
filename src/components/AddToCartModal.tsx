import React, { useState, useEffect } from 'react'
import { Modal, View, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, Button } from './ui'
import { useCart } from '../context/CartContext'
import { colors, spacing, radius } from '../theme'

type Product = { id: number; name: string; price: number }

interface Props {
  visible: boolean
  onClose: () => void
  product: Product | null
  /** Accent color (per-role). */
  accent?: string
}

export default function AddToCartModal({ visible, onClose, product, accent = colors.primary }: Props) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  // Reset quantity each time the modal opens.
  useEffect(() => {
    if (visible) setQuantity(1)
  }, [visible])

  if (!product) return null

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
          <Text variant="heading" style={{ marginTop: 2, marginBottom: spacing.lg }}>
            {product.name}
          </Text>

          <Text variant="caption" muted>
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
