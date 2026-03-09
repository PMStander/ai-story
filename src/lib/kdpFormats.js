/**
 * Amazon KDP Book Format Reference Data
 * Covers trim sizes, page requirements, pricing, and book type specs.
 */

// ============================================================
// KDP Trim Sizes
// ============================================================

export const KDP_TRIM_SIZES = {
  // Children's Picture Books (most popular)
  '8.5x8.5': {
    label: '8.5" × 8.5" Square',
    width: 8.5,
    height: 8.5,
    category: 'picture-book',
    description: 'Most popular for children\'s picture books',
    popular: true,
    minPages: 24,
    maxPages: 80,
    recommendedPages: 32,
    aspectRatio: '1:1',
    imageAspectRatio: '1:1',
  },
  '8x10': {
    label: '8" × 10" Portrait',
    width: 8,
    height: 10,
    category: 'picture-book',
    description: 'Classic portrait format for picture books',
    popular: true,
    minPages: 24,
    maxPages: 80,
    recommendedPages: 32,
    aspectRatio: '4:5',
    imageAspectRatio: '4:5',
  },
  '8.5x11': {
    label: '8.5" × 11" Letter',
    width: 8.5,
    height: 11,
    category: 'activity-book',
    description: 'Letter size — ideal for activity & coloring books',
    popular: true,
    minPages: 24,
    maxPages: 500,
    recommendedPages: 48,
    aspectRatio: '17:22',
    imageAspectRatio: '3:4',
  },
  '10x8': {
    label: '10" × 8" Landscape',
    width: 10,
    height: 8,
    category: 'picture-book',
    description: 'Landscape format for wide scene illustrations',
    popular: false,
    minPages: 24,
    maxPages: 80,
    recommendedPages: 32,
    aspectRatio: '5:4',
    imageAspectRatio: '5:4',
  },
  '6x9': {
    label: '6" × 9"',
    width: 6,
    height: 9,
    category: 'chapter-book',
    description: 'Standard for early readers & chapter books',
    popular: true,
    minPages: 24,
    maxPages: 828,
    recommendedPages: 64,
    aspectRatio: '2:3',
    imageAspectRatio: '2:3',
  },
  '5.5x8.5': {
    label: '5.5" × 8.5"',
    width: 5.5,
    height: 8.5,
    category: 'chapter-book',
    description: 'Compact — great for early chapter books',
    popular: false,
    minPages: 24,
    maxPages: 828,
    recommendedPages: 48,
    aspectRatio: '11:17',
    imageAspectRatio: '9:16',
  },
  '5x8': {
    label: '5" × 8"',
    width: 5,
    height: 8,
    category: 'chapter-book',
    description: 'Pocket-sized chapter book',
    popular: false,
    minPages: 24,
    maxPages: 828,
    recommendedPages: 48,
    aspectRatio: '5:8',
    imageAspectRatio: '9:16',
  },
  '7x10': {
    label: '7" × 10"',
    width: 7,
    height: 10,
    category: 'educational',
    description: 'Large format for educational & workbook content',
    popular: false,
    minPages: 24,
    maxPages: 500,
    recommendedPages: 64,
    aspectRatio: '7:10',
    imageAspectRatio: '3:4',
  },
};

// ============================================================
// Book Types
// ============================================================

export const BOOK_TYPES = {
  'picture-book': {
    label: 'Picture Book',
    icon: 'auto_stories',
    description: 'Full-color illustrations on every page (ages 2–6)',
    recommendedSizes: ['8.5x8.5', '8x10', '10x8'],
    recommendedPages: [24, 28, 32, 36, 40],
    interiorType: 'premium-color',
    priceRange: '$8.99 – $15.99',
    wordsPerPage: '10-30',
    totalWordRange: '200-800',
  },
  'early-reader': {
    label: 'Early Reader',
    icon: 'menu_book',
    description: 'Simple text with illustrations (ages 5–8)',
    recommendedSizes: ['6x9', '5.5x8.5', '8x10'],
    recommendedPages: [32, 48, 64],
    interiorType: 'premium-color',
    priceRange: '$7.99 – $12.99',
    wordsPerPage: '30-60',
    totalWordRange: '1000-3000',
  },
  'chapter-book': {
    label: 'Chapter Book',
    icon: 'book',
    description: 'Longer stories with some illustrations (ages 7–12)',
    recommendedSizes: ['5.5x8.5', '6x9', '5x8'],
    recommendedPages: [64, 80, 96, 128],
    interiorType: 'standard-color',
    priceRange: '$6.99 – $10.99',
    wordsPerPage: '100-200',
    totalWordRange: '5000-20000',
  },
  'activity-book': {
    label: 'Activity / Coloring Book',
    icon: 'palette',
    description: 'Interactive pages — mazes, puzzles, coloring (ages 3–10)',
    recommendedSizes: ['8.5x11', '8.5x8.5', '8x10'],
    recommendedPages: [48, 64, 80, 100],
    interiorType: 'black-white',
    priceRange: '$5.99 – $9.99',
    wordsPerPage: '5-15',
    totalWordRange: '200-1000',
  },
  'educational': {
    label: 'Educational / Non-Fiction',
    icon: 'school',
    description: 'Learning-focused with facts and illustrations (ages 4–10)',
    recommendedSizes: ['8.5x11', '8x10', '7x10'],
    recommendedPages: [32, 48, 64],
    interiorType: 'premium-color',
    priceRange: '$9.99 – $16.99',
    wordsPerPage: '30-80',
    totalWordRange: '1000-5000',
  },
};

// ============================================================
// Interior Types
// ============================================================

export const INTERIOR_TYPES = {
  'premium-color': {
    label: 'Premium Color',
    description: 'Best for illustrations — vivid, high-quality printing',
    costMultiplier: 1.0,
  },
  'standard-color': {
    label: 'Standard Color',
    description: 'Good color at a lower cost per page',
    costMultiplier: 0.7,
  },
  'black-white': {
    label: 'Black & White',
    description: 'Lowest cost — great for activity books & text-heavy books',
    costMultiplier: 0.3,
  },
};

// ============================================================
// Art Styles for Illustration Consistency
// ============================================================

export const ART_STYLES = [
  {
    id: 'cartoon',
    label: 'Cartoon',
    prompt: 'colorful cartoon illustration, bright colors, bold outlines, fun and playful, children\'s book style',
    description: 'Bold outlines, bright colors, fun and playful',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    prompt: 'soft watercolor painting, gentle colors, dreamy atmosphere, delicate brushstrokes, children\'s book illustration',
    description: 'Soft, dreamy, gentle watercolor brushstrokes',
  },
  {
    id: 'digital-art',
    label: 'Digital Art',
    prompt: 'professional digital illustration, vibrant colors, clean lines, modern children\'s book art style, detailed',
    description: 'Clean, modern, vibrant digital illustrations',
  },
  {
    id: 'flat',
    label: 'Flat Design',
    prompt: 'flat design illustration, simple shapes, bold colors, minimalist style, geometric, children\'s book art',
    description: 'Simple shapes, bold colors, minimalist',
  },
  {
    id: 'pencil-sketch',
    label: 'Pencil Sketch',
    prompt: 'detailed pencil sketch illustration, hand-drawn look, crosshatch shading, classic storybook style',
    description: 'Hand-drawn pencil sketches with shading',
  },
  {
    id: 'storybook-classic',
    label: 'Classic Storybook',
    prompt: 'classic storybook illustration, warm golden lighting, rich detailed backgrounds, traditional children\'s book art, nostalgic',
    description: 'Traditional storybook with warm, rich details',
  },
  {
    id: '3d-rendered',
    label: '3D Rendered',
    prompt: '3D rendered cartoon, Pixar-like, vibrant colors, smooth shading, adorable characters, children\'s animation style',
    description: 'Pixar-like 3D cartoon rendering',
  },
  {
    id: 'collage',
    label: 'Collage / Mixed Media',
    prompt: 'mixed media collage illustration, paper textures, layered elements, colorful, Eric Carle inspired, children\'s book art',
    description: 'Paper collage with layered textures',
  },
];

// ============================================================
// Pricing Calculator
// ============================================================

/**
 * Estimate KDP printing cost and recommended retail price
 */
export function estimateKdpPricing(pageCount, interiorType = 'premium-color', trimSize = '8.5x8.5') {
  const size = KDP_TRIM_SIZES[trimSize];
  const interior = INTERIOR_TYPES[interiorType];
  if (!size || !interior) return null;

  // KDP approximate printing costs (USD)
  const fixedCost = 0.85; // Base cost
  const perPageCost = interiorType === 'premium-color' ? 0.07
    : interiorType === 'standard-color' ? 0.04
    : 0.012;

  const printingCost = fixedCost + (pageCount * perPageCost);
  const minPrice = Math.ceil(printingCost * 2 * 100) / 100; // At least 2x markup
  const recommendedPrice = Math.ceil((printingCost * 2.5 + 1) * 100) / 100;

  // Royalty calculations (60% for expanded distribution)
  const royalty60 = (recommendedPrice * 0.6) - printingCost;
  const royaltyPerSale = Math.max(royalty60, 0);

  return {
    printingCost: printingCost.toFixed(2),
    minimumPrice: minPrice.toFixed(2),
    recommendedPrice: recommendedPrice.toFixed(2),
    royaltyPerSale: royaltyPerSale.toFixed(2),
    pageCount,
    trimSize: size.label,
    interiorType: interior.label,
  };
}

/**
 * Get recommended settings for a book type
 */
export function getRecommendations(bookType) {
  const type = BOOK_TYPES[bookType];
  if (!type) return null;

  const primarySize = type.recommendedSizes[0];
  const sizeInfo = KDP_TRIM_SIZES[primarySize];
  const recommendedPages = type.recommendedPages[Math.floor(type.recommendedPages.length / 2)];
  const pricing = estimateKdpPricing(recommendedPages, type.interiorType, primarySize);

  return {
    ...type,
    primarySize,
    sizeInfo,
    recommendedPageCount: recommendedPages,
    pricing,
  };
}
