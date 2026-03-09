/**
 * Book Genre & Category System
 * Defines all supported book categories, genres, tones, art styles, and format recommendations.
 * Used across BookWizard, AI prompts, and NicheResearch to make everything genre-aware.
 */

// ============================================================
// Top-level Book Categories
// ============================================================

export const BOOK_CATEGORIES = {
  children: {
    id: 'children',
    label: "Children's Books",
    icon: 'child_care',
    emoji: '🧒',
    description: 'Picture books, early readers, and chapter books for kids',
    defaultGenre: 'adventure',
    defaultAgeRange: '3-6',
    writingTone: 'simple, warm, engaging, and age-appropriate with clear moral lessons',
    systemRole: "You are a #1 New York Times bestselling children's book author. Create engaging, age-appropriate stories with clear lessons and character development.",
    genres: [
      { value: 'adventure', label: 'Adventure' },
      { value: 'educational', label: 'Educational' },
      { value: 'bedtime', label: 'Bedtime Story' },
      { value: 'social-skills', label: 'Social Skills' },
      { value: 'emotions', label: 'Emotions & Feelings' },
      { value: 'animals', label: 'Animals & Nature' },
      { value: 'fantasy', label: 'Fantasy' },
      { value: 'humor', label: 'Humor' },
    ],
    ageRanges: [
      { value: '0-2', label: '0–2 (Board Book)' },
      { value: '3-6', label: '3–6 (Picture Book)' },
      { value: '5-8', label: '5–8 (Early Reader)' },
      { value: '7-12', label: '7–12 (Chapter Book)' },
    ],
    recommendedBookTypes: ['picture-book', 'early-reader', 'chapter-book', 'activity-book', 'educational'],
    recommendedArtStyles: ['cartoon', 'watercolor', 'digital-art', 'flat', 'storybook-classic', '3d-rendered', 'collage', 'pencil-sketch'],
    imageStyle: "colorful children's book illustration",
    coverStyle: "professional children's book cover, vibrant colors, eye-catching, major publisher quality",
    panelLayout: null,
  },

  comic: {
    id: 'comic',
    label: 'Comic Books',
    icon: 'comic_bubble',
    emoji: '💬',
    description: 'Graphic novels, manga, and comic strips with panel layouts',
    defaultGenre: 'superhero',
    defaultAgeRange: 'all-ages',
    writingTone: 'dynamic, punchy, visual, with short sharp dialogue and dramatic action',
    systemRole: 'You are a professional comic book writer and artist. Create visually driven stories with strong panel descriptions, snappy dialogue, and cinematic action. Each page should work as a visual narrative.',
    genres: [
      { value: 'superhero', label: 'Superhero' },
      { value: 'adventure', label: 'Adventure' },
      { value: 'sci-fi', label: 'Science Fiction' },
      { value: 'fantasy', label: 'Fantasy' },
      { value: 'slice-of-life', label: 'Slice of Life' },
      { value: 'horror', label: 'Horror' },
      { value: 'mystery', label: 'Mystery' },
      { value: 'humor', label: 'Comedy' },
    ],
    ageRanges: [
      { value: 'all-ages', label: 'All Ages' },
      { value: '8-12', label: '8–12 (Kids)' },
      { value: '13-17', label: '13–17 (Teen/YA)' },
      { value: '18+', label: '18+ (Adult)' },
    ],
    recommendedBookTypes: ['comic-book', 'graphic-novel', 'manga'],
    recommendedArtStyles: ['comic-american', 'manga', 'noir-comic', 'vintage-comic', 'graphic-novel-ink', 'cartoon'],
    imageStyle: 'professional comic book page, sequential art, panel layout',
    coverStyle: 'dynamic comic book cover, bold composition, cinematic action, eye-catching typography',
    panelLayout: '5-panel', // default panel layout
  },

  fiction: {
    id: 'fiction',
    label: 'Fiction & Novels',
    icon: 'menu_book',
    emoji: '📖',
    description: 'Adult and YA fiction — thriller, romance, mystery, sci-fi, fantasy',
    defaultGenre: 'thriller',
    defaultAgeRange: 'adult',
    writingTone: 'immersive, character-driven prose with vivid descriptions, tension, and emotional depth',
    systemRole: 'You are a bestselling fiction novelist. Create compelling, immersive prose with rich characters, vivid settings, and gripping plots. Write literary-quality content that keeps readers turning pages.',
    genres: [
      { value: 'thriller', label: 'Thriller / Suspense' },
      { value: 'mystery', label: 'Mystery / Detective' },
      { value: 'romance', label: 'Romance' },
      { value: 'sci-fi', label: 'Science Fiction' },
      { value: 'fantasy', label: 'Fantasy / Epic' },
      { value: 'horror', label: 'Horror' },
      { value: 'literary', label: 'Literary Fiction' },
      { value: 'historical', label: 'Historical Fiction' },
      { value: 'ya', label: 'Young Adult (YA)' },
    ],
    ageRanges: [
      { value: 'ya', label: 'Young Adult (13–17)' },
      { value: 'adult', label: 'Adult (18+)' },
      { value: 'all-ages', label: 'All Ages' },
    ],
    recommendedBookTypes: ['fiction-novel', 'novella', 'short-story'],
    recommendedArtStyles: ['no-images', 'chapter-illustration', 'pencil-sketch', 'watercolor'],
    imageStyle: 'atmospheric literary illustration, evocative mood, professional book art',
    coverStyle: 'professional fiction novel cover, dramatic atmosphere, bestseller quality typography',
    panelLayout: null,
  },

  christian: {
    id: 'christian',
    label: 'Christian / Faith',
    icon: 'church',
    emoji: '✝️',
    description: 'Devotionals, inspirational stories, Bible-based books, and faith journeys',
    defaultGenre: 'devotional',
    defaultAgeRange: 'adult',
    writingTone: 'uplifting, faith-centred, scripturally grounded, warm, and encouraging',
    systemRole: 'You are a bestselling Christian author. Write content that is scripturally grounded, spiritually uplifting, and practically applicable to daily faith. Maintain a warm, encouraging, and biblically accurate tone.',
    genres: [
      { value: 'devotional', label: 'Devotional' },
      { value: 'inspirational', label: 'Inspirational / Testimony' },
      { value: 'bible-stories', label: 'Bible Stories' },
      { value: 'prayer', label: 'Prayer Journal' },
      { value: 'christian-fiction', label: 'Christian Fiction' },
      { value: 'apologetics', label: 'Apologetics' },
      { value: 'children-faith', label: "Children's Faith" },
      { value: 'marriage-family', label: 'Marriage & Family' },
    ],
    ageRanges: [
      { value: 'children', label: 'Children (3–12)' },
      { value: 'teen', label: 'Teen (13–17)' },
      { value: 'adult', label: 'Adult' },
      { value: 'all-ages', label: 'All Ages' },
    ],
    recommendedBookTypes: ['devotional-book', 'picture-book', 'fiction-novel', 'activity-book'],
    recommendedArtStyles: ['watercolor', 'digital-art', 'storybook-classic', 'pencil-sketch', 'no-images'],
    imageStyle: 'warm inspirational illustration, soft golden light, faith-themed, uplifting atmosphere',
    coverStyle: 'professional Christian book cover, uplifting visuals, trusted publisher quality, warm tones',
    panelLayout: null,
  },

  humor: {
    id: 'humor',
    label: 'Humor & Comedy',
    icon: 'sentiment_very_satisfied',
    emoji: '😂',
    description: 'Joke books, satire, funny stories, comedy essays, and parody',
    defaultGenre: 'general-humor',
    defaultAgeRange: 'adult',
    writingTone: 'witty, irreverent, punchy, and genuinely funny with strong comedic timing',
    systemRole: 'You are a professional comedy writer and humorist. Create genuinely funny content with impeccable timing, clever wordplay, and original jokes. Think bestselling humor authors like Terry Pratchett, David Sedaris, or Bill Bryson.',
    genres: [
      { value: 'general-humor', label: 'General Humor' },
      { value: 'satire', label: 'Satire' },
      { value: 'parody', label: 'Parody' },
      { value: 'joke-book', label: 'Joke Book' },
      { value: 'funny-stories', label: 'Funny Stories' },
      { value: 'comedy-essays', label: 'Comedy Essays' },
      { value: 'kids-humor', label: "Kids' Humor" },
    ],
    ageRanges: [
      { value: 'children', label: 'Children (5–10)' },
      { value: 'teen', label: 'Teen (13–17)' },
      { value: 'adult', label: 'Adult' },
      { value: 'all-ages', label: 'All Ages' },
    ],
    recommendedBookTypes: ['humor-book', 'picture-book', 'activity-book'],
    recommendedArtStyles: ['cartoon', 'flat', 'digital-art', 'comic-american', 'no-images'],
    imageStyle: 'funny cartoon illustration, exaggerated comedic style, vibrant and playful',
    coverStyle: 'hilarious book cover, bold humor typography, eye-catching comedic design',
    panelLayout: null,
  },

  puzzle: {
    id: 'puzzle',
    label: 'Puzzle & Activity',
    icon: 'extension',
    emoji: '🧩',
    description: 'Word searches, crosswords, sudoku, mazes, trivia, and activity books',
    defaultGenre: 'mixed-puzzles',
    defaultAgeRange: 'adult',
    writingTone: 'clear, instructional, and engaging with appropriate difficulty progression',
    systemRole: 'You are an expert puzzle book creator. Design engaging, correctly solvable puzzles with clear instructions, appropriate difficulty levels, and organized layouts. Ensure all puzzles are accurate and enjoyable.',
    genres: [
      { value: 'word-search', label: 'Word Search' },
      { value: 'crossword', label: 'Crossword Puzzles' },
      { value: 'sudoku', label: 'Sudoku' },
      { value: 'mazes', label: 'Mazes' },
      { value: 'trivia', label: 'Trivia Quizzes' },
      { value: 'mixed-puzzles', label: 'Mixed Puzzles' },
      { value: 'logic-puzzles', label: 'Logic Puzzles' },
      { value: 'coloring', label: 'Coloring / Activity' },
    ],
    ageRanges: [
      { value: 'children', label: 'Children (4–8)' },
      { value: 'kids', label: 'Kids (8–12)' },
      { value: 'teen', label: 'Teen (13–17)' },
      { value: 'adult', label: 'Adult' },
      { value: 'senior', label: 'Senior / Brain Training' },
    ],
    recommendedBookTypes: ['activity-book', 'puzzle-book'],
    recommendedArtStyles: ['flat', 'no-images', 'pencil-sketch', 'digital-art'],
    imageStyle: 'clean puzzle/activity page design, crisp black and white, clear layout',
    coverStyle: 'engaging puzzle book cover, clean design, clear title, inviting and fun',
    panelLayout: null,
  },
};

// ============================================================
// Comic Panel Layout Options
// ============================================================

export const COMIC_PANEL_LAYOUTS = {
  '5-panel': {
    id: '5-panel',
    label: '5-Panel Classic',
    description: '2 top + 1 hero + 2 bottom — standard comic page',
    prompt: `5-panel comic page arranged as:
[Panel 1] [Panel 2] — top row, 2 equal panels
[    Panel 3      ] — middle row, 1 large cinematic hero panel
[Panel 4] [Panel 5] — bottom row, 2 equal panels
Solid black panel borders with clean white gutters between panels. Each panel clearly separated and distinct.`,
  },
  '6-grid': {
    id: '6-grid',
    label: '6-Panel Grid',
    description: 'Uniform 2×3 grid layout',
    prompt: `6-panel comic page in a uniform 2×3 grid layout:
[Panel 1] [Panel 2]
[Panel 3] [Panel 4]
[Panel 5] [Panel 6]
Equal-sized panels with solid black borders and white gutters.`,
  },
  'splash': {
    id: 'splash',
    label: 'Splash Page',
    description: 'Single full-page dramatic illustration',
    prompt: `Full-page splash panel — single dramatic illustration taking up the entire page with a large banner title/caption box at top or bottom. No panel borders dividing the page. Epic composition filling all available space.`,
  },
  'manga-style': {
    id: 'manga-style',
    label: 'Manga Layout',
    description: 'Asymmetric manga-style panel arrangement',
    prompt: `Manga-style page layout with asymmetric panel arrangement:
One large vertical panel on the left spanning full height.
Three smaller panels stacked on the right.
Dynamic, asymmetric composition with speed lines and emotion effects. Read right-to-left manga convention.`,
  },
};

// ============================================================
// Comic Art Styles (extends kdpFormats ART_STYLES)
// ============================================================

export const COMIC_ART_STYLES = [
  {
    id: 'comic-american',
    label: 'American Comics',
    prompt: 'contemporary American superhero comic style, bold vibrant colors, dynamic heroic poses, detailed muscular anatomy, cinematic action scenes, modern digital art, clean bold line work',
    description: 'Bold superhero style, vibrant colors, dynamic poses',
  },
  {
    id: 'manga',
    label: 'Manga',
    prompt: 'Japanese manga style, clean precise black linework, screen tone shading, expressive large eyes, dynamic speed lines, black and white with selective color impact effects, professional manga quality',
    description: 'Japanese manga style, black and white, speed lines',
  },
  {
    id: 'noir-comic',
    label: 'Noir',
    prompt: 'film noir comic style, high contrast black and white, deep dramatic shadows, 1940s detective aesthetic, heavy bold inking, moody atmospheric lighting, rain-slicked streets',
    description: 'High contrast B&W, moody shadows, 1940s detective',
  },
  {
    id: 'vintage-comic',
    label: 'Vintage / Golden Age',
    prompt: 'Golden Age 1950s comic style, visible halftone Ben-Day dots, limited retro color palette, classic adventure comic aesthetic, nostalgic warm tones, bold outlines',
    description: 'Retro 1950s style with halftone dots',
  },
  {
    id: 'graphic-novel-ink',
    label: 'Graphic Novel Ink',
    prompt: 'European BD graphic novel style, detailed pen and ink illustration, sophisticated adult storytelling aesthetic, semi-realistic characters, rich detailed environments, professional book illustration',
    description: 'Detailed ink illustration, European graphic novel style',
  },
];

// ============================================================
// Helpers
// ============================================================

/**
 * Get category config by ID, with fallback to children
 */
export function getCategoryConfig(categoryId) {
  return BOOK_CATEGORIES[categoryId] || BOOK_CATEGORIES.children;
}

/**
 * Get whether a category uses images at all
 */
export function categoryUsesImages(categoryId) {
  // puzzle books do not use per-page images
  return !['puzzle'].includes(categoryId);
}

/**
 * Get panel layout config
 */
export function getPanelLayout(layoutId) {
  return COMIC_PANEL_LAYOUTS[layoutId] || COMIC_PANEL_LAYOUTS['5-panel'];
}

/**
 * Get the system role instruction for a book category
 */
export function getSystemRole(categoryId) {
  return getCategoryConfig(categoryId).systemRole;
}

/**
 * Get page/section terminology for a category
 */
export function getPageTerminology(categoryId) {
  switch (categoryId) {
    case 'comic': return { page: 'Page', section: 'Panel', plural: 'Pages', outline: 'Script' };
    case 'fiction': return { page: 'Chapter', section: 'Scene', plural: 'Chapters', outline: 'Outline' };
    case 'puzzle': return { page: 'Activity', section: 'Puzzle', plural: 'Activities', outline: 'Contents' };
    default: return { page: 'Page', section: 'Page', plural: 'Pages', outline: 'Outline' };
  }
}
