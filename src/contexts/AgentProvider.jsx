import { createContext, useContext, useState, useCallback, useRef } from "react";
import { sendChatMessage } from "../lib/agentApi";
import { useGemini } from "./GeminiContext";

const AgentContext = createContext(null);

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) throw new Error("useAgent must be used within AgentProvider");
  return context;
}

export function AgentProvider({ children }) {
  const { apiKey, hasApiKey } = useGemini();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageContext, setPageContext] = useState({});
  const actionHandlersRef = useRef({});

  // Register action handler from a page component
  const registerActionHandler = useCallback((actionType, handler) => {
    actionHandlersRef.current[actionType] = handler;
    return () => {
      delete actionHandlersRef.current[actionType];
    };
  }, []);

  // Send a message to the agent
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !hasApiKey) return;

      const userMsg = { role: "user", content: text, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const result = await sendChatMessage({
          message: text,
          apiKey,
          pageContext,
        });

        const agentMsg = {
          role: "agent",
          content: result.reply,
          actions: result.actions || [],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, agentMsg]);

        // Execute actions
        for (const action of result.actions || []) {
          const handler = actionHandlersRef.current[action.action];
          if (handler) {
            try {
              handler(action);
            } catch (e) {
              console.error(`Action handler failed for ${action.action}:`, e);
            }
          }
        }
      } catch (err) {
        const errorMsg = {
          role: "agent",
          content: `⚠️ ${err.message}`,
          error: true,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, hasApiKey, pageContext]
  );

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);
  const clearChat = useCallback(() => setMessages([]), []);

  const value = {
    isOpen,
    setIsOpen,
    toggleOpen,
    messages,
    loading,
    sendMessage,
    clearChat,
    pageContext,
    setPageContext,
    registerActionHandler,
    hasApiKey,
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}
