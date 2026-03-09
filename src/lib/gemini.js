import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCategoryConfig, getPanelLayout } from "./bookGenres";
import { generateCrossword, generateWordSearch } from "./puzzleEngine";
import { renderCrossword, renderWordSearch, svgToDataUrl } from "./puzzleRenderer";

/**
 * Creates a Gemini client using the user's API key.
 * All AI calls happen client-side using the user's own key (BYOK model).
 */
export function createGeminiClient(apiKey) {
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate text using Gemini Pro
 */
export async function generateText(apiKey, prompt, systemInstruction = "") {
  const genAI = createGeminiClient(apiKey);
  if (!genAI) throw new Error("No Gemini API key configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    ...(systemInstruction && { systemInstruction }),
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate text with chat history (multi-turn)
 */
export async function chat(apiKey, history, message, systemInstruction = "") {
  const genAI = createGeminiClient(apiKey);
  if (!genAI) throw new Error("No Gemini API key configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    ...(systemInstruction && { systemInstruction }),
  });

  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessage(message);
  return result.response.text();
}

/**
 * Generate a children's book outline
 */
/**
 * Generate a book outline (genre-aware)
 * @param {string} apiKey
 * @param {{ topic, genre, targetAge, pageCount, bookCategory }} opts
 */
export async function generateOutline(apiKey, { topic, genre, targetAge, pageCount = 16, bookCategory = 'children' }) {
  const catConfig = getCategoryConfig(bookCategory);

  let prompt;
  if (bookCategory === 'comic') {
    prompt = `Write a comic book script outline for "${topic}" — genre: ${genre}.
Include ${pageCount} pages, each with 5 panels.

For each page, provide:
1. pageNumber
2. sceneDescription — what the overall page depicts
3. text — a brief summary of the 5 panels' dialogue/action

Return as JSON array: [{ pageNumber, sceneDescription, text }]`;
  } else if (bookCategory === 'fiction') {
    prompt = `Write a fiction book chapter outline for "${topic}" — genre: ${genre}, audience: ${targetAge}.
Include ${pageCount} chapters.

For each chapter:
1. pageNumber (chapter number)
2. sceneDescription — chapter summary and key events
3. text — opening paragraph of the chapter

Return as JSON array: [{ pageNumber, sceneDescription, text }]`;
  } else if (bookCategory === 'christian') {
    prompt = `Write a Christian ${genre} book outline for "${topic}" — audience: ${targetAge}.
Include ${pageCount} sections/devotions.

For each section:
1. pageNumber
2. sceneDescription — scripture reference and theme of the section
3. text — the opening reflection or devotional text

Return as JSON array: [{ pageNumber, sceneDescription, text }]`;
  } else if (bookCategory === 'puzzle') {
    prompt = `Create a puzzle book plan for "${topic}" — type: ${genre}, audience: ${targetAge}.
Include ${pageCount} activities/puzzles.

For each puzzle:
1. pageNumber
2. sceneDescription — describe the puzzle type and topic
3. text — the instructions for this puzzle

Return as JSON array: [{ pageNumber, sceneDescription, text }]`;
  } else if (bookCategory === 'humor') {
    prompt = `Write a humor book outline for "${topic}" — style: ${genre}, audience: ${targetAge}.
Include ${pageCount} sections.

For each section:
1. pageNumber
2. sceneDescription — describe what this comedy section covers
3. text — the opening joke or funny observation

Return as JSON array: [{ pageNumber, sceneDescription, text }]`;
  } else {
    // default: children's
    prompt = `Write a children's book outline about "${topic}" for ages ${targetAge}.
Include ${pageCount} pages with simple text, a clear lesson, and engaging scenes that work well as illustrations.

For each page:
1. pageNumber
2. sceneDescription — what the illustration should show
3. text — the story text for this page (2-3 simple sentences)

Genre: ${genre}

Return as JSON array: [{ pageNumber, sceneDescription, text }]`;
  }

  const text = await generateText(apiKey, prompt, catConfig.systemRole + ' Always return valid JSON.');
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(text);
}

/**
 * Suggest the next sentence for story continuation
 */
export async function suggestNextSentence(apiKey, currentText, context = "") {
  const prompt = `Continue this children's book story naturally. Write exactly 1-2 sentences that flow from the current text:

${context ? `Context: ${context}\n\n` : ""}Current text:
"${currentText}"

Write ONLY the continuation, no explanations.`;

  return generateText(apiKey, prompt, "You are a children's book author. Write in simple, engaging language for young children.");
}

/**
 * Generate an image using Imagen via the new @google/genai SDK
 * Uses Imagen 4 (latest) with fallback to Imagen 3
 */
export async function generateImage(apiKey, prompt, { style = "colorful children's book illustration", aspectRatio = "1:1" } = {}) {
  if (!apiKey) throw new Error("No Gemini API key configured");

  // Use the new @google/genai SDK for image generation
  const { GoogleGenAI } = await import("@google/genai");
  const genAI = new GoogleGenAI({ apiKey });

  const fullPrompt = `${style}, ${prompt}`;

  // Try Imagen 4 first, fall back to Imagen 3
  const models = ["imagen-4.0-generate-001", "imagen-3.0-generate-002"];

  for (const model of models) {
    try {
      const result = await genAI.models.generateImages({
        model,
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio,
        },
      });

      if (result.generatedImages && result.generatedImages.length > 0) {
        const imageBytes = result.generatedImages[0].image?.imageBytes;
        if (imageBytes) {
          return `data:image/png;base64,${imageBytes}`;
        }
      }
    } catch (err) {
      console.warn(`Image generation with ${model} failed:`, err.message);
      // Try next model
      continue;
    }
  }

  throw new Error("Image generation failed with all available models");
}

/**
 * Generate text embeddings for vector search
 */
export async function generateEmbedding(apiKey, text) {
  const genAI = createGeminiClient(apiKey);
  if (!genAI) throw new Error("No Gemini API key configured");

  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Research a niche using Gemini with Google Search grounding
 */
/**
 * Research a niche (genre-aware)
 */
export async function researchNiche(apiKey, topic, bookCategory = 'children') {
  const catConfig = getCategoryConfig(bookCategory);
  const marketLabel = bookCategory === 'children' ? "Amazon KDP children's book" : `Amazon KDP ${catConfig.label}`;

  const prompt = `Research the ${marketLabel} market for the topic: "${topic}"

Analyze and return a JSON object with:
{
  "keywords": [
    {
      "keyword": "exact keyword phrase",
      "estimatedVolume": "monthly search estimate",
      "competition": "Low|Medium|High",
      "trend": "up|stable|down",
      "score": 0-100
    }
  ],
  "insights": "Brief market analysis paragraph",
  "recommendation": "Should the user pursue this niche? Why?"
}

Focus on keywords people actually search for on Amazon. Include 5-8 keywords.`;

  const genAI = createGeminiClient(apiKey);
  if (!genAI) throw new Error("No Gemini API key configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `You are an Amazon KDP market research expert specialising in ${catConfig.label}. Always return valid JSON.`,
    tools: [{ googleSearch: {} }],
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(text);
}

/**
 * Generate social media content for book promotion
 */
/**
 * Generate social media content for book promotion (genre-aware)
 */
export async function generateSocialPost(apiKey, { bookTitle, platform, topic, bookCategory = 'children' }) {
  const catConfig = getCategoryConfig(bookCategory);
  const bookTypeLabel = catConfig.label;

  const prompt = `Write a ${platform} post promoting a ${bookTypeLabel} called "${bookTitle}" about ${topic}.

Include:
- Engaging hook tailored for ${bookTypeLabel} readers
- Key benefits for the target audience
- Call to action
- Relevant hashtags

Platform style: ${platform === 'TikTok' ? 'casual, trendy, use emoji' : platform === 'Instagram' ? 'visual description, use emoji sparingly' : 'professional, concise'}`;

  return generateText(apiKey, prompt, `You are a social media marketing expert for ${bookTypeLabel} authors.`);
}

/**
 * Validate an API key by making a simple test call
 */
export async function validateApiKey(apiKey) {
  try {
    const genAI = createGeminiClient(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    await model.generateContent("Say 'ok' in one word.");
    return { valid: true, error: null };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

// ============================================================
// Deep Research — Comprehensive Niche Intelligence
// ============================================================

/**
 * Deep research a niche with bestseller analytics, page counts, pricing,
 * and actionable insights about why top books sell well.
 */
/**
 * Deep research a niche with bestseller analytics (genre-aware)
 */
export async function deepResearchNiche(apiKey, topic, bookCategory = 'children') {
  const catConfig = getCategoryConfig(bookCategory);
  const marketLabel = bookCategory === 'children' ? "Amazon KDP children's book" : `Amazon KDP ${catConfig.label}`;

  const prompt = `You are an expert ${marketLabel} market analyst. Conduct a DEEP analysis of the niche: "${topic}"

Research and return a comprehensive JSON object:
{
  "keywords": [
    {
      "keyword": "exact search phrase used on Amazon",
      "estimatedVolume": "High|Medium|Low",
      "competition": "Low|Medium|High",
      "trend": "up|stable|down",
      "score": 0-100,
      "suggestedTitle": "A specific book title idea using this keyword"
    }
  ],
  "bestsellers": [
    {
      "title": "Actual bestselling book title in this niche",
      "author": "Author name",
      "estimatedRating": 4.5,
      "estimatedReviews": "1000+",
      "pageCount": 200,
      "priceRange": "$9.99-$16.99",
      "whyItSells": "2-3 sentence analysis of why this book succeeds",
      "lessonsForCreators": "What to learn from this book's success"
    }
  ],
  "analytics": {
    "avgPageCount": 200,
    "pageCountRange": "150-350",
    "mostCommonPageCounts": [200, 250, 300],
    "avgPrice": "$12.99",
    "priceSwetSpot": "$9.99-$16.99",
    "avgRating": 4.5,
    "topCategories": ["Category name"],
    "marketSize": "Large|Medium|Small",
    "growthRate": "Growing|Stable|Declining",
    "seasonality": "Year-round or seasonal pattern"
  },
  "contentGaps": [
    {
      "gap": "Description of an underserved angle in this niche",
      "opportunity": "How you could fill this gap",
      "difficulty": "Easy|Medium|Hard",
      "potentialScore": 0-100
    }
  ],
  "seriesStrategy": {
    "recommended": true,
    "suggestedSeriesName": "A catchy series name",
    "bookIdeas": ["Book 1 idea", "Book 2 idea", "Book 3 idea"],
    "rationale": "Why a series works in this niche"
  },
  "insights": "Comprehensive market analysis (3-4 sentences)",
  "recommendation": "Clear recommendation with action steps"
}

Include 5-8 keywords, 3-5 bestsellers with REAL book titles (use Google Search to find actual top sellers about ${topic} in the ${catConfig.label} category), 3-5 content gaps. Be specific and actionable.`;

  const genAI = createGeminiClient(apiKey);
  if (!genAI) throw new Error("No Gemini API key configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `You are a world-class Amazon KDP market research analyst specialising in ${catConfig.label}. Use Google Search to find real bestselling book data. Always return valid JSON.`,
    tools: [{ googleSearch: {} }],
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(text);
}

// ============================================================
// Full Book Generation
// ============================================================

/**
 * Generate complete book content — all pages in one call
 */
/**
 * Build a comic page prompt with multi-panel layout (adapted from make-comics techniques).
 * Creates 5-panel page with character consistency and speech bubble rules.
 */
export function buildComicPagePrompt({
  pageDescription,
  panelLayout = '5-panel',
  artStylePrompt,
  characterDesc = '',
  genre = 'adventure',
  isContinuation = false,
  previousContext = '',
}) {
  const layout = getPanelLayout(panelLayout);

  let continuationContext = '';
  if (isContinuation && previousContext) {
    continuationContext = `\nSTORY CONTINUATION:\nPrevious page showed: ${previousContext}\nMaintain visual consistency. Continue the narrative naturally.\n`;
  }

  let characterSection = '';
  if (characterDesc) {
    characterSection = `\nCHARACTER CONSISTENCY (CRITICAL):\n- REFERENCE DESCRIPTION: ${characterDesc}\n- The character must look IDENTICAL across ALL panels — same face, hair, eyes, skin tone, clothing\n- Apply art style to poses/action but maintain consistent facial appearance\n- NO variation in character design between panels`;
  }

  return `Professional comic book page illustration. Genre: ${genre}.
${continuationContext}
PAGE LAYOUT:
${layout.prompt}

TEXT AND LETTERING (CRITICAL):
- All text in speech bubbles must be PERFECTLY CLEAR, LEGIBLE, and correctly spelled
- Use bold clean comic book lettering, large and easy to read
- Speech bubbles: crisp white fill, solid black outline, pointed tail toward speaker
- Keep dialogue SHORT: maximum 1-2 sentences per bubble
- NO blurry, warped, or unreadable text
${characterSection}

ART STYLE:
${artStylePrompt || 'professional comic book art, dynamic compositions, bold inking'}

COMPOSITION:
- Vary camera angles across panels: close-up, medium shot, wide establishing shot
- Natural visual flow: left-to-right, top-to-bottom reading order
- Dynamic character poses with clear expressive acting
- Detailed backgrounds matching the scene and mood

PAGE CONTENT:
${pageDescription}`;
}

/**
 * Generate complete book content (genre-aware) — all pages in one call
 */
export async function generateFullBookContent(apiKey, { topic, genre, targetAge, pageCount, bookType, synopsis, bookCategory = 'children' }) {
  const catConfig = getCategoryConfig(bookCategory);

  let prompt;

  if (bookCategory === 'comic') {
    const pageCountN = pageCount || 24;
    prompt = `Create a complete comic book script for "${topic}".
Genre: ${genre || 'adventure'}\nAudience: ${targetAge || 'all-ages'}\nTotal pages: ${pageCountN}
${synopsis ? `Synopsis: ${synopsis}` : ''}

For EACH page, provide a 5-panel script:
1. pageNumber (1 to ${pageCountN})
2. text — the combined dialogue/captions across all 5 panels (keep each line of dialogue short)
3. sceneDescription — overall scene setting for the page
4. illustrationNotes — panel-by-panel action description: Panel 1: ..., Panel 2: ..., Panel 3: ..., Panel 4: ..., Panel 5: ...

Return as JSON:
{
  "title": "The comic title",
  "mainCharacter": { "name": "Name", "description": "visual appearance for consistency", "traits": [] },
  "lesson": "The story theme",
  "pages": [{ "pageNumber": 1, "text": "...", "sceneDescription": "...", "illustrationNotes": "..." }]
}`;

  } else if (bookCategory === 'fiction') {
    const chapterCount = pageCount || 12;
    prompt = `Create a complete ${genre || 'thriller'} fiction outline with opening prose for "${topic}".
Audience: ${targetAge || 'adult'}\nTotal chapters: ${chapterCount}
${synopsis ? `Synopsis: ${synopsis}` : ''}

For EACH chapter:
1. pageNumber (chapter number)
2. text — the opening 2-3 paragraphs of this chapter (300-500 words of real prose)
3. sceneDescription — chapter summary and key plot events
4. illustrationNotes — optional chapter heading illustration concept

Return as JSON:
{
  "title": "The novel title",
  "mainCharacter": { "name": "Name", "description": "character description", "traits": [] },
  "lesson": "The central theme",
  "pages": [{ "pageNumber": 1, "text": "...", "sceneDescription": "...", "illustrationNotes": "..." }]
}`;

  } else if (bookCategory === 'christian') {
    const sectionCount = pageCount || 30;
    prompt = `Create a complete Christian ${genre || 'devotional'} for "${topic}".
Audience: ${targetAge || 'adult'}\nTotal sections: ${sectionCount}
${synopsis ? `Theme: ${synopsis}` : ''}

For EACH section/devotion:
1. pageNumber
2. text — the full devotional content (opening scripture, reflection, application, prayer — 200-400 words)
3. sceneDescription — the theme and key scripture reference
4. illustrationNotes — optional illustration concept (or leave empty for text-only)

Return as JSON:
{
  "title": "The book title",
  "mainCharacter": { "name": "None", "description": "", "traits": [] },
  "lesson": "The spiritual theme",
  "pages": [{ "pageNumber": 1, "text": "...", "sceneDescription": "...", "illustrationNotes": "..." }]
}`;

  } else if (bookCategory === 'humor') {
    const sectionCount = pageCount || 50;
    prompt = `Create a complete ${genre || 'general-humor'} humor book for "${topic}".
Audience: ${targetAge || 'adult'}\nTotal jokes/sections: ${sectionCount}
${synopsis ? `Premise: ${synopsis}` : ''}

For EACH section:
1. pageNumber
2. text — the joke, anecdote, or funny content (50-200 words, make it genuinely funny)
3. sceneDescription — what this comedy bit is about
4. illustrationNotes — optional cartoon illustration concept

Return as JSON:
{
  "title": "The book title",
  "mainCharacter": { "name": "None", "description": "", "traits": [] },
  "lesson": "The comedy premise",
  "pages": [{ "pageNumber": 1, "text": "...", "sceneDescription": "...", "illustrationNotes": "..." }]
}`;

  } else if (bookCategory === 'puzzle') {
    // Puzzle books use a dedicated generation path — see generatePuzzleBook()
    // This branch returns a lightweight scaffold; actual grid generation happens in generatePuzzleBook
    const puzzleCount = pageCount || 20;
    prompt = `Create a puzzle book plan for "${topic}".
Puzzle type: ${genre || 'mixed-puzzles'}\nAudience: ${targetAge || 'adult'}\nTotal puzzles: ${puzzleCount}
${synopsis ? `Theme: ${synopsis}` : ''}

Return a JSON object with:
{
  "title": "Catchy puzzle book title",
  "mainCharacter": { "name": "None", "description": "", "traits": [] },
  "lesson": "Short tagline for the puzzle book",
  "theme": "${topic}",
  "puzzleType": "${genre || 'crossword'}",
  "pages": []
}
Do NOT generate puzzle content in pages — leave pages as empty array.`;
  } else if (bookCategory === '_puzzle_direct') {

  } else {
    // default: children's
    const wordRange = bookType === 'picture-book' ? '15-30 words' : '3-5 sentences, 30-60 words';
    prompt = `Create a complete children's ${bookType || 'picture book'} about "${topic}" for ages ${targetAge || '3-6'}.
Genre: ${genre || 'adventure'}
Total pages: ${pageCount || 32}
${synopsis ? `Synopsis: ${synopsis}` : ''}

For EACH page:
1. pageNumber (1 to ${pageCount || 32})
2. text — the story text for this page (${wordRange})
3. sceneDescription — detailed description of the illustration
4. illustrationNotes — art direction (mood, lighting, composition, camera angle)

The story should have a clear beginning, middle, and end, a memorable main character, an engaging conflict, a clear moral, and age-appropriate vocabulary.

Return as JSON:
{
  "title": "The book title",
  "mainCharacter": { "name": "Name", "description": "physical appearance for consistent illustrations", "traits": [] },
  "lesson": "The key lesson/moral",
  "pages": [{ "pageNumber": 1, "text": "...", "sceneDescription": "...", "illustrationNotes": "..." }]
}`;
  }

  const text = await generateText(apiKey, prompt, catConfig.systemRole + ' Always return valid JSON.');
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(text);
}

/**
 * Build a style prompt prefix from a style guide for consistent illustrations
 */
export function buildStylePrompt(styleGuide) {
  if (!styleGuide) return '';
  const parts = [];

  if (styleGuide.artStyle) {
    parts.push(styleGuide.artStyle);
  }
  if (styleGuide.colorPalette) {
    parts.push(`Color palette: ${styleGuide.colorPalette}`);
  }
  if (styleGuide.characters && styleGuide.characters.length > 0) {
    const charDescs = styleGuide.characters
      .map(c => `${c.name}: ${c.visualDescription}`)
      .join('. ');
    parts.push(`Characters: ${charDescs}`);
  }
  if (styleGuide.environmentRules) {
    parts.push(`Setting: ${styleGuide.environmentRules}`);
  }
  if (styleGuide.additionalRules) {
    parts.push(styleGuide.additionalRules);
  }

  return parts.join('. ') + '. ';
}

/**
 * Generate illustrations with style consistency across all pages
 * Returns an async generator that yields results one at a time for progress tracking
 */
/**
 * Generate illustrations with style consistency across all pages.
 * Skips text-only art styles. For comics uses buildComicPagePrompt.
 * Returns async generator that yields one result per page for progress tracking.
 */
export async function* generateConsistentIllustrations(apiKey, pages, styleGuide, options = {}) {
  const { aspectRatio = '1:1', bookCategory = 'children', panelLayout = '5-panel' } = options;

  // Skip illustration generation for text-only styles
  if (styleGuide?.textOnly) {
    return;
  }

  const stylePrefix = buildStylePrompt(styleGuide);

  for (const page of pages) {
    try {
      let fullPrompt;

      if (bookCategory === 'comic') {
        // Use comic panel layout prompt
        fullPrompt = buildComicPagePrompt({
          pageDescription: page.illustrationNotes || page.sceneDescription,
          panelLayout,
          artStylePrompt: styleGuide?.artStyle,
          characterDesc: styleGuide?.characters?.[0]?.visualDescription || '',
          genre: styleGuide?.genre || 'adventure',
          isContinuation: page.pageNumber > 1,
          previousContext: page.previousContext || '',
        });
      } else {
        fullPrompt = `${stylePrefix}${page.sceneDescription}${page.illustrationNotes ? '. ' + page.illustrationNotes : ''}`;
      }

      const dataUrl = await generateImage(apiKey, fullPrompt, {
        style: styleGuide?.artStyle || "professional book illustration",
        aspectRatio,
      });
      yield {
        pageNumber: page.pageNumber,
        status: 'success',
        imageUrl: dataUrl,
        prompt: fullPrompt,
      };
    } catch (err) {
      yield {
        pageNumber: page.pageNumber,
        status: 'error',
        error: err.message,
      };
    }
  }
}

/**
 * Generate a book cover
 */
/**
 * Generate a book cover (genre-aware)
 */
export async function generateBookCover(apiKey, { title, author, synopsis, style, trimSize, bookCategory = 'children' }) {
  const catConfig = getCategoryConfig(bookCategory);
  const coverStyle = catConfig.coverStyle || "professional book cover, vibrant colors, eye-catching design";

  const coverPrompt = `${coverStyle}. Title: "${title}" by ${author || 'Author'}. Story/Theme: ${synopsis || 'A compelling story'}. Visual style: ${style || coverStyle}. The cover should be visually stunning with a strong central composition that immediately communicates the book's genre and tone. This should look like a real published book cover from a major publisher.`;

  return generateImage(apiKey, coverPrompt, {
    style: style || coverStyle,
    aspectRatio: trimSize === '8.5x8.5' ? '1:1' : '3:4',
  });
}

/**
 * Edit an existing image using Imagen3's editImage API.
 *
 * @param {string} apiKey
 * @param {string} referenceBase64 - Full data-URL or raw base64 string of the source image
 * @param {string} editPrompt      - What to change / add / remove
 * @param {string} editMode        - 'default' | 'removebg' | 'bgswap' | 'add' | 'style'
 * @param {{ aspectRatio?: string }} options
 */
export async function editImageWithReference(apiKey, referenceBase64, editPrompt, editMode = 'default', { aspectRatio = '1:1' } = {}) {
  if (!apiKey) throw new Error('No Gemini API key configured');

  const { GoogleGenAI, EditMode } = await import('@google/genai');
  const genAI = new GoogleGenAI({ apiKey });

  // Strip the data-URL header if present
  const imageBytes = referenceBase64.includes(',')
    ? referenceBase64.split(',')[1]
    : referenceBase64;

  // Map friendly mode names → SDK EditMode enum values
  const modeMap = {
    default:  EditMode?.EDIT_MODE_DEFAULT         || 'EDIT_MODE_DEFAULT',
    removebg: EditMode?.EDIT_MODE_INPAINT_REMOVAL || 'EDIT_MODE_INPAINT_REMOVAL',
    bgswap:   EditMode?.EDIT_MODE_BGSWAP          || 'EDIT_MODE_BGSWAP',
    add:      EditMode?.EDIT_MODE_INPAINT_INSERTION|| 'EDIT_MODE_INPAINT_INSERTION',
    style:    EditMode?.EDIT_MODE_STYLE            || 'EDIT_MODE_STYLE',
  };
  const sdkEditMode = modeMap[editMode] || modeMap.default;

  const editModels = ['imagen-3.0-capability-001', 'imagen-3.0-capability-preview-0001'];

  for (const model of editModels) {
    try {
      const result = await genAI.models.editImage({
        model,
        prompt: editPrompt,
        referenceImages: [
          {
            referenceType: 'REFERENCE_TYPE_RAW',
            referenceImage: { imageBytes },
          },
        ],
        config: {
          numberOfImages: 1,
          aspectRatio,
          editMode: sdkEditMode,
        },
      });

      const bytes = result.generatedImages?.[0]?.image?.imageBytes;
      if (bytes) return `data:image/png;base64,${bytes}`;
    } catch (err) {
      console.warn(`editImage with ${model} failed:`, err.message);
      continue;
    }
  }

  throw new Error('Image editing failed with all available models. Try adjusting the prompt or mode.');
}

// ============================================================
// PUZZLE BOOK GENERATION
// ============================================================

/**
 * Generate a word list with clues/hints for puzzle generation.
 * @param {string} apiKey
 * @param {{ topic: string, puzzleType: 'crossword'|'word-search', difficulty?: string, wordCount?: number }} opts
 * @returns {Promise<Array<{ word: string, clue?: string, hint?: string }>>}
 */
export async function generatePuzzleWordList(apiKey, { topic, puzzleType, difficulty = 'medium', wordCount = 20 }) {
  const isCrossword = puzzleType === 'crossword';
  const wordLengthGuide = difficulty === 'easy' ? '3-6 letters' : difficulty === 'hard' ? '7-15 letters' : '4-10 letters';

  const prompt = isCrossword
    ? `Generate ${wordCount} crossword puzzle words for the theme: "${topic}".
Difficulty: ${difficulty}. Word length: ${wordLengthGuide}.

Rules:
- All words must be real English words or proper nouns
- Each word must have a SHORT clue (under 10 words)
- No spaces in answers
- Vary word lengths for an interesting grid

Return ONLY a JSON array:
[{ "word": "EXAMPLE", "clue": "A short clue" }]`
    : `Generate ${wordCount} words for a "${topic}" themed word search puzzle.
Difficulty: ${difficulty}. Word length: ${wordLengthGuide}.

Rules:
- All words must be real and relevant to the theme
- No spaces (use compound if needed)
- Include an optional hint for each word

Return ONLY a JSON array:
[{ "word": "EXAMPLE", "hint": "Optional context hint" }]`;

  const text = await generateText(apiKey, prompt, 'You are a professional puzzle book creator. Return ONLY valid JSON, no markdown, no explanation.');
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(text);
}

/**
 * Generate a complete puzzle book with real grids and answer keys.
 * Async generator — yields progress events for real-time UI updates.
 *
 * Yields:
 *   { type: 'meta', book }
 *   { type: 'puzzle', puzzleNumber, svgPuzzle, svgAnswer, ... }
 *   { type: 'error', puzzleNumber, error }
 *   { type: 'done', total, bookMeta }
 *
 * @param {string} apiKey
 * @param {{ topic: string, genre: string, targetAge: string, pageCount?: number, synopsis?: string }} opts
 */
export async function* generatePuzzleBook(apiKey, { topic, genre, targetAge, pageCount = 20, synopsis }) {
  const puzzleType = genre === 'word-search' ? 'word-search' : 'crossword';
  const isCrossword = puzzleType === 'crossword';
  const difficulty = (targetAge === 'children' || targetAge === 'kids') ? 'easy'
    : targetAge === 'senior' ? 'medium' : 'medium';

  // Step 1: Generate book metadata
  let bookMeta = { title: `${topic} ${isCrossword ? 'Crossword' : 'Word Search'} Book`, tagline: 'Challenge your mind!' };
  try {
    const metaText = await generateText(
      apiKey,
      `Create a catchy title and short tagline for a ${puzzleType} puzzle book about "${topic}" for ${targetAge} audience.
Return JSON: { "title": "...", "tagline": "..." }`,
      'Return only valid JSON.'
    );
    const m = metaText.match(/\{[\s\S]*\}/);
    if (m) bookMeta = { ...bookMeta, ...JSON.parse(m[0]) };
  } catch { /* use fallback */ }

  yield { type: 'meta', book: bookMeta };

  // Step 2: Generate each puzzle
  const totalPuzzles = Math.min(pageCount || 20, 50);
  const wordsPerPuzzle = isCrossword ? 15 : 20;

  for (let i = 0; i < totalPuzzles; i++) {
    const puzzleNumber = i + 1;

    try {
      // Generate words + clues for this puzzle
      const wordList = await generatePuzzleWordList(apiKey, {
        topic,
        puzzleType,
        difficulty,
        wordCount: wordsPerPuzzle,
      });

      // Build real grid
      let puzzleData;
      let svgPuzzle, svgAnswer;
      const puzzleTitle = `${isCrossword ? 'Puzzle' : 'Word Search'} ${puzzleNumber}: ${topic}`;

      if (isCrossword) {
        puzzleData = generateCrossword(wordList);
        svgPuzzle = renderCrossword(puzzleData, { showAnswers: false, title: puzzleTitle });
        svgAnswer = renderCrossword(puzzleData, { showAnswers: true, title: puzzleTitle });
      } else {
        puzzleData = generateWordSearch(wordList, { difficulty });
        svgPuzzle = renderWordSearch(puzzleData, { showAnswers: false, title: puzzleTitle });
        svgAnswer = renderWordSearch(puzzleData, { showAnswers: true, title: puzzleTitle });
      }

      // Convert SVGs to PNG data URLs
      const [puzzleDataUrl, answerDataUrl] = await Promise.all([
        svgToDataUrl(svgPuzzle),
        svgToDataUrl(svgAnswer),
      ]);

      yield {
        type: 'puzzle',
        puzzleNumber,
        puzzleType,
        title: puzzleTitle,
        svgPuzzle: puzzleDataUrl,
        svgAnswer: answerDataUrl,
        wordList: isCrossword
          ? [...puzzleData.acrossClues, ...puzzleData.downClues]
          : puzzleData.wordList,
        placedCount: isCrossword ? puzzleData.placedCount : puzzleData.wordList.length,
        totalWords: isCrossword ? puzzleData.totalCount : wordList.length,
        sceneDescription: `${puzzleType} puzzle about "${topic}"`,
        text: isCrossword
          ? `${puzzleData.acrossClues.length} across clues, ${puzzleData.downClues.length} down clues`
          : `Find ${puzzleData.wordList.length} hidden words`,
      };
    } catch (err) {
      yield { type: 'error', puzzleNumber, error: err.message };
    }
  }

  yield { type: 'done', total: totalPuzzles, bookMeta };
}

