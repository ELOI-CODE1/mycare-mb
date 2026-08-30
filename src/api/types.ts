export type ApiProduct = {
  id: number | string
  name: string
  description?: string
  price: number
  discountPercent?: number
  category?: string
  imageUrl?: string | null
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
  location: string
  verificationCode?: string
  role: 'girl' | 'boy' | 'parent'
}

export type CreateOrderPayload = {
  items: Array<{ productId: number; quantity: number }>
  deliveryAddress: string
  contactPhone: string
}
