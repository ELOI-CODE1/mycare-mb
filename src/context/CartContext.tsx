import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type CartProduct = {
  id: number
  name: string
  price: number
}

export type CartItem = {
  product: CartProduct
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (product: CartProduct, quantity: number) => void
  removeItem: (productId: number) => void
  setQuantity: (productId: number, quantity: number) => void
  clear: () => void
  /** Empties the cart and bumps `checkoutCount` so screens can refresh orders. */
  markCheckout: () => void
  checkoutCount: number
  totalItems: number
  totalPrice: number
}

const STORAGE_KEY = '@cart_items'
const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [checkoutCount, setCheckoutCount] = useState(0)

  // Load persisted cart once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setItems(JSON.parse(raw))
      })
      .catch((e) => console.warn('Failed to load cart:', e))
      .finally(() => setHydrated(true))
  }, [])

  // Persist on change (after initial hydration).
  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((e) =>
      console.warn('Failed to save cart:', e),
    )
  }, [items, hydrated])

  const addItem = useCallback((product: CartProduct, quantity: number) => {
    const qty = Math.max(1, Math.floor(quantity) || 1)
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
        )
      }
      return [...prev, { product, quantity: qty }]
    })
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const setQuantity = useCallback((productId: number, quantity: number) => {
    const qty = Math.floor(quantity)
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.product.id !== productId)
        : prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const markCheckout = useCallback(() => {
    setItems([])
    setCheckoutCount((c) => c + 1)
  }, [])

  const { totalItems, totalPrice } = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        acc.totalItems += i.quantity
        acc.totalPrice += i.quantity * i.product.price
        return acc
      },
      { totalItems: 0, totalPrice: 0 },
    )
  }, [items])

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    setQuantity,
    clear,
    markCheckout,
    checkoutCount,
    totalItems,
    totalPrice,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
