import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// 原生 App 整合
import { initNativeFeatures } from './utils/native';

// 🚨 錯誤監控
import { initErrorMonitoring } from './services/errorService';

// 📊 效能監控
import { initPerformanceMonitoring } from './services/performanceService';

// 💎 訂閱服務
import { initPurchases } from './services/subscriptionService';

// 引入 Context
import { AudioProvider } from './context/AudioContext';
import { ToastProvider } from './context/ToastContext';
import { StoryProvider, useStory } from './context/StoryContext';
import { AuthProvider } from './context/AuthContext';

// 引入導覽列
import Navbar from './components/Navbar';

// 🌟 引入 Onboarding 新手導覽
import { OnboardingProvider } from './components/Onboarding';

// 🌓 引入主題切換
import { ThemeProvider } from './context/ThemeContext';

// 無障礙元件
import { SkipToContent, MobileBottomNav, Footer, CookieConsent } from './components/ui';

// 🚨 全域錯誤邊界
import ErrorBoundary from './components/ErrorBoundary';

// ✅ 效能優化：lazy loading
// 已棄用：舊版 Storys 登入頁由 WeavingLogin 取代（第 85 行）
const Login = lazy(() => import('./pages/weaving/WeavingLogin'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

// 🌟 織光核心頁面
const WeavingHome = lazy(() => import('./pages/weaving/WeavingHome'));
const StoryMode = lazy(() => import('./pages/weaving/StoryMode'));
const StoryCreationOptions = lazy(() => import('./pages/weaving/StoryCreationOptions'));
const ManualStoryWrite = lazy(() => import('./pages/weaving/ManualStoryWrite'));
const StoryCollection = lazy(() => import('./pages/weaving/StoryCollection'));
const LightSourceCategory = lazy(() => import('./pages/weaving/LightSourceCategory'));
const LiveWeaving = lazy(() => import('./pages/weaving/LiveWeaving'));
const Timeline = lazy(() => import('./pages/weaving/Timeline'));
const TimelineDay = lazy(() => import('./pages/weaving/TimelineDay'));

// 🎤 語音系列
const VoiceWhisper = lazy(() => import('./pages/weaving/VoiceWhisper'));
const VoiceWeave = lazy(() => import('./pages/weaving/VoiceWeave'));
const VoiceListen = lazy(() => import('./pages/weaving/VoiceListen'));
const VoiceTranscript = lazy(() => import('./pages/weaving/VoiceTranscript'));
const BroadcastStation = lazy(() => import('./pages/weaving/BroadcastStation'));
const FamilyVoices = lazy(() => import('./pages/weaving/FamilyVoices'));

// 👥 家人協作
const InviteFamily = lazy(() => import('./pages/weaving/InviteFamily'));
const LiveVoiceCollab = lazy(() => import('./pages/weaving/LiveVoiceCollab'));

// 📖 編織成書
const WeaveBook = lazy(() => import('./pages/weaving/WeaveBook'));
const BookCustomize = lazy(() => import('./pages/weaving/BookCustomize'));
const DigitalBook = lazy(() => import('./pages/weaving/DigitalBook'));
const ShareLight = lazy(() => import('./pages/weaving/ShareLight'));
const WeavingSummary = lazy(() => import('./pages/weaving/WeavingSummary'));

// 💎 Pro 訂閱
const SupportPro = lazy(() => import('./pages/weaving/SupportPro'));

// ✨ 織光新手引導
const Onboarding = lazy(() => import('./pages/weaving/Onboarding'));

// ⚙ 織光設定頁
const WeavingSettings = lazy(() => import('./pages/weaving/WeavingSettings'));

// 📖 故事詳情頁
const StoryDetail = lazy(() => import('./pages/weaving/StoryDetail'));

// 💬 訪客便利貼留言頁
const GuestComment = lazy(() => import('./pages/weaving/GuestComment'));

// 🔍 AI 時光機
const MemorySearch = lazy(() => import('./pages/weaving/MemorySearch'));

// 🔮 光球主畫面
const SphereScreen = lazy(() => import('./pages/weaving/SphereScreen'));

// 🔐 織光登入頁
const WeavingLogin = lazy(() => import('./pages/weaving/WeavingLogin'));

// ✨ 織光載入動畫
const PageLoader = () => (
  <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-primary-light/10 border-b-primary-light rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
    <span className="text-primary/70 text-sm tracking-widest animate-pulse font-display">
      織光載入中...
    </span>
  </div>
);

// 📍 內部內容組件 - 可使用 useLocation
// 🌟 織光頁面路徑清單 — 使用 WeavingLayout 自帶導航，不需要原本的 Navbar/Footer
const WEAVING_PATHS = [
  '/', '/onboarding', '/story-mode', '/story-options', '/story-write', '/story-collection', '/light-sources', '/live-weaving', '/timeline', '/memory-search',
  '/voice-whisper', '/voice-weave', '/voice-listen', '/voice-transcript', '/broadcast', '/family-voices',
  '/invite-family', '/voice-collab', '/weave-book', '/book-customize', '/share', '/summary', '/support-pro', '/settings', '/story-detail', '/login', '/comment', '/privacy', '/terms',
  '/sphere',
];

// Helper 函式來判斷是否為 Weaving 頁面，包括動態路由
const isWeavingRoute = (pathname) => {
    if (WEAVING_PATHS.includes(pathname)) return true;
    if (pathname.startsWith('/digital-book')) return true;
    if (pathname.startsWith('/story-detail')) return true;
    if (pathname.startsWith('/timeline/day')) return true;
    return false;
};

// ✨ 首頁包裝器：未完成 Onboarding 的使用者自動導向引導頁
const WeavingHomeWithOnboarding = () => {
  const onboardingDone = localStorage.getItem('weaving_onboarding_done') === 'true';
  if (!onboardingDone) {
    return <Navigate to="/onboarding" replace />;
  }
  return <WeavingHome />;
};

const AppContent = () => {
  const location = useLocation();
  const { appMode } = useStory();
  const isAdminPage = location.pathname === '/admin';

  // 判斷是否為織光頁面（使用 WeavingLayout，自帶導航的頁面）
  const isWeavingPage = isWeavingRoute(location.pathname);

  // 🌌 同步模式到 HTML 根元素
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', appMode);
  }, [appMode]);

  // 📱 初始化原生功能 + 錯誤監控
  useEffect(() => {
    initNativeFeatures();
    initErrorMonitoring();
    initPerformanceMonitoring();
    initPurchases(); // 🎯 初始化 RevenueCat
    // 設定無障礙語言標記
    document.documentElement.lang = 'zh-TW';
  }, []);

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark font-body selection:bg-primary/30 transition-colors duration-500">

      {/* ♯ 無障礙：跳過導航連結 */}
      <SkipToContent />

      {/* 導覽列 — 織光頁面使用自帶 WeavingLayout，隱藏原有 Navbar */}
      {!isAdminPage && !isWeavingPage && <Navbar />}

      {/* 🎯 主要內容區 */}
      <main id="main-content" tabIndex="-1" className={`outline-none ${isWeavingPage ? '' : `pb-20 md:pb-0 ${location.pathname !== '/' ? 'pt-16' : ''}`}`} style={isWeavingPage ? {} : { paddingBottom: 'max(5rem, calc(4rem + env(safe-area-inset-bottom, 0px)))' }}>

        {/* ✅ 加入頁面切換漸變效果 */}
        <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Suspense fallback={<PageLoader />}>
            {/* 🌟 織光路由設定表 */}
            <Routes location={location}>
              {/* ✨ 新手 Onboarding */}
              <Route path="/onboarding" element={<Onboarding />} />

              {/* 首頁 — 光源宇宙 */}
              <Route path="/" element={<WeavingHomeWithOnboarding />} />
              <Route path="/login" element={<WeavingLogin />} />

              {/* 🌟 故事記錄 */}
              <Route path="/story-mode" element={<StoryMode />} />
              <Route path="/story-options" element={<StoryCreationOptions />} />
              <Route path="/story-write" element={<ManualStoryWrite />} />
              <Route path="/story-collection" element={<StoryCollection />} />
              <Route path="/story-detail/:storyId" element={<StoryDetail />} />
              <Route path="/comment" element={<GuestComment />} />
              <Route path="/light-sources" element={<LightSourceCategory />} />
              <Route path="/live-weaving" element={<LiveWeaving />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/timeline/day/:date" element={<TimelineDay />} />
              <Route path="/memory-search" element={<MemorySearch />} />
              <Route path="/sphere" element={<SphereScreen />} />

              {/* 🎤 語音系列 */}
              <Route path="/voice-whisper" element={<VoiceWhisper />} />
              <Route path="/voice-weave" element={<VoiceWeave />} />
              <Route path="/voice-listen" element={<VoiceListen />} />
              <Route path="/voice-transcript" element={<VoiceTranscript />} />
              <Route path="/broadcast" element={<BroadcastStation />} />
              <Route path="/family-voices" element={<FamilyVoices />} />

              {/* 👥 家人協作 */}
              <Route path="/invite-family" element={<InviteFamily />} />
              <Route path="/voice-collab" element={<LiveVoiceCollab />} />

              {/* 📖 編織成書 */}
              <Route path="/weave-book" element={<WeaveBook />} />
              <Route path="/book-customize" element={<BookCustomize />} />
              <Route path="/digital-book/:id" element={<DigitalBook />} />
              <Route path="/digital-book" element={<Navigate to="/weave-book" replace />} />
              <Route path="/share" element={<ShareLight />} />
              <Route path="/summary" element={<WeavingSummary />} />

              {/* 💎 Pro & 設定 */}
              <Route path="/support-pro" element={<SupportPro />} />
              <Route path="/settings" element={<WeavingSettings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />

              {/* 📜 法律頁面 */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* 🛸 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      {/* 🦶 全站 Footer — 織光頁面隱藏 */}
      {!isWeavingPage && <Footer />}

      {/* 🍪 Cookie 同意橫幅 */}
      <CookieConsent />

      {/* 📱 手機端底部導航 — 織光頁面使用自帶 WeavingBottomNav */}
      {!isWeavingPage && <MobileBottomNav />}

    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <OnboardingProvider>
          <HashRouter>
            <AuthProvider>
              <AudioProvider>
                <StoryProvider>
                  <ToastProvider>
                    <AppContent />
                  </ToastProvider>
                </StoryProvider>
              </AudioProvider>
            </AuthProvider>
          </HashRouter>
        </OnboardingProvider>
      </ThemeProvider>
    </ErrorBoundary >
  );
}

export default App;