# AI Story — Children's Book Publisher Platform

> **Stitch Project:** `8057247495378073853` (imported from Google Stitch as "Project Dashboard")
> **Firebase Project:** `partners-in-biz-85059`

## What This App Does

This is an **AI-powered children's book creation and publishing platform** built to help creators produce, illustrate, and publish children's books on Amazon KDP — without needing artistic skills. The system follows a step-by-step workflow inspired by the strategy of building a passive-income book series:

### The Workflow (7-Day Book Creation Cycle)

| Day | Step | App Feature |
|-----|------|-------------|
| **1** | **Pick your niche** — Find profitable topics parents search for (potty training, social skills, emotions, bedtime stories, educational concepts) | **Niche Research** — AI-powered Amazon KDP market analysis using Gemini with Google Search grounding. Returns keyword data, competition levels, trends, and niche recommendations. |
| **2** | **Create your story outline** — Generate a 16-page children's book outline with simple text, clear lessons, and illustration-ready scenes | **Story Outline** — Gemini generates structured JSON outlines with page numbers, scene descriptions, and age-appropriate text (targeting ages 3–6). |
| **3–5** | **Generate illustrations** — Create 12–16 colorful, consistent character illustrations that match the story | **Illustration Studio** — Uses Imagen 3 (`imagen-3.0-generate-002`) via the Gemini API to generate children's book illustrations from scene descriptions. Supports custom styles and aspect ratios. |
| **6** | **Design your book layout** — Combine text with illustrations, format consistently, design a cover, export print-ready PDF | **Story Studio** — Full book editor where you combine AI-generated text and illustrations into a cohesive layout. Includes AI sentence suggestions for story continuation. |
| **7** | **Upload to Amazon KDP** — Set title, description, categories, pricing ($8.99–$14.99 paperback), go live within 24–72 hours | **Publishing** — Manages the KDP publishing workflow, metadata, and submission tracking. |

### Beyond a Single Book

| Feature | Purpose |
|---------|---------|
| **Series Manager** | Organize books into series (5–10 books in the same niche = $3,000+/month consistently). Parents buy multiple books from trusted authors. |
| **Ads Manager** | Create and track Amazon advertising campaigns with budget, keyword, and performance management (ACOS, impressions, clicks, sales). |
| **Social Media** | AI-generated promotional posts for TikTok, Instagram, and other platforms — tailored per platform style. |
| **Analytics** | Track performance, sales, and trends across your book portfolio. |
| **Community** | Public showcase for sharing published works (opt-in). |
| **Asset Library** | Centralized storage for all generated illustrations, covers, and media assets. |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2 | UI framework (JSX, hooks, context) |
| **Vite** | 7.3 | Build tool & dev server |
| **TailwindCSS** | 4.2 | Utility-first styling (via `@tailwindcss/vite` plugin) |
| **React Router DOM** | 7.13 | Client-side routing (SPA with `BrowserRouter`) |

### Backend / Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Firebase Authentication** | Google Sign-In + Email/Password authentication |
| **Cloud Firestore** | Primary database — user profiles, projects, chapters, characters, assets, campaigns |
| **Firebase Storage** | Asset file storage (illustrations, covers) |
| **Firebase Hosting** | Static site hosting (serves built `dist/` folder) |
| **Cloud Functions (Node.js 22)** | Server-side Firestore triggers for automatic embedding generation |
| **Firebase Functions v2** | Uses `onDocumentWritten` triggers |

### AI / ML
| Model | SDK | Purpose |
|-------|-----|---------|
| **Gemini 2.5 Flash** | `@google/generative-ai` | Text generation (outlines, stories, social posts, chat), API key validation |
| **Imagen 3** (`imagen-3.0-generate-002`) | `@google/generative-ai` | Illustration generation from text prompts |
| **Text Embedding 004** | `@google/generative-ai` | Vector embeddings for semantic search across chapters and characters |
| **Gemini + Google Search** | Grounding tool | Niche research with real-time market data |

### Key Architecture Decision: BYOK (Bring Your Own Key)

All AI calls use the **user's own Gemini API key**, stored encrypted in their Firestore profile. There is no shared API key — each user configures their key in **Settings**. This means:
- Zero AI cost for the platform operator
- Users control their own usage and billing
- API key is validated on save via a test generation call

---

## Project Structure

```
ai-story/
├── src/
│   ├── App.jsx                    # Router setup, layout, protected routes
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles
│   ├── components/
│   │   ├── Header.jsx             # Top navigation bar
│   │   ├── Sidebar.jsx            # Main navigation sidebar
│   │   └── ProtectedRoute.jsx     # Auth guard wrapper
│   ├── contexts/
│   │   ├── AuthContext.jsx        # Firebase Auth state (Google + Email)
│   │   └── GeminiContext.jsx      # Gemini API key provider
│   ├── lib/
│   │   ├── firebase.js            # Firebase app init (Auth, Firestore, Storage)
│   │   ├── firestore.js           # All Firestore CRUD operations
│   │   ├── gemini.js              # All Gemini AI functions
│   │   └── vectorSearch.js        # Client-side vector similarity search
│   └── pages/
│       ├── Login.jsx              # Auth page (sign in / sign up)
│       ├── Dashboard.jsx          # Project overview & quick actions
│       ├── NicheResearch.jsx      # AI-powered market research
│       ├── StoryOutline.jsx       # AI outline generator
│       ├── StoryStudio.jsx        # Full book editor with AI assist
│       ├── IllustrationStudio.jsx # Imagen 3 illustration generator
│       ├── SeriesManager.jsx      # Book series organization
│       ├── AssetLibrary.jsx       # Media asset management
│       ├── Publishing.jsx         # KDP publishing workflow
│       ├── AdsManager.jsx         # Amazon ad campaign manager
│       ├── SocialMedia.jsx        # AI social media post generator
│       ├── Analytics.jsx          # Performance tracking
│       ├── Community.jsx          # Public showcase
│       ├── Subscription.jsx       # Plan management
│       └── Settings.jsx           # User profile & API key config
├── functions/
│   └── index.js                   # Cloud Functions (embedding triggers)
├── firebase.json                  # Firebase config (Hosting, Firestore, Storage, Functions)
├── firestore.rules                # Security rules (user-scoped data isolation)
├── storage.rules                  # Storage security rules
└── .env.local                     # Firebase credentials (not committed)
```

---

## Data Model (Firestore)

```
users/{userId}
├── displayName, email, photoURL, plan, geminiApiKey
├── projects/{projectId}
│   ├── title, genre, targetAge, status, progress, coverImageUrl
│   ├── synopsis, theme, lessons, targetWordCount, seriesId
│   ├── chapters/{chapterId}
│   │   ├── title, number, content, sceneDescription
│   │   ├── wordCount, status, embedding, embeddingUpdatedAt
│   ├── characters/{characterId}
│   │   ├── name, description, traits[], referenceImageUrl
│   │   ├── embedding, embeddingUpdatedAt
│   └── assets/{assetId}
│       ├── name, type, url, storagePath, prompt, style, size
├── campaigns/{campaignId}
│   ├── name, bookTitle, status, dailyBudget
│   ├── totalSpend, impressions, clicks, sales, acos, keywords
└── settings/gemini
    └── apiKey

showcase/{docId}  (public, opt-in community sharing)
```

---

## Security

- **Firestore rules** enforce strict user-scoped data isolation — users can only read/write their own documents (`request.auth.uid == userId`)
- **Showcase** collection allows authenticated reads but restricts writes to the document owner
- **All protected routes** require authentication via `ProtectedRoute` wrapper
- **API keys** are stored per-user in Firestore (no shared secrets)

---

## Development

```bash
# Install dependencies
npm install
cd functions && npm install && cd ..

# Run locally
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy

# Deploy only functions
cd functions && npm run deploy
```

---

## Guiding Philosophy

> *"Perfect is the enemy of published."*

The platform is designed around rapid iteration:
1. Test your concept with basic images first
2. If it gets traction, invest in better visuals
3. Learn from reviews, improve the next book
4. The compound effect of multiple books is where the real money lives
5. Create a series of 5–10 books in the same niche for consistent income
