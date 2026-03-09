/**
 * API client for the AI Story Agent backend (Cloud Run / local dev)
 */

const AGENT_URL = import.meta.env.VITE_AGENT_URL || 'http://localhost:8080';

/**
 * Send a chat message to the AI agent
 * @param {Object} params
 * @param {string} params.message - The user's message
 * @param {string} params.apiKey - The user's Gemini API key
 * @param {Object} [params.pageContext] - Current page context
 * @param {Array} [params.chatHistory] - Previous messages
 * @returns {Promise<{reply: string, actions: Array}>}
 */
export async function sendChatMessage({ message, apiKey, pageContext, chatHistory }) {
  const response = await fetch(`${AGENT_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      apiKey,
      pageContext,
      chatHistory,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Agent request failed' }));
    throw new Error(err.details || err.error || `Request failed (${response.status})`);
  }

  return response.json();
}
