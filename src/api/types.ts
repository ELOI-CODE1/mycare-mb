export type ApiProduct = {
  id: number | string
  name: string
  description?: string
  price: number
  discountPercent?: number
  category?: string
  imageUrl?: string | null
  imageData?: string | null
  displayImage?: string | null
  imageUrls?: string[]
}

export type ApiMessage = {
  id: string
  body: string
  sender: 'user' | 'admin'
  createdAt: string
  userId: string
  username: string
  email: string
}

export type CreateAccountPayload = {
  fullName: string
  email: string
  password: string
  phone: string
  role: 'girl' | 'boy' | 'parent'
}

export type CreateOrderPayload = {
  items: Array<{ productId: number; quantity: number }>
  deliveryAddress: string
  phone: string
  paymentMethod: 'call' | 'mobile_manual'
}

export type ApiOrderItem = {
  quantity: number
  unitPrice?: number
  totalPrice?: number
  product?: { id?: number; name?: string; price?: number; imageUrl?: string | null; imageData?: string | null }
}

export type ApiOrder = {
  id: number
  quantity?: number
  totalPrice?: number
  subtotal?: number
  total?: number
  status: string
  createdAt: string
  deliveryAddress?: string | null
  phone?: string | null
  paymentMethod?: string | null
  items?: ApiOrderItem[] | null
  product?: { name?: string }
  user?: { email?: string; fullName?: string; phone?: string | null }
}
