import { generateEmbedding } from "./gemini";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Generate and store an embedding for a chapter
 */
export async function embedChapter(apiKey, uid, projectId, chapterId, content) {
  if (!content || content.trim().length < 10) return null;

  const embedding = await generateEmbedding(apiKey, content);

  // Store embedding in the chapter document
  const chapterRef = doc(db, "users", uid, "projects", projectId, "chapters", chapterId);
  await updateDoc(chapterRef, { embedding });

  return embedding;
}

/**
 * Generate and store an embedding for a character
 */
export async function embedCharacter(apiKey, uid, projectId, characterId, description) {
  if (!description || description.trim().length < 5) return null;

  const embedding = await generateEmbedding(apiKey, description);

  const charRef = doc(db, "users", uid, "projects", projectId, "characters", characterId);
  await updateDoc(charRef, { embedding });

  return embedding;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for semantically similar chapters within a project.
 * Uses client-side cosine similarity on pre-computed embeddings.
 */
export async function searchSimilarChapters(apiKey, uid, projectId, queryText, topK = 5) {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(apiKey, queryText);

  // Fetch all chapters with embeddings
  const chaptersCol = collection(db, "users", uid, "projects", projectId, "chapters");
  const snap = await getDocs(chaptersCol);

  const scored = [];
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.embedding) {
      const similarity = cosineSimilarity(queryEmbedding, data.embedding);
      scored.push({
        id: d.id,
        title: data.title,
        number: data.number,
        content: data.content?.slice(0, 200) || "",
        similarity,
      });
    }
  });

  // Sort by similarity descending
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

/**
 * Search for characters by description similarity
 */
export async function searchCharacterByDescription(apiKey, uid, projectId, description, topK = 3) {
  const queryEmbedding = await generateEmbedding(apiKey, description);

  const charsCol = collection(db, "users", uid, "projects", projectId, "characters");
  const snap = await getDocs(charsCol);

  const scored = [];
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.embedding) {
      const similarity = cosineSimilarity(queryEmbedding, data.embedding);
      scored.push({
        id: d.id,
        name: data.name,
        description: data.description,
        traits: data.traits,
        similarity,
      });
    }
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

/**
 * Embed all chapters in a project (batch operation)
 */
export async function embedAllChapters(apiKey, uid, projectId, onProgress) {
  const chaptersCol = collection(db, "users", uid, "projects", projectId, "chapters");
  const snap = await getDocs(chaptersCol);

  const results = [];
  for (let i = 0; i < snap.docs.length; i++) {
    const d = snap.docs[i];
    const data = d.data();
    if (data.content && data.content.trim().length > 10 && !data.embedding) {
      await embedChapter(apiKey, uid, projectId, d.id, data.content);
      results.push(d.id);
      if (onProgress) onProgress(i + 1, snap.docs.length);
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return results;
}
