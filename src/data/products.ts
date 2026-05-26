export type Product = {
  id: string
  name: string
  price: number
  description: string
  imageEmoji: string
  category: 'pads' | 'condoms' | 'pain' | 'hygiene' | 'test'
  visibleTo: ('girl' | 'boy' | 'parent')[]
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Sanitary Pads',
    price: 2500,
    description: 'Pack of 10 sanitary pads. Soft, absorbent, and comfortable.',
    imageEmoji: '📦',
    category: 'pads',
    visibleTo: ['girl', 'parent']
  },
  {
    id: '2',
    name: 'Pain Relief Tablets',
    price: 1500,
    description: 'Pack of 20 tablets for menstrual cramp relief.',
    imageEmoji: '💊',
    category: 'pain',
    visibleTo: ['girl', 'parent']
  },
  {
    id: '3',
    name: 'Condoms (Pack of 12)',
    price: 3000,
    description: 'Latex condoms. Safe and reliable protection.',
    imageEmoji: '🔒',
    category: 'condoms',
    visibleTo: ['boy', 'parent']
  },
  {
    id: '4',
    name: 'Condoms (Pack of 36)',
    price: 7500,
    description: 'Value pack of 36 condoms. Best value.',
    imageEmoji: '🔒',
    category: 'condoms',
    visibleTo: ['boy', 'parent']
  },
  {
    id: '5',
    name: 'Hygiene Kit',
    price: 5000,
    description: 'Includes pads, wipes, and essential hygiene products.',
    imageEmoji: '🧼',
    category: 'hygiene',
    visibleTo: ['girl', 'parent']
  },
  {
    id: '6',
    name: 'Pregnancy Test',
    price: 4000,
    description: 'Home test kit. Pack of 2. Accurate results.',
    imageEmoji: '🔬',
    category: 'test',
    visibleTo: ['girl', 'parent']
  },
  {
    id: '7',
    name: 'Heating Pad',
    price: 6000,
    description: 'Reusable heating pad for cramp relief.',
    imageEmoji: '🔥',
    category: 'pain',
    visibleTo: ['girl', 'parent']
  }
]

export function getProductsByRole(role: 'girl' | 'boy' | 'parent'): Product[] {
  return products.filter(product => product.visibleTo.includes(role))
}