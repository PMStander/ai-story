import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
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

function AppLayout({ children, showHeader = true }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {showHeader && <Header />}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route
          path="/story-studio"
          element={
            <AppLayout showHeader={false}>
              <StoryStudio />
            </AppLayout>
          }
        />
        <Route path="/story-outline" element={<AppLayout><StoryOutline /></AppLayout>} />
        <Route path="/illustration-studio" element={<AppLayout><IllustrationStudio /></AppLayout>} />
        <Route path="/series-manager" element={<AppLayout><SeriesManager /></AppLayout>} />
        <Route path="/niche-research" element={<AppLayout><NicheResearch /></AppLayout>} />
        <Route path="/asset-library" element={<AppLayout><AssetLibrary /></AppLayout>} />
        <Route path="/ads-manager" element={<AppLayout><AdsManager /></AppLayout>} />
        <Route path="/social-media" element={<AppLayout><SocialMedia /></AppLayout>} />
        <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
        <Route path="/community" element={<AppLayout><Community /></AppLayout>} />
        <Route path="/publishing" element={<AppLayout><Publishing /></AppLayout>} />
        <Route path="/subscription" element={<AppLayout><Subscription /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
