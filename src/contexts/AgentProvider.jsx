import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { sendChatMessage } from "../lib/agentApi";
import { useGemini } from "./GeminiContext";
import { useAuth } from "./AuthContext";
import {
  createSeries,
  createProject,
  getUserProjects,
  getUserSeries,
  createChat,
  updateChatMessages,
  updateChatTitle,
  getUserChats,
  deleteChat,
} from "../lib/firestore";
import { useNavigate } from "react-router-dom";

const AgentContext = createContext(null);

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) throw new Error("useAgent must be used within AgentProvider");
  return context;
}

export function AgentProvider({ children }) {
  const { apiKey, hasApiKey } = useGemini();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageContext, setPageContext] = useState({});
  const [globalContext, setGlobalContext] = useState(null);

  // Chat persistence state
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const actionHandlersRef = useRef({});
  const saveDebounceRef = useRef(null);

  // Background fetch of global library context
  useEffect(() => {
    if (!user) return;
    const fetchContext = async () => {
      try {
        const [series, projects] = await Promise.all([
          getUserSeries(user.uid),
          getUserProjects(user.uid)
        ]);
        const libraryData = {
          totalSeries: series.length,
          totalBooks: projects.length,
          series: series.map(s => ({
            id: s.id,
            name: s.name,
            niche: s.niche,
            bookCount: (s.bookIds || []).length,
            researchCount: (s.research || []).length,
          })),
          books: projects.map(p => ({
            id: p.id,
            title: p.title,
            genre: p.genre,
            status: p.status,
            seriesId: p.seriesId || null,
          }))
        };
        setGlobalContext(libraryData);
      } catch (err) {
        console.warn("Failed to fetch global context for agent:", err);
      }
    };
    fetchContext();
  }, [user]);

  // Load chat list on mount
  useEffect(() => {
    if (!user) return;
    getUserChats(user.uid)
      .then(setChatList)
      .catch((e) => console.warn("Failed to load chats:", e));
  }, [user]);

  // Debounced save of messages to Firestore
  const persistMessages = useCallback(
    (chatId, msgs) => {
      if (!user || !chatId) return;
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(async () => {
        try {
          await updateChatMessages(user.uid, chatId, msgs);
        } catch (e) {
          console.warn("Failed to save chat messages:", e);
        }
      }, 800);
    },
    [user]
  );

  // Register action handler from a page component
  const registerActionHandler = useCallback((actionType, handler) => {
    actionHandlersRef.current[actionType] = handler;
    return () => {
      delete actionHandlersRef.current[actionType];
    };
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveChatId(null);
    setShowHistory(false);
  }, []);

  const loadChat = useCallback(async (chat) => {
    setMessages(chat.messages || []);
    setActiveChatId(chat.id);
    setShowHistory(false);
  }, []);

  const removeChatFromList = useCallback(async (chatId) => {
    if (!user) return;
    try {
      await deleteChat(user.uid, chatId);
      setChatList((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        setMessages([]);
        setActiveChatId(null);
      }
    } catch (e) {
      console.warn("Failed to delete chat:", e);
    }
  }, [user, activeChatId]);

  // Send a message to the agent
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !hasApiKey) return;

      const userMsg = { role: "user", content: text, timestamp: Date.now() };

      // Create a new chat doc on first message if needed
      let chatId = activeChatId;
      if (!chatId && user) {
        try {
          const title = text.slice(0, 60) + (text.length > 60 ? "…" : "");
          chatId = await createChat(user.uid, title);
          setActiveChatId(chatId);
          setChatList((prev) => [
            { id: chatId, title, messages: [], updatedAt: { seconds: Date.now() / 1000 } },
            ...prev,
          ]);
        } catch (e) {
          console.warn("Failed to create chat:", e);
        }
      }

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setLoading(true);

      // Update the chat title with the first user message if it's still new
      if (chatId && user && messages.length === 0) {
        const title = text.slice(0, 60) + (text.length > 60 ? "…" : "");
        updateChatTitle(user.uid, chatId, title).catch(() => {});
        setChatList((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, title } : c))
        );
      }

      try {
        const result = await sendChatMessage({
          message: text,
          apiKey,
          pageContext,
          globalContext,
        });

        const agentMsg = {
          role: "agent",
          content: result.reply,
          actions: result.actions || [],
          timestamp: Date.now(),
        };
        const finalMessages = [...newMessages, agentMsg];
        setMessages(finalMessages);
        persistMessages(chatId, finalMessages);

        // Execute actions
        // First, batch all character additions to avoid stale-closure overwrite
        const characterAdditions = (result.actions || []).filter(
          (a) => a.action === 'add_series_character'
        );
        if (characterAdditions.length > 0) {
          const handler = actionHandlersRef.current['add_series_character'];
          if (handler) {
            try { handler({ action: 'add_series_character', _batch: characterAdditions }); }
            catch (e) { console.error('add_series_character batch failed:', e); }
          }
        }

        for (const action of result.actions || []) {
          // skip individual character additions — handled above as a batch
          if (action.action === 'add_series_character') continue;

          if (action.action === 'create_series' && user) {

            try {
              await createSeries(user.uid, {
                name: action.name,
                description: action.description || '',
                niche: action.niche || '',
              });
              setMessages((prev) => [...prev, {
                role: 'agent',
                content: `✅ Series "${action.name}" created! Navigating to Series Manager…`,
                timestamp: Date.now(),
              }]);
              navigate('/series-manager');
              continue;
            } catch (e) { console.error('create_series action failed:', e); }
          }

          if (action.action === 'create_book' && user) {
            try {
              const projectId = await createProject(user.uid, {
                title: action.title,
                genre: action.genre || 'adventure',
                targetAge: action.targetAge || '3-6',
                synopsis: action.synopsis || '',
                bookType: action.bookType || 'picture-book',
              });
              setMessages((prev) => [...prev, {
                role: 'agent',
                content: `✅ Book "${action.title}" created! Opening Story Studio…`,
                timestamp: Date.now(),
              }]);
              navigate(`/story-studio?project=${projectId}`);
              continue;
            } catch (e) { console.error('create_book action failed:', e); }
          }

          if (action.action === 'redirect_book_wizard') {
            const params = new URLSearchParams();
            if (action.topic) params.set('topic', action.topic);
            if (action.genre) params.set('genre', action.genre);
            if (action.targetAge) params.set('targetAge', action.targetAge);
            navigate(`/book-wizard?${params.toString()}`);
            continue;
          }

          // Style guide actions — notify the registered SeriesManager handler
          if (action.action === 'add_series_character' || action.action === 'update_series_style_guide') {
            const handler = actionHandlersRef.current[action.action];
            if (handler) {
              try { handler(action); } catch (e) { console.error(`Action ${action.action} failed:`, e); }
            } else {
              console.warn(`No handler registered for ${action.action}. Make sure you are on the Series Manager page.`);
            }
            continue;
          }

          const handler = actionHandlersRef.current[action.action];
          if (handler) {
            try { handler(action); } catch (e) { console.error(`Action handler failed for ${action.action}:`, e); }
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
    [apiKey, hasApiKey, pageContext, globalContext, user, navigate, activeChatId, messages, persistMessages]
  );

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);
  const clearChat = useCallback(() => {
    setMessages([]);
    setActiveChatId(null);
  }, []);

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
    // Chat history
    activeChatId,
    chatList,
    showHistory,
    setShowHistory,
    startNewChat,
    loadChat,
    removeChatFromList,
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}
