/**
 * Everything marketing-related lives here, so you can edit copy and numbers in one place.
 * NOTE: the stats below are the ones from your original hero. Replace them with real figures.
 */
export const SITE = {
  name: 'ShopAI',
  tagline: 'Shopping, tailored to you.',
  freeShippingThreshold: 500,
  shippingFee: 49,
  announcements: [
    'Free shipping on orders above ₹500',
    '30-day hassle-free returns',
    '2-hour express delivery in select cities',
    'Secure checkout, powered by Stripe',
  ],
  stats: [
    { value: 30, suffix: '+', label: 'Premium brands' },
    { value: 1, suffix: 'M+', label: 'Happy customers' },
    { value: 4.8, suffix: '', label: 'Average rating', decimals: 1 },
    { value: 2, suffix: 'hr', label: 'Express delivery' },
  ],
  brands: ['Sony', 'JBL', 'Apple', 'Nike', 'Adidas', "Levi's", 'Dyson', 'Instant Pot', 'IKEA', 'Samsung', 'Puma', 'Bose'],
  navLinks: [
    { to: '/products', label: 'Shop' },
    { to: '/products?sort=trending', label: 'Trending' },
    { to: '/products?sort=newest', label: 'New in' },
    { to: '/products?isFeatured=true', label: 'Featured' },
  ],
  popularSearches: ['Headphones', 'Sneakers', 'Watch', 'Laptop', 'Kitchen', 'Books'],
  perks: [
    { icon: 'Truck', title: 'Free shipping', desc: 'On every order above ₹500.' },
    { icon: 'ShieldCheck', title: 'Secure payments', desc: 'Encrypted checkout, always.' },
    { icon: 'Zap', title: '2-hour express', desc: 'Same-day in select cities.' },
    { icon: 'RotateCcw', title: '30-day returns', desc: 'Changed your mind? No problem.' },
  ],
};

/** Colourways of the 3D hero model (order matches the GLB's KHR_materials_variants) */
export const COLORWAYS = [
  { id: 'midnight', name: 'Midnight', accent: '#3db4ea', swatch: '#1f7ba5', poster: '/models/shoe-midnight.webp' },
  { id: 'beach', name: 'Beach', accent: '#f0a7a0', swatch: '#c79496', poster: '/models/shoe-beach.webp' },
  { id: 'street', name: 'Street', accent: '#ff4d62', swatch: '#d8334a', poster: '/models/shoe-street.webp' },
];
