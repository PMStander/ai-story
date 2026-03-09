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
  // ── Children's ──────────────────────────────────────────
  'picture-book': {
    label: 'Picture Book',
    icon: 'auto_stories',
    category: 'children',
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
    category: 'children',
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
    category: 'children',
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
    category: 'children',
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
    category: 'children',
    description: 'Learning-focused with facts and illustrations (ages 4–10)',
    recommendedSizes: ['8.5x11', '8x10', '7x10'],
    recommendedPages: [32, 48, 64],
    interiorType: 'premium-color',
    priceRange: '$9.99 – $16.99',
    wordsPerPage: '30-80',
    totalWordRange: '1000-5000',
  },

  // ── Comic ────────────────────────────────────────────────
  'comic-book': {
    label: 'Comic Book',
    icon: 'comic_bubble',
    category: 'comic',
    description: 'Sequential art with panels, speech bubbles, and page layouts',
    recommendedSizes: ['6.625x10.25', '6x9', '8.5x11'],
    recommendedPages: [24, 32, 48, 64],
    interiorType: 'premium-color',
    priceRange: '$9.99 – $19.99',
    wordsPerPage: '20-80',
    totalWordRange: '500-3000',
  },
  'graphic-novel': {
    label: 'Graphic Novel',
    icon: 'auto_stories',
    category: 'comic',
    description: 'Long-form comic storytelling, standalone complete narrative',
    recommendedSizes: ['6x9', '6.625x10.25', '8x10'],
    recommendedPages: [80, 100, 128, 160, 200],
    interiorType: 'premium-color',
    priceRange: '$14.99 – $24.99',
    wordsPerPage: '20-100',
    totalWordRange: '2000-8000',
  },
  'manga': {
    label: 'Manga',
    icon: 'import_contacts',
    category: 'comic',
    description: 'Japanese-style comic with right-to-left reading and manga art',
    recommendedSizes: ['5x7.5', '5.5x8.5', '6x9'],
    recommendedPages: [180, 200, 220],
    interiorType: 'black-white',
    priceRange: '$9.99 – $14.99',
    wordsPerPage: '20-60',
    totalWordRange: '2000-6000',
  },

  // ── Fiction ──────────────────────────────────────────────
  'fiction-novel': {
    label: 'Fiction Novel',
    icon: 'menu_book',
    category: 'fiction',
    description: 'Full-length storytelling — thriller, romance, sci-fi, fantasy',
    recommendedSizes: ['5x8', '5.5x8.5', '6x9'],
    recommendedPages: [200, 250, 300, 350, 400],
    interiorType: 'black-white',
    priceRange: '$9.99 – $16.99',
    wordsPerPage: '250-350',
    totalWordRange: '50000-100000',
  },
  'novella': {
    label: 'Novella',
    icon: 'book',
    category: 'fiction',
    description: 'Mid-length fiction, longer than a short story',
    recommendedSizes: ['5x8', '5.5x8.5', '6x9'],
    recommendedPages: [80, 100, 128, 160],
    interiorType: 'black-white',
    priceRange: '$7.99 – $12.99',
    wordsPerPage: '250-350',
    totalWordRange: '20000-50000',
  },
  'short-story': {
    label: 'Short Story Collection',
    icon: 'description',
    category: 'fiction',
    description: 'Collection of short fiction pieces',
    recommendedSizes: ['5x8', '5.5x8.5', '6x9'],
    recommendedPages: [80, 100, 128],
    interiorType: 'black-white',
    priceRange: '$8.99 – $13.99',
    wordsPerPage: '250-350',
    totalWordRange: '15000-40000',
  },

  // ── Christian / Faith ────────────────────────────────────
  'devotional-book': {
    label: 'Devotional / Inspirational',
    icon: 'church',
    category: 'christian',
    description: 'Daily devotions, scripture reflections, prayer guides',
    recommendedSizes: ['5.5x8.5', '6x9', '5x8'],
    recommendedPages: [90, 120, 150, 180, 366],
    interiorType: 'black-white',
    priceRange: '$10.99 – $18.99',
    wordsPerPage: '200-400',
    totalWordRange: '20000-60000',
  },

  // ── Humor ────────────────────────────────────────────────
  'humor-book': {
    label: 'Humor / Comedy Book',
    icon: 'sentiment_very_satisfied',
    category: 'humor',
    description: 'Joke books, satire, funny essays, and parody',
    recommendedSizes: ['5x8', '5.5x8.5', '6x9', '8.5x8.5'],
    recommendedPages: [80, 100, 128, 160],
    interiorType: 'black-white',
    priceRange: '$8.99 – $14.99',
    wordsPerPage: '50-200',
    totalWordRange: '5000-25000',
  },

  // ── Puzzle ───────────────────────────────────────────────
  'puzzle-book': {
    label: 'Puzzle Book',
    icon: 'extension',
    category: 'puzzle',
    description: 'Word searches, crosswords, sudoku, mazes, and logic puzzles',
    recommendedSizes: ['8.5x11', '8.5x8.5', '8x10'],
    recommendedPages: [80, 100, 120, 150, 200],
    interiorType: 'black-white',
    priceRange: '$6.99 – $12.99',
    wordsPerPage: '5-30',
    totalWordRange: '500-3000',
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
  // ── General / Children's styles ─────────────────────────
  {
    id: 'cartoon',
    label: 'Cartoon',
    prompt: 'colorful cartoon illustration, bright colors, bold outlines, fun and playful style',
    description: 'Bold outlines, bright colors, fun and playful',
    categories: ['children', 'humor', 'comic'],
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    prompt: 'soft watercolor painting, gentle colors, dreamy atmosphere, delicate brushstrokes, painterly illustration',
    description: 'Soft, dreamy, gentle watercolor brushstrokes',
    categories: ['children', 'christian', 'fiction'],
  },
  {
    id: 'digital-art',
    label: 'Digital Art',
    prompt: 'professional digital illustration, vibrant colors, clean lines, modern art style, detailed rendering',
    description: 'Clean, modern, vibrant digital illustrations',
    categories: ['children', 'fiction', 'christian', 'humor', 'puzzle'],
  },
  {
    id: 'flat',
    label: 'Flat Design',
    prompt: 'flat design illustration, simple geometric shapes, bold colors, minimalist style, clean vectors',
    description: 'Simple shapes, bold colors, minimalist',
    categories: ['children', 'humor', 'puzzle'],
  },
  {
    id: 'pencil-sketch',
    label: 'Pencil Sketch',
    prompt: 'detailed pencil sketch illustration, hand-drawn look, crosshatch shading, classic storybook style, fine line art',
    description: 'Hand-drawn pencil sketches with shading',
    categories: ['children', 'fiction', 'christian'],
  },
  {
    id: 'storybook-classic',
    label: 'Classic Storybook',
    prompt: 'classic storybook illustration, warm golden lighting, rich detailed backgrounds, traditional illustrated book art, nostalgic',
    description: 'Traditional storybook with warm, rich details',
    categories: ['children', 'christian'],
  },
  {
    id: '3d-rendered',
    label: '3D Rendered',
    prompt: '3D rendered cartoon, Pixar-like style, vibrant colors, smooth shading, expressive characters, animation quality',
    description: 'Pixar-like 3D cartoon rendering',
    categories: ['children', 'humor'],
  },
  {
    id: 'collage',
    label: 'Collage / Mixed Media',
    prompt: 'mixed media collage illustration, paper textures, layered elements, colorful, Eric Carle inspired',
    description: 'Paper collage with layered textures',
    categories: ['children'],
  },

  // ── Comic styles ─────────────────────────────────────────
  {
    id: 'comic-american',
    label: 'American Comics',
    prompt: 'contemporary American superhero comic style, bold vibrant colors, dynamic heroic poses, detailed anatomy, cinematic action scenes, modern digital art',
    description: 'Bold superhero style, vibrant colors, dynamic',
    categories: ['comic'],
  },
  {
    id: 'manga',
    label: 'Manga',
    prompt: 'Japanese manga style, clean precise black linework, screen tone shading, expressive eyes, speed lines, professional manga quality',
    description: 'Japanese manga, black and white with speed lines',
    categories: ['comic'],
  },
  {
    id: 'noir-comic',
    label: 'Noir',
    prompt: 'film noir comic style, high contrast black and white, deep dramatic shadows, 1940s detective aesthetic, heavy bold inking, moody atmospheric lighting',
    description: 'High contrast B&W, dramatic shadows, 1940s',
    categories: ['comic', 'fiction'],
  },
  {
    id: 'vintage-comic',
    label: 'Vintage / Golden Age',
    prompt: 'Golden Age 1950s comic style, visible halftone Ben-Day dots, limited retro color palette, classic adventure aesthetic, bold outlines',
    description: 'Retro 1950s style with halftone dots',
    categories: ['comic'],
  },
  {
    id: 'graphic-novel-ink',
    label: 'Graphic Novel Ink',
    prompt: 'European BD graphic novel style, detailed pen and ink illustration, sophisticated storytelling aesthetic, semi-realistic characters, rich detailed environments',
    description: 'Detailed ink illustration, European graphic novel',
    categories: ['comic', 'fiction'],
  },

  // ── Fiction / Prose styles ────────────────────────────────
  {
    id: 'chapter-illustration',
    label: 'Chapter Illustration',
    prompt: 'atmospheric literary chapter illustration, decorative vignette style, evocative mood, classic novel illustration, detailed pen work',
    description: 'Classic literary illustration for chapter openers',
    categories: ['fiction', 'christian', 'humor'],
  },
  {
    id: 'no-images',
    label: 'Text Only (No Images)',
    prompt: '',
    description: 'Pure text — no illustrations generated',
    categories: ['fiction', 'christian', 'humor', 'puzzle'],
    textOnly: true,
  },
];

/**
 * Get art styles filtered by book category
 */
export function getArtStylesForCategory(categoryId) {
  return ART_STYLES.filter(s => !s.categories || s.categories.includes(categoryId));
}

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
