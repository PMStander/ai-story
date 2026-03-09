import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GeminiProvider } from "./contexts/GeminiContext";
import { AgentProvider } from "./contexts/AgentProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import AgentChat from "./components/AgentChat";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StoryStudio from "./pages/StoryStudio";
import StoryOutline from "./pages/StoryOutline";
import IllustrationStudio from "./pages/IllustrationStudio";
import SeriesManager from "./pages/SeriesManager";
import NicheResearch from "./pages/NicheResearch";
import AssetLibrary from "./pages/AssetLibrary";
import AdsManager from "./pages/AdsManager";
import SocialMedia from "./pages/SocialMedia";
import Analytics from "./pages/Analytics";
import Community from "./pages/Community";
import Publishing from "./pages/Publishing";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import BookWizard from "./pages/BookWizard";
import BookPreview from "./pages/BookPreview";
import BookCanvas from "./pages/BookCanvas";

function AppLayout({ children, showHeader = true }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {showHeader && <Header />}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
      <AgentChat />
    </div>
  );
}

function ProtectedLayout({ children, showHeader = true }) {
  return (
    <ProtectedRoute>
      <AppLayout showHeader={showHeader}>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GeminiProvider>
        <ThemeProvider>
        <AgentProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            }
          />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/book-wizard" element={<ProtectedLayout><BookWizard /></ProtectedLayout>} />
          <Route path="/book-preview" element={<ProtectedRoute><BookPreview /></ProtectedRoute>} />
          <Route path="/book-canvas" element={<ProtectedRoute><BookCanvas /></ProtectedRoute>} />
          <Route path="/story-studio" element={<ProtectedLayout showHeader={false}><StoryStudio /></ProtectedLayout>} />
          <Route path="/story-outline" element={<ProtectedLayout><StoryOutline /></ProtectedLayout>} />
          <Route path="/illustration-studio" element={<ProtectedLayout><IllustrationStudio /></ProtectedLayout>} />
          <Route path="/series-manager" element={<ProtectedLayout><SeriesManager /></ProtectedLayout>} />
          <Route path="/niche-research" element={<ProtectedLayout><NicheResearch /></ProtectedLayout>} />
          <Route path="/asset-library" element={<ProtectedLayout><AssetLibrary /></ProtectedLayout>} />
          <Route path="/ads-manager" element={<ProtectedLayout><AdsManager /></ProtectedLayout>} />
          <Route path="/social-media" element={<ProtectedLayout><SocialMedia /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
          <Route path="/community" element={<ProtectedLayout><Community /></ProtectedLayout>} />
          <Route path="/publishing" element={<ProtectedLayout><Publishing /></ProtectedLayout>} />
          <Route path="/subscription" element={<ProtectedLayout><Subscription /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AgentProvider>
        </ThemeProvider>
        </GeminiProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
