const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * When a chapter is created or updated with content, generate an embedding.
 * This reads the user's Gemini API key from their settings to generate embeddings.
 */
exports.generateChapterEmbedding = onDocumentWritten(
  "users/{userId}/projects/{projectId}/chapters/{chapterId}",
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();

    if (!after) return; // Document was deleted

    // Skip if content hasn't changed or is too short
    if (after.content === before?.content) return;
    if (!after.content || after.content.trim().length < 10) return;

    // Skip if embedding already exists for this content
    if (after.embedding && after.content === before?.content) return;

    const userId = event.params.userId;

    try {
      // Get user's Gemini API key
      const settingsDoc = await db.doc(`users/${userId}/settings/gemini`).get();
      const apiKey = settingsDoc.data()?.apiKey;
      if (!apiKey) {
        console.log(`No API key for user ${userId}, skipping embedding`);
        return;
      }

      // Generate embedding using user's API key
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(after.content);
      const embedding = result.embedding.values;

      // Store embedding back in the document
      await event.data.after.ref.update({
        embedding,
        embeddingUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Embedded chapter ${event.params.chapterId} (${embedding.length} dims)`);
    } catch (err) {
      console.error("Embedding generation failed:", err.message);
    }
  }
);

/**
 * When a character is created or updated, generate an embedding from its description.
 */
exports.generateCharacterEmbedding = onDocumentWritten(
  "users/{userId}/projects/{projectId}/characters/{characterId}",
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();

    if (!after) return;
    if (after.description === before?.description) return;
    if (!after.description || after.description.trim().length < 5) return;

    const userId = event.params.userId;

    try {
      const settingsDoc = await db.doc(`users/${userId}/settings/gemini`).get();
      const apiKey = settingsDoc.data()?.apiKey;
      if (!apiKey) return;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

      // Combine name, description, and traits for richer embedding
      const text = [
        after.name || "",
        after.description || "",
        (after.traits || []).join(", "),
      ].filter(Boolean).join(". ");

      const result = await model.embedContent(text);
      const embedding = result.embedding.values;

      await event.data.after.ref.update({
        embedding,
        embeddingUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Embedded character ${event.params.characterId}`);
    } catch (err) {
      console.error("Character embedding failed:", err.message);
    }
  }
);
