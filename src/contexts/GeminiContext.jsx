import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getGeminiApiKey } from "../lib/firestore";

const GeminiContext = createContext(null);

export function useGemini() {
  const context = useContext(GeminiContext);
  if (!context) throw new Error("useGemini must be used within GeminiProvider");
  return context;
}

export function GeminiProvider({ children }) {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setApiKey("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const key = await getGeminiApiKey(user.uid);
        if (!cancelled) setApiKey(key || "");
      } catch {
        if (!cancelled) setApiKey("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const hasApiKey = Boolean(apiKey);

  const value = {
    apiKey,
    setApiKey,
    hasApiKey,
    loading,
  };

  return (
    <GeminiContext.Provider value={value}>
      {children}
    </GeminiContext.Provider>
  );
}
