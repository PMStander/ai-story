import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================================
// User Profile
// ============================================================

export function getUserRef(uid) {
  return doc(db, "users", uid);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(getUserRef(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, data) {
  return updateDoc(getUserRef(uid), { ...data, updatedAt: serverTimestamp() });
}

// ============================================================
// Projects
// ============================================================

function projectsCol(uid) {
  return collection(db, "users", uid, "projects");
}

function projectRef(uid, projectId) {
  return doc(db, "users", uid, "projects", projectId);
}

export async function createProject(uid, data) {
  const ref = await addDoc(projectsCol(uid), {
    title: data.title || "Untitled Project",
    genre: data.genre || "",
    targetAge: data.targetAge || "3-6",
    status: "draft",
    progress: 0,
    coverImageUrl: "",
    synopsis: data.synopsis || "",
    theme: data.theme || "",
    lessons: data.lessons || "",
    targetWordCount: data.targetWordCount || 2000,
    seriesId: data.seriesId || null,
    // KDP Format
    trimSize: data.trimSize || "8.5x8.5",
    bookType: data.bookType || "picture-book",
    interiorType: data.interiorType || "premium-color",
    bleed: data.bleed || false,
    pageCount: data.pageCount || 32,
    // Style Guide
    styleGuide: data.styleGuide || {
      artStyle: "",
      colorPalette: "",
      characters: [],
      environmentRules: "",
      additionalRules: "",
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getProject(uid, projectId) {
  const snap = await getDoc(projectRef(uid, projectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getUserProjects(uid) {
  const q = query(projectsCol(uid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function onProjectsSnapshot(uid, callback) {
  const q = query(projectsCol(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function updateProject(uid, projectId, data) {
  return updateDoc(projectRef(uid, projectId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(uid, projectId) {
  return deleteDoc(projectRef(uid, projectId));
}

// ============================================================
// Chapters
// ============================================================

function chaptersCol(uid, projectId) {
  return collection(db, "users", uid, "projects", projectId, "chapters");
}

function chapterRef(uid, projectId, chapterId) {
  return doc(db, "users", uid, "projects", projectId, "chapters", chapterId);
}

export async function createChapter(uid, projectId, data) {
  const ref = await addDoc(chaptersCol(uid, projectId), {
    title: data.title || "Untitled Chapter",
    number: data.number || 1,
    content: data.content || "",
    sceneDescription: data.sceneDescription || "",
    illustrationUrl: data.illustrationUrl || "",
    canvasLayout: data.canvasLayout || null,
    wordCount: 0,
    status: "planned",
    embedding: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getChapters(uid, projectId) {
  const q = query(chaptersCol(uid, projectId), orderBy("number", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function onChaptersSnapshot(uid, projectId, callback) {
  const q = query(chaptersCol(uid, projectId), orderBy("number", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function updateChapter(uid, projectId, chapterId, data) {
  return updateDoc(chapterRef(uid, projectId, chapterId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChapter(uid, projectId, chapterId) {
  return deleteDoc(chapterRef(uid, projectId, chapterId));
}

// ============================================================
// Characters
// ============================================================

function charactersCol(uid, projectId) {
  return collection(db, "users", uid, "projects", projectId, "characters");
}

export async function createCharacter(uid, projectId, data) {
  const ref = await addDoc(charactersCol(uid, projectId), {
    name: data.name || "",
    description: data.description || "",
    traits: data.traits || [],
    referenceImageUrl: data.referenceImageUrl || "",
    embedding: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getCharacters(uid, projectId) {
  const q = query(charactersCol(uid, projectId), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ============================================================
// Assets
// ============================================================

function assetsCol(uid, projectId) {
  return collection(db, "users", uid, "projects", projectId, "assets");
}

export async function createAsset(uid, projectId, data) {
  const ref = await addDoc(assetsCol(uid, projectId), {
    name: data.name || "",
    type: data.type || "illustration",
    url: data.url || "",
    storagePath: data.storagePath || "",
    prompt: data.prompt || "",
    style: data.style || "",
    size: data.size || 0,
    characterId: data.characterId || null,
    characterName: data.characterName || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAssets(uid, projectId) {
  const q = query(assetsCol(uid, projectId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteAsset(uid, projectId, assetId) {
  return deleteDoc(doc(db, "users", uid, "projects", projectId, "assets", assetId));
}

export async function duplicateAsset(uid, projectId, asset) {
  return createAsset(uid, projectId, {
    ...asset,
    name: `Copy of ${asset.name || "asset"}`,
    // Drop Firestore-managed fields so they get regenerated
    id: undefined,
    createdAt: undefined,
  });
}

export async function moveAsset(uid, fromProjectId, toProjectId, asset) {
  // Create in destination (same URL — no re-upload needed)
  await createAsset(uid, toProjectId, {
    ...asset,
    id: undefined,
    createdAt: undefined,
  });
  // Delete from source
  await deleteAsset(uid, fromProjectId, asset.id);
}


// ============================================================
// Settings (Gemini API Key)
// ============================================================

export async function saveGeminiApiKey(uid, apiKey) {
  return updateDoc(getUserRef(uid), {
    geminiApiKey: apiKey,
    updatedAt: serverTimestamp(),
  });
}

export async function getGeminiApiKey(uid) {
  const profile = await getUserProfile(uid);
  return profile?.geminiApiKey || "";
}

// ============================================================
// Campaigns (Ads Manager)
// ============================================================

function campaignsCol(uid) {
  return collection(db, "users", uid, "campaigns");
}

export async function createCampaign(uid, data) {
  const ref = await addDoc(campaignsCol(uid), {
    name: data.name || "Untitled Campaign",
    bookTitle: data.bookTitle || "",
    status: data.status || "Draft",
    dailyBudget: data.dailyBudget || "10.00",
    totalSpend: "0.00",
    impressions: 0,
    clicks: 0,
    sales: "0.00",
    acos: "0%",
    keywords: data.keywords || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getCampaigns(uid) {
  const q = query(campaignsCol(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateCampaign(uid, campaignId, data) {
  return updateDoc(doc(db, "users", uid, "campaigns", campaignId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCampaign(uid, campaignId) {
  return deleteDoc(doc(db, "users", uid, "campaigns", campaignId));
}

// ============================================================
// Series
// ============================================================

function seriesCol(uid) {
  return collection(db, "users", uid, "series");
}

function seriesRef(uid, seriesId) {
  return doc(db, "users", uid, "series", seriesId);
}

export async function createSeries(uid, data) {
  const ref = await addDoc(seriesCol(uid), {
    name: data.name || "Untitled Series",
    description: data.description || "",
    niche: data.niche || "",
    scratchpad: data.scratchpad || "",
    research: data.research || [],
    bookIds: data.bookIds || [],
    styleGuide: data.styleGuide || {
      artStyle: "",
      colorPalette: "",
      characters: [],
      environmentRules: "",
      additionalRules: "",
    },
    themeRules: data.themeRules || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getSeries(uid, seriesId) {
  const snap = await getDoc(seriesRef(uid, seriesId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getUserSeries(uid) {
  const q = query(seriesCol(uid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateSeries(uid, seriesId, data) {
  return updateDoc(seriesRef(uid, seriesId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSeries(uid, seriesId) {
  return deleteDoc(seriesRef(uid, seriesId));
}

// ── Series-level assets (shared across all books in the series) ──────────────

function seriesAssetsCol(uid, seriesId) {
  return collection(db, "users", uid, "series", seriesId, "assets");
}

export async function createSeriesAsset(uid, seriesId, data) {
  const ref = await addDoc(seriesAssetsCol(uid, seriesId), {
    name:          data.name          || "",
    type:          data.type          || "character",
    url:           data.url           || "",
    storagePath:   data.storagePath   || "",
    prompt:        data.prompt        || "",
    style:         data.style         || "",
    characterName: data.characterName || null,
    pose:          data.pose          || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getSeriesAssets(uid, seriesId) {
  const q = query(seriesAssetsCol(uid, seriesId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteSeriesAsset(uid, seriesId, assetId) {
  return deleteDoc(doc(db, "users", uid, "series", seriesId, "assets", assetId));
}

// Move a project asset up to the series level
export async function moveProjectAssetToSeries(uid, fromProjectId, seriesId, asset) {
  await createSeriesAsset(uid, seriesId, asset);
  await deleteAsset(uid, fromProjectId, asset.id);
}


// ============================================================
// Chats
// ============================================================

function chatsCol(uid) {
  return collection(db, "users", uid, "chats");
}

function chatRef(uid, chatId) {
  return doc(db, "users", uid, "chats", chatId);
}

export async function createChat(uid, title) {
  const ref = await addDoc(chatsCol(uid), {
    title: title || "New Chat",
    messages: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateChatMessages(uid, chatId, messages) {
  // Serialize timestamps to numbers so Firestore can store them
  const serialized = messages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp || Date.now(),
    error: m.error || false,
    actions: (m.actions || []).map((a) => ({ ...a })),
  }));
  return updateDoc(chatRef(uid, chatId), {
    messages: serialized,
    // Use first user message as title if still "New Chat"
    updatedAt: serverTimestamp(),
  });
}

export async function updateChatTitle(uid, chatId, title) {
  return updateDoc(chatRef(uid, chatId), { title, updatedAt: serverTimestamp() });
}

export async function getUserChats(uid) {
  const q = query(chatsCol(uid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteChat(uid, chatId) {
  return deleteDoc(chatRef(uid, chatId));
}
