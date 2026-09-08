export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  seller: Seller;
  rating: number;
  reviewCount: number;
  description: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  logo?: string;
  verified: boolean;
  rating: number;
  productCount: number;
  orderCount: number;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { id: 'all', name: 'Все', icon: 'discover' },
  { id: 'clothing', name: 'Одежда', icon: 'tshirt' },
  { id: 'shoes', name: 'Обувь', icon: 'shoe' },
  { id: 'electronics', name: 'Электроника', icon: 'headphones' },
  { id: 'beauty', name: 'Красота', icon: 'sparkles' },
  { id: 'home', name: 'Дом', icon: 'home' },
  { id: 'accessories', name: 'Аксессуары', icon: 'watch' },
];

export const sellers: Seller[] = [
  {
    id: 'nike-store',
    name: 'Nike Store',
    avatar: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
    verified: true,
    rating: 4.8,
    productCount: 248,
    orderCount: 12400,
    description: 'Оригинальная обувь и одежда Nike. Доставка по всей России.',
  },
  {
    id: 'fashion-lab',
    name: 'Fashion Lab',
    avatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&h=120&fit=crop',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
    verified: true,
    rating: 4.6,
    productCount: 156,
    orderCount: 8200,
    description: 'Современная одежда для ценителей минимализма.',
  },
  {
    id: 'tech-point',
    name: 'Tech Point',
    avatar: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&h=120&fit=crop',
    logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
    verified: true,
    rating: 4.9,
    productCount: 89,
    orderCount: 5600,
    description: 'Премиальная электроника и аксессуары.',
  },
  {
    id: 'leather-house',
    name: 'Leather House',
    avatar: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&h=120&fit=crop',
    logo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop',
    verified: false,
    rating: 4.7,
    productCount: 64,
    orderCount: 3200,
    description: 'Итальянская кожа ручной работы.',
  },
  {
    id: 'sports-zone',
    name: 'Sports Zone',
    avatar: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&h=120&fit=crop',
    logo: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop',
    verified: false,
    rating: 4.6,
    productCount: 76,
    orderCount: 4300,
    description: 'Всё для спорта и активного образа жизни.',
  },
  {
    id: 'beauty-bar',
    name: 'Beauty Bar',
    avatar: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&h=120&fit=crop',
    logo: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&h=200&fit=crop',
    verified: true,
    rating: 4.8,
    productCount: 54,
    orderCount: 3800,
    description: 'Косметика и парфюмерия премиум-класса.',
  },
  {
    id: 'urban-fit',
    name: 'Urban Fit',
    avatar: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=120&h=120&fit=crop',
    logo: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=200&fit=crop',
    verified: false,
    rating: 4.5,
    productCount: 121,
    orderCount: 2900,
    description: 'Стритвир и повседневная одежда с характером.',
  },
  {
    id: 'urban-objects',
    name: 'Urban Objects',
    avatar: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop',
    logo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
    verified: false,
    rating: 4.7,
    productCount: 33,
    orderCount: 2100,
    description: 'Минималистичные аксессуары и детали образа.',
  },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Nike Air Max 95',
    price: 14990,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1000&fit=crop',
    ],
    category: 'shoes',
    seller: sellers[0],
    rating: 4.8,
    reviewCount: 342,
    description: 'Классические кроссовки Air Max 95 с характерной амортизацией Air. Верх из сетчатого материала обеспечивает дыхание.',
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    colors: [
      { name: 'Чёрный', hex: '#1A1A1A' },
      { name: 'Белый', hex: '#FFFFFF' },
      { name: 'Серый', hex: '#8E8E93' },
    ],
    isNew: true,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Oversized Hoodie',
    price: 8900,
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=1000&fit=crop',
    ],
    category: 'clothing',
    seller: sellers[1],
    rating: 4.6,
    reviewCount: 189,
    description: 'Увеличенный оверсайз худи из плотного хлопка. Идеально для повседневного образа.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Серый', hex: '#8E8E93' },
      { name: 'Чёрный', hex: '#1A1A1A' },
      { name: 'Бежевый', hex: '#D4C5A9' },
    ],
    isFeatured: true,
  },
  {
    id: '3',
    name: 'Minimal Leather Bag',
    price: 12500,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1000&fit=crop',
    ],
    category: 'accessories',
    seller: sellers[3],
    rating: 4.9,
    reviewCount: 67,
    description: 'Минималистичная сумка из натуральной итальянской кожи ручной работы.',
    colors: [
      { name: 'Коричневый', hex: '#8B6914' },
      { name: 'Чёрный', hex: '#1A1A1A' },
    ],
    isFeatured: true,
  },
  {
    id: '4',
    name: 'Premium Sneakers',
    price: 11990,
    originalPrice: 14990,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=1000&fit=crop',
    ],
    category: 'shoes',
    seller: sellers[0],
    rating: 4.7,
    reviewCount: 256,
    description: 'Премиальные кроссовки из кожи и сетки. Удобная посадка на каждый день.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Белый', hex: '#FFFFFF' },
      { name: 'Синий', hex: '#0055AA' },
    ],
  },
  {
    id: '5',
    name: 'Technical Jacket',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop',
    ],
    category: 'clothing',
    seller: sellers[1],
    rating: 4.5,
    reviewCount: 134,
    description: 'Техническая куртка с водоотталкивающей пропиткой. Лёгкая и тёплая.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Чёрный', hex: '#1A1A1A' },
      { name: 'Хаки', hex: '#6B6B47' },
    ],
    isNew: true,
  },
  {
    id: '6',
    name: 'Vintage Denim',
    price: 9500,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&h=1000&fit=crop',
    ],
    category: 'clothing',
    seller: sellers[1],
    rating: 4.4,
    reviewCount: 87,
    description: 'Классические джинсы винтажного кроя. Плотный деним.',
    sizes: ['28', '30', '32', '34', '36'],
    colors: [
      { name: 'Синий', hex: '#4A6FA5' },
      { name: 'Тёмный', hex: '#1A2744' },
    ],
  },
  {
    id: '7',
    name: 'Wireless Headphones',
    price: 7990,
    originalPrice: 10990,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=1000&fit=crop',
    ],
    category: 'electronics',
    seller: sellers[2],
    rating: 4.8,
    reviewCount: 523,
    description: 'Беспроводные наушники с шумоподавлением. До 30 часов работы.',
    isFeatured: true,
  },
  {
    id: '8',
    name: 'Minimal Watch',
    price: 15900,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=1000&fit=crop',
    ],
    category: 'accessories',
    seller: sellers[3],
    rating: 4.9,
    reviewCount: 98,
    description: 'Минималистичные часы с кварцевым механизмом и кожаным ремешком.',
    colors: [
      { name: 'Золотой', hex: '#C9A96E' },
      { name: 'Серебряный', hex: '#C0C0C0' },
    ],
    isNew: true,
  },
  {
    id: '9',
    name: 'Cotton T-Shirt',
    price: 3900,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=1000&fit=crop',
    ],
    category: 'clothing',
    seller: sellers[1],
    rating: 4.3,
    reviewCount: 456,
    description: 'Базовая футболка из 100% хлопка. Плотность 180 г/м².',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Белый', hex: '#FFFFFF' },
      { name: 'Чёрный', hex: '#1A1A1A' },
      { name: 'Серый', hex: '#8E8E93' },
    ],
  },
  {
    id: '10',
    name: 'Running Shoes',
    price: 12500,
    originalPrice: 15490,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop',
    ],
    category: 'shoes',
    seller: sellers[0],
    rating: 4.7,
    reviewCount: 312,
    description: 'Беговые кроссовки с технологией React. Лёгкие и отзывчивые.',
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: [
      { name: 'Чёрный', hex: '#1A1A1A' },
      { name: 'Оранжевый', hex: '#FF6B35' },
    ],
  },
  {
    id: '11',
    name: 'Cashmere Scarf',
    price: 6500,
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=1000&fit=crop',
    ],
    category: 'accessories',
    seller: sellers[3],
    rating: 4.8,
    reviewCount: 45,
    description: 'Кашемировый шарф итальянского производства. Нежная текстура.',
    colors: [
      { name: 'Бежевый', hex: '#D4C5A9' },
      { name: 'Серый', hex: '#8E8E93' },
      { name: 'Чёрный', hex: '#1A1A1A' },
    ],
  },
  {
    id: '12',
    name: 'Perfume Noir',
    price: 8900,
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=1000&fit=crop',
    ],
    category: 'beauty',
    seller: sellers[1],
    rating: 4.6,
    reviewCount: 178,
    description: 'Духи с нотами амбры, сандала и ванили. Объём 100 мл.',
    isNew: true,
  },
  {
    id: '13',
    name: 'Court Classic Sneakers',
    price: 10990,
    originalPrice: 12990,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop',
    ],
    category: 'shoes',
    seller: sellers[4],
    rating: 4.6,
    reviewCount: 74,
    description: 'Универсальные кроссовки на каждый день с амортизацией и дышащим верхом.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Белый', hex: '#FFFFFF' },
      { name: 'Чёрный', hex: '#1A1A1A' },
    ],
    isNew: true,
  },
  {
    id: '14',
    name: 'Key Running Pack',
    price: 13450,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=1000&fit=crop',
    ],
    category: 'shoes',
    seller: sellers[4],
    rating: 4.7,
    reviewCount: 132,
    description: 'Беговые кроссовки с лёгкой пеной и усиленной пяткой.',
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: [
      { name: 'Серый', hex: '#8E8E93' },
      { name: 'Оранжевый', hex: '#FF6B35' },
    ],
    isFeatured: true,
  },
  {
    id: '15',
    name: 'Minimal Zip Hoodie',
    price: 7900,
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=1000&fit=crop',
    ],
    category: 'clothing',
    seller: sellers[6],
    rating: 4.5,
    reviewCount: 91,
    description: 'Худи на молнии из плотного трикотажа в минималистичном дизайне.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Чёрный', hex: '#1A1A1A' },
      { name: 'Хаки', hex: '#6B6B47' },
    ],
    isNew: true,
  },
  {
    id: '16',
    name: 'Relaxed Denim',
    price: 9200,
    originalPrice: 10900,
    image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1000&fit=crop',
    ],
    category: 'clothing',
    seller: sellers[6],
    rating: 4.4,
    reviewCount: 58,
    description: 'Джинсы свободного кроя из плотного денима.',
    sizes: ['28', '30', '32', '34', '36'],
    colors: [
      { name: 'Синий', hex: '#4A6FA5' },
      { name: 'Тёмный', hex: '#1A2744' },
    ],
  },
  {
    id: '17',
    name: 'Velvet Perfume',
    price: 7400,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&h=1000&fit=crop',
    ],
    category: 'beauty',
    seller: sellers[5],
    rating: 4.8,
    reviewCount: 66,
    description: 'Тёплый парфюм с нотами мускуса, сливы и ириса.',
    colors: [
      { name: 'Золотой', hex: '#C9A96E' },
    ],
    isFeatured: true,
  },
  {
    id: '18',
    name: 'Nuit Eau de Parfum',
    price: 8600,
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=1000&fit=crop',
    ],
    category: 'beauty',
    seller: sellers[5],
    rating: 4.7,
    reviewCount: 104,
    description: 'Вечерний аромат с нотами ванили, пачули и бергамота.',
    isNew: true,
  },
  {
    id: '19',
    name: 'Chrono Minimal Watch',
    price: 14200,
    originalPrice: 17800,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=1000&fit=crop',
    ],
    category: 'accessories',
    seller: sellers[7],
    rating: 4.7,
    reviewCount: 42,
    description: 'Минималистичные часы с кожаным ремешком и сапфировым стеклом.',
    colors: [
      { name: 'Серебряный', hex: '#C0C0C0' },
      { name: 'Коричневый', hex: '#8B6914' },
    ],
  },
  {
    id: '20',
    name: 'Pashmina Scarf',
    price: 5800,
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&h=750&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=1000&fit=crop',
    ],
    category: 'accessories',
    seller: sellers[7],
    rating: 4.8,
    reviewCount: 37,
    description: 'Шарф из мягкой пашмины с нежным текстильным рисунком.',
    colors: [
      { name: 'Бежевый', hex: '#D4C5A9' },
      { name: 'Чёрный', hex: '#1A1A1A' },
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getSellerById(id: string): Seller | undefined {
  return sellers.find((s) => s.id === id);
}

export function getProductsBySeller(sellerId: string): Product[] {
  return products.filter((p) => p.seller.id === sellerId);
}

export function getProductsByCategory(categoryId: string): Product[] {
  if (categoryId === 'all') return products;
  return products.filter((p) => p.category === categoryId);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.seller.name.toLowerCase().includes(q)
  );
}
