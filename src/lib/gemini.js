import { GoogleGenerativeAI } from "@google/generative-ai";

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
export async function generateOutline(apiKey, { topic, genre, targetAge, pageCount = 16 }) {
  const prompt = `Write a children's book outline about "${topic}" for ages ${targetAge}.
Include ${pageCount} pages with simple text, a clear lesson, and engaging scenes that would work well as illustrations.

For each page, provide:
1. Page number
2. Scene description (what the illustration should show)
3. The text that appears on the page (2-3 simple sentences)

Genre: ${genre}

Return as JSON array with objects: { pageNumber, sceneDescription, text }`;

  const text = await generateText(apiKey, prompt, "You are a bestselling children's book author. Always return valid JSON.");
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
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
export async function researchNiche(apiKey, topic) {
  const prompt = `Research the Amazon KDP children's book market for the topic: "${topic}"

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

Focus on keywords parents actually search for on Amazon. Include 5-8 keywords.`;

  const genAI = createGeminiClient(apiKey);
  if (!genAI) throw new Error("No Gemini API key configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are an Amazon KDP market research expert. Always return valid JSON.",
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
export async function generateSocialPost(apiKey, { bookTitle, platform, topic }) {
  const prompt = `Write a ${platform} post promoting a children's book called "${bookTitle}" about ${topic}.

Include:
- Engaging hook
- Key benefits for parents
- Call to action
- Relevant hashtags

Platform style: ${platform === "TikTok" ? "casual, trendy, use emoji" : platform === "Instagram" ? "visual description, use emoji sparingly" : "professional, concise"}`;

  return generateText(apiKey, prompt, "You are a social media marketing expert for children's book authors.");
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
export async function deepResearchNiche(apiKey, topic) {
  const prompt = `You are an expert Amazon KDP children's book market analyst. Conduct a DEEP analysis of the niche: "${topic}"

Research and return a comprehensive JSON object with the following structure:
{
  "keywords": [
    {
      "keyword": "exact search phrase parents use on Amazon",
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
      "pageCount": 32,
      "priceRange": "$8.99-$12.99",
      "whyItSells": "2-3 sentence analysis of why this book succeeds",
      "lessonsForCreators": "What to learn from this book's success"
    }
  ],
  "analytics": {
    "avgPageCount": 32,
    "pageCountRange": "24-48",
    "mostCommonPageCounts": [24, 32, 40],
    "avgPrice": "$9.99",
    "priceSwetSpot": "$8.99-$12.99",
    "avgRating": 4.6,
    "topCategories": ["Children's Social Skills Books", "Children's Self-Esteem Books"],
    "marketSize": "Large|Medium|Small",
    "growthRate": "Growing|Stable|Declining",
    "seasonality": "Year-round demand with peak in back-to-school season"
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
    "bookIdeas": ["Book 1 title idea", "Book 2 title idea", "Book 3 title idea", "Book 4 title idea", "Book 5 title idea"],
    "rationale": "Why a series works well in this niche"
  },
  "insights": "Comprehensive market analysis paragraph (3-4 sentences)",
  "recommendation": "Clear recommendation with action steps"
}

IMPORTANT: Include 5-8 keywords, 3-5 bestsellers with REAL book titles if possible (use Google Search to find actual bestselling children's books about ${topic}), 3-5 content gaps.
Be specific and actionable. Focus on what makes books SELL — cover quality, title optimization, category selection, review patterns.`;

  const genAI = createGeminiClient(apiKey);
  if (!genAI) throw new Error("No Gemini API key configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are a world-class Amazon KDP market research analyst specializing in children's books. Use Google Search to find real bestselling book data. Always return valid JSON.",
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
export async function generateFullBookContent(apiKey, { topic, genre, targetAge, pageCount, bookType, synopsis }) {
  const prompt = `Create a complete children's ${bookType || 'picture book'} about "${topic}" for ages ${targetAge || '3-6'}.
Genre: ${genre || 'adventure'}
Total pages: ${pageCount || 32}
${synopsis ? `Synopsis: ${synopsis}` : ''}

For EACH page, provide:
1. pageNumber (1 to ${pageCount || 32})
2. text — the story text for this page (${bookType === 'picture-book' ? '2-3 simple sentences, 15-30 words' : '3-5 sentences, 30-60 words'})
3. sceneDescription — detailed description of what the illustration should show (include character poses, expressions, background details, colors)
4. illustrationNotes — specific art direction (mood, lighting, composition, camera angle)

The story should have:
- A clear beginning, middle, and end
- A memorable main character with a name
- An engaging conflict and satisfying resolution
- A clear moral or lesson
- Repetitive phrases or patterns (children love these)
- Age-appropriate vocabulary

Return as a JSON object:
{
  "title": "The book title",
  "mainCharacter": {
    "name": "Character name",
    "description": "physical appearance for consistent illustrations",
    "traits": ["personality trait 1", "trait 2"]
  },
  "lesson": "The key lesson/moral",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Story text for this page",
      "sceneDescription": "Detailed illustration description",
      "illustrationNotes": "Art direction notes"
    }
  ]
}`;

  const text = await generateText(apiKey, prompt, "You are a #1 New York Times bestselling children's book author. Create engaging, age-appropriate stories that parents love to read and children never tire of hearing. Always return valid JSON.");
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
export async function* generateConsistentIllustrations(apiKey, pages, styleGuide, options = {}) {
  const stylePrefix = buildStylePrompt(styleGuide);
  const { aspectRatio = '1:1' } = options;

  for (const page of pages) {
    try {
      const fullPrompt = `${stylePrefix}${page.sceneDescription}${page.illustrationNotes ? '. ' + page.illustrationNotes : ''}`;
      const dataUrl = await generateImage(apiKey, fullPrompt, {
        style: styleGuide?.artStyle || "colorful children's book illustration",
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
export async function generateBookCover(apiKey, { title, author, synopsis, style, trimSize }) {
  const coverPrompt = `Professional children's book cover design. Title: "${title}" by ${author || 'Author'}. Story: ${synopsis || 'A children\'s story'}. Style: ${style || 'colorful, eye-catching, professional'}. The cover should be visually stunning, with the main character prominently featured, vibrant colors, and a scene that captures the essence of the story. This should look like a real published book cover from a major publisher.`;

  return generateImage(apiKey, coverPrompt, {
    style: style || "professional book cover illustration, vibrant colors, eye-catching design",
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
