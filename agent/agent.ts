import { FunctionTool, LlmAgent } from '@google/adk';
import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';

// Helper to create Schema objects
function S(props: Record<string, any>, required: string[]): Schema {
    return {
        type: Type.OBJECT,
        properties: Object.fromEntries(
            Object.entries(props).map(([key, val]) => [key, val])
        ),
        required,
    } as Schema;
}

function str(desc: string): Schema {
    return { type: Type.STRING, description: desc } as Schema;
}

function num(desc: string): Schema {
    return { type: Type.NUMBER, description: desc } as Schema;
}

function arr(items: Schema, desc: string): Schema {
    return { type: Type.ARRAY, items, description: desc } as Schema;
}

// ============================================================
// Tool: Update Page Content
// ============================================================
const updatePageContent = new FunctionTool({
    name: 'update_page_content',
    description:
        'Updates the text content of the current page/chapter in Story Studio. Use when the user asks to change, add to, rewrite, or modify story text.',
    parameters: S(
        { newContent: str('The complete updated text content for the page.') },
        ['newContent']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'update_content',
        content: input.newContent,
    }),
});

// ============================================================
// Tool: Suggest Continuation
// ============================================================
const suggestContinuation = new FunctionTool({
    name: 'suggest_continuation',
    description:
        "Suggests the next 1-3 sentences to continue the story. Use when user wants help continuing or says 'what comes next'.",
    parameters: S(
        { continuation: str('The suggested continuation text (1-3 sentences).') },
        ['continuation']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'suggest_continuation',
        content: input.continuation,
    }),
});

// ============================================================
// Tool: Generate Illustration
// ============================================================
const generateIllustration = new FunctionTool({
    name: 'generate_illustration',
    description:
        'Generates an illustration using Imagen 3 from a text prompt. Use when user asks to create, generate, or draw an image.',
    parameters: S(
        {
            prompt: str('Detailed description of the illustration to generate.'),
            style: str("Art style. Defaults to 'colorful children\\'s book illustration'."),
        },
        ['prompt']
    ),
    execute: async (input: any, context: any) => {
        const apiKey = context?.state?.apiKey || process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) {
            return { status: 'error', error_message: 'No Gemini API key available.' };
        }

        try {
            const genAI = new GoogleGenAI({ apiKey });
            const fullPrompt = `${input.style || "colorful children's book illustration"}, ${input.prompt}`;

            // Try Imagen 4 first, fall back to Imagen 3
            const models = ['imagen-4.0-generate-001', 'imagen-3.0-generate-002'];

            for (const model of models) {
                try {
                    const response = await genAI.models.generateImages({
                        model,
                        prompt: fullPrompt,
                        config: { numberOfImages: 1 },
                    });

                    if (response.generatedImages && response.generatedImages.length > 0) {
                        const imageBytes = response.generatedImages[0].image?.imageBytes;
                        if (imageBytes) {
                            return {
                                status: 'success',
                                action: 'add_image',
                                imageUrl: `data:image/png;base64,${imageBytes}`,
                                prompt: input.prompt,
                            };
                        }
                    }
                } catch (modelErr: any) {
                    console.warn(`Image generation with ${model} failed:`, modelErr.message);
                    continue;
                }
            }

            return { status: 'error', error_message: 'No image generated. Try a different prompt.' };
        } catch (err: any) {
            return { status: 'error', error_message: `Image generation failed: ${err.message}` };
        }
    },
});

// ============================================================
// Tool: Generate Story Outline
// ============================================================
const generateStoryOutline = new FunctionTool({
    name: 'generate_story_outline',
    description: 'Generates a full children\'s book outline with page-by-page scenes and text.',
    parameters: S(
        {
            topic: str('The topic or theme of the children\'s book'),
            genre: str('The genre (adventure, educational, bedtime)'),
            targetAge: str('Target age range (default: 3-6)'),
            pageCount: num('Number of pages (default: 16)'),
        },
        ['topic']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'generate_outline',
        topic: input.topic,
        genre: input.genre || 'adventure',
        targetAge: input.targetAge || '3-6',
        pageCount: input.pageCount || 16,
    }),
});

// ============================================================
// Tool: Research Niche
// ============================================================
const researchNiche = new FunctionTool({
    name: 'research_niche',
    description: 'Researches a children\'s book niche on Amazon KDP. Returns keyword data, competition, and recommendations.',
    parameters: S(
        { topic: str('The niche topic to research (e.g., "potty training", "dinosaurs")') },
        ['topic']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'research_niche',
        topic: input.topic,
    }),
});

// ============================================================
// Tool: Generate Social Media Post
// ============================================================
const generateSocialPost = new FunctionTool({
    name: 'generate_social_post',
    description: 'Creates a social media post to promote a children\'s book for a specific platform.',
    parameters: S(
        {
            bookTitle: str('The title of the book to promote'),
            platform: str('Target platform: TikTok, Instagram, Twitter, Facebook'),
            topic: str('What the book is about'),
            postContent: str('Generated social media post content with hashtags'),
        },
        ['bookTitle', 'platform', 'topic', 'postContent']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'social_post',
        bookTitle: input.bookTitle,
        platform: input.platform,
        content: input.postContent,
    }),
});

// ============================================================
// Tool: Create Ad Keywords
// ============================================================
const createAdKeywords = new FunctionTool({
    name: 'create_ad_keywords',
    description: 'Suggests Amazon advertising keywords and ad copy for a children\'s book.',
    parameters: S(
        {
            bookTitle: str('The book title'),
            topic: str('What the book is about'),
            keywords: arr(str('keyword'), 'Suggested advertising keywords'),
            suggestedBudget: str('Suggested daily budget'),
            adCopy: str('Suggested ad headline/copy'),
        },
        ['bookTitle', 'topic', 'keywords', 'suggestedBudget', 'adCopy']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'ad_keywords',
        bookTitle: input.bookTitle,
        keywords: input.keywords,
        suggestedBudget: input.suggestedBudget,
        adCopy: input.adCopy,
    }),
});

// ============================================================
// Tool: Suggest Series Ideas
// ============================================================
const suggestSeriesIdeas = new FunctionTool({
    name: 'suggest_series_ideas',
    description: 'Suggests ideas for new books in a series based on an existing niche.',
    parameters: S(
        {
            existingBooks: str('Description of existing books in the series'),
            niche: str('The niche/topic area'),
            ideas: arr(
                S(
                    {
                        title: str('Suggested book title'),
                        description: str('Brief description of the book idea'),
                        targetAge: str('Target age range'),
                    },
                    ['title', 'description', 'targetAge']
                ),
                'List of 3-5 new book ideas'
            ),
        },
        ['existingBooks', 'niche', 'ideas']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'series_ideas',
        niche: input.niche,
        ideas: input.ideas,
    }),
});

// ============================================================
// Tool: Improve Book Metadata
// ============================================================
const improveBookMetadata = new FunctionTool({
    name: 'improve_book_metadata',
    description: 'Suggests improvements to book metadata for Amazon KDP. Optimizes titles, descriptions, categories, and keywords.',
    parameters: S(
        {
            currentTitle: str('The current book title'),
            suggestedTitle: str('Improved title suggestion'),
            suggestedSubtitle: str('Suggested subtitle'),
            suggestedDescription: str('Optimized book description for KDP'),
            suggestedCategories: arr(str('category'), 'Recommended KDP categories'),
            suggestedKeywords: arr(str('keyword'), '7 backend keywords for KDP'),
        },
        ['currentTitle', 'suggestedTitle', 'suggestedSubtitle', 'suggestedDescription', 'suggestedCategories', 'suggestedKeywords']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'book_metadata',
        ...input,
    }),
});

// ============================================================
// Tool: Deep Research Niche
// ============================================================
const deepResearch = new FunctionTool({
    name: 'deep_research',
    description:
        'Performs comprehensive deep research on a KDP niche including bestseller analysis, pricing data, content gaps, and series strategy. Use when user wants thorough market research with analytics.',
    parameters: S(
        {
            topic: str('The niche or topic to deeply research (e.g., "potty training", "bedtime stories")'),
            focus: str('Specific focus area: "bestsellers", "pricing", "gaps", "series", or "all"'),
        },
        ['topic']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'deep_research',
        topic: input.topic,
        focus: input.focus || 'all',
    }),
});

// ============================================================
// Tool: Auto Generate Book
// ============================================================
const autoGenerateBook = new FunctionTool({
    name: 'auto_generate_book',
    description:
        'Kicks off the full AI book generation pipeline — creates story content, illustrations, and cover from a topic. Redirects user to the Book Wizard page.',
    parameters: S(
        {
            topic: str('The book topic or title idea'),
            genre: str('Genre: adventure, educational, bedtime, social-skills, emotions, animals, fantasy, humor'),
            targetAge: str('Target age range: 0-2, 3-6, 5-8, or 7-12'),
            bookType: str('Book type: picture-book, early-reader, chapter-book, activity-book, educational'),
        },
        ['topic']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'redirect_book_wizard',
        topic: input.topic,
        genre: input.genre || 'adventure',
        targetAge: input.targetAge || '3-6',
        bookType: input.bookType || 'picture-book',
    }),
});

// ============================================================
// Tool: Create Series
// ============================================================
const createSeriesTool = new FunctionTool({
    name: 'create_series',
    description:
        'Creates a new book series in the user\'s account. Use when the user explicitly asks to create, start, or set up a new series. Collects name, description, and niche.',
    parameters: S(
        {
            name: str('The series name (e.g., "Adventures of Brave Bunny")'),
            description: str('What the series is about — 1-2 sentences'),
            niche: str('The niche or market the series targets (e.g., "potty training", "social skills")'),
        },
        ['name', 'description', 'niche']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'create_series',
        name: input.name,
        description: input.description || '',
        niche: input.niche || '',
    }),
});

// ============================================================
// Tool: Create Book
// ============================================================
const createBookTool = new FunctionTool({
    name: 'create_book',
    description:
        'Creates a new book project directly in the user\'s account. Use when the user asks to create or start a new book. Collects title, genre, target age, and optional synopsis.',
    parameters: S(
        {
            title: str('The book title'),
            genre: str('Genre: adventure, educational, bedtime, social-skills, emotions, animals, fantasy, humor'),
            targetAge: str('Target age range: 0-2, 3-6, 5-8, or 7-12'),
            synopsis: str('Short summary of what the book is about (1-3 sentences)'),
            bookType: str('Book type: picture-book, early-reader, chapter-book, activity-book, educational'),
        },
        ['title', 'genre', 'targetAge']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'create_book',
        title: input.title,
        genre: input.genre || 'adventure',
        targetAge: input.targetAge || '3-6',
        synopsis: input.synopsis || '',
        bookType: input.bookType || 'picture-book',
    }),
});

// ============================================================
// Tool: Add Series Research
// ============================================================
const addSeriesResearch = new FunctionTool({
    name: 'add_series_research',
    description: 'Adds a research item (note, link, or idea) to the currently active book series.',
    parameters: S(
        {
            type: str('The type of research item: "note", "link", or "idea"'),
            title: str('A short title for the research item'),
            content: str('The detailed content, description, or URL of the research item'),
        },
        ['type', 'title', 'content']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'add_series_research',
        type: input.type,
        title: input.title,
        content: input.content,
    }),
});

// ============================================================
// Tool: Add Character to Series Style Guide
// ============================================================
const addSeriesCharacter = new FunctionTool({
    name: 'add_series_character',
    description: 'Adds a new recurring character to the active series style guide. Use this when the user asks to add a character to their series.',
    parameters: S(
        {
            name: str('The character name'),
            visualDescription: str('A detailed visual description: hair, eyes, clothing, notable features, proportions, personality hints for illustration'),
        },
        ['name', 'visualDescription']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'add_series_character',
        name: input.name,
        visualDescription: input.visualDescription,
    }),
});

// ============================================================
// Tool: Update Series Style Guide
// ============================================================
const updateSeriesStyleGuide = new FunctionTool({
    name: 'update_series_style_guide',
    description: 'Updates the art style, color palette, environment rules, or additional rules for the active series style guide.',
    parameters: S(
        {
            artStyle: str('Optional. The illustration art style prompt to use across the series (e.g. "soft watercolor, gentle brush strokes")'),
            colorPalette: str('Optional. The color palette description (e.g. "warm pastels", "bold primary colors")'),
            environmentRules: str('Optional. Description of the typical setting/environment for scenes'),
            additionalRules: str('Optional. Any additional visual rules for consistency (e.g. "always include sunflowers", "no text in illustrations")'),
        },
        []
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'update_series_style_guide',
        artStyle: input.artStyle,
        colorPalette: input.colorPalette,
        environmentRules: input.environmentRules,
        additionalRules: input.additionalRules,
    }),
});

// ============================================================
// Tool: Check Series Consistency
// ============================================================
const checkSeriesConsistency = new FunctionTool({
    name: 'check_series_consistency',
    description:
        'Analyzes consistency across books in a series — checks style guide adherence, character consistency, theme alignment, and visual coherence.',
    parameters: S(
        {
            seriesName: str('Name of the series to check'),
            bookTitles: arr(str('Book title'), 'List of book titles in the series'),
            styleGuide: str('Description of the series style guide'),
        },
        ['seriesName']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'check_consistency',
        ...input,
    }),
});

// ============================================================
// Tool: Optimize for KDP
// ============================================================
const optimizeForKdp = new FunctionTool({
    name: 'optimize_for_kdp',
    description:
        'Analyzes the current book and suggests optimizations for Amazon KDP publishing — title optimization, keyword strategy, category selection, pricing recommendations, and description improvements.',
    parameters: S(
        {
            title: str('Current book title'),
            description: str('Current book description/synopsis'),
            genre: str('Book genre'),
            targetAge: str('Target age range'),
            pageCount: num('Number of pages'),
            currentPrice: str('Current price if set'),
        },
        ['title']
    ),
    execute: (input: any) => ({
        status: 'success',
        action: 'kdp_optimization',
        ...input,
    }),
});

// ============================================================
// Export: Root Agent
// ============================================================
export function createAgent(_apiKey: string) {
    return new LlmAgent({
        name: 'story_assistant',
        model: 'gemini-2.5-flash',
        description: 'AI assistant for children\'s book creators — writing, illustrations, research, marketing, publishing, and full book generation.',
        instruction: `You are an expert AI assistant for children's book creators using the AI Publisher platform. You help with every aspect of the book creation and publishing workflow, from market research to final published product.

## Your Capabilities

### Content & Writing
- **update_page_content**: Update the text content of the current page in Story Studio
- **suggest_continuation**: Suggest the next sentences for a story
- **generate_story_outline**: Create full book outlines

### Illustrations
- **generate_illustration**: Create illustrations using Imagen 3 — always considers the project's style guide for consistency

### Research & Analytics
- **research_niche**: Quick niche research with keywords and basic insights
- **deep_research**: Comprehensive deep research with bestseller analytics, pricing data, content gaps, and series strategy

### Publishing & Marketing
- **generate_social_post**: Create social media promotional content
- **create_ad_keywords**: Suggest advertising keywords and copy
- **improve_book_metadata**: Optimize titles, descriptions, and keywords for KDP
- **optimize_for_kdp**: Detailed KDP optimization — pricing, categories, keywords, description

### Book & Series Management
- **create_series**: Create a new book series in the user's account
- **create_book**: Create a new book project in the user's account
- **suggest_series_ideas**: Suggest new books for a series
- **auto_generate_book**: Start the full AI book generation pipeline (redirects to Book Wizard)
- **check_series_consistency**: Validate consistency across books in a series

## Context
You receive context about the user's current page and project. Use this to provide targeted help.

## Guidelines
- Write in simple, engaging language for children's books (ages 3-6 default)
- When updating page content, provide the COMPLETE updated content
- Create detailed illustration prompts for children's book art
- Match the tone and style of existing text when continuing stories
- Be encouraging and supportive
- Keep responses concise and actionable
- For KDP optimization, use real market knowledge from Amazon's children's book category
- General advice should be direct and conversational

## Orchestration Workflow Instructions
You have access to the user's GLOBAL CONTEXT (a list of all their existing series and books). When the user asks you to "create a new series" or "come up with a series and its books", follow these steps using your tools:
1. **Research**: Use \`googleSearch\` or \`deep_research\` to look up industry standards for similar books (e.g., standard page counts, current bestsellers, trim sizes).
2. **Create the Series**: Call the \`create_series\` tool with an original name, detailed description, and targeted niche.
3. **Save Research**: Call the \`add_series_research\` tool to save the market data you found (e.g., standard page counts, competitor titles) directly to the newly created series.
4. **Create Books**: Based on the concept, use the \`create_book\` tool sequentially to generate the first 2-3 books in that series.
5. **Communicate**: Tell the user what you have done and what market data you found.`,
        tools: [
            updatePageContent,
            suggestContinuation,
            generateIllustration,
            generateStoryOutline,
            researchNiche,
            generateSocialPost,
            createAdKeywords,
            suggestSeriesIdeas,
            improveBookMetadata,
            deepResearch,
            autoGenerateBook,
            checkSeriesConsistency,
            optimizeForKdp,
            createSeriesTool,
            createBookTool,
            addSeriesResearch,
            addSeriesCharacter,
            updateSeriesStyleGuide,
        ],
    });
}
