import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// 引入 Context (確保音效與提示功能正常)
import { AudioProvider } from './context/AudioContext';
import { ToastProvider } from './context/ToastContext';
import { StoryProvider, useStory } from './context/StoryContext';

// 引入導覽列
import Navbar from './components/Navbar';

// 🌟 引入 Onboarding 新手導覽
import { OnboardingProvider } from './components/Onboarding';

// 🌓 引入主題切換
import { ThemeProvider } from './context/ThemeContext';

// 無障礙元件
import { SkipToContent } from './components/ui';

// 🚨 全域錯誤邊界
import ErrorBoundary from './components/ErrorBoundary';

// ✅ 效能優化：使用 lazy loading 延遲載入非首屏頁面
// 這能減少首次載入的 JavaScript 大小，加快首頁呈現速度
const Login = lazy(() => import('./pages/Login'));
const Sanctuary = lazy(() => import('./pages/Sanctuary'));
const Creator = lazy(() => import('./pages/Creator'));
const Profile = lazy(() => import('./pages/Profile'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Reader = lazy(() => import('./pages/Reader'));
const Admin = lazy(() => import('./pages/Admin'));

// 🧒 兒童模式頁面（獨立隔離，不受全域樣式影響）
const ChildReader = lazy(() => import('./pages/ChildReader'));
const NotFound = lazy(() => import('./pages/NotFound'));

// 🌌 載入動畫元件 (Fallback)
const PageLoader = () => (
  <div className="min-h-screen bg-[#0f1016] flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/10 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
    <span className="text-indigo-300/70 text-sm tracking-widest uppercase animate-pulse">
      載入星際資料中...
    </span>
  </div>
);

// 📍 內部內容組件 - 可使用 useLocation
const AppContent = () => {
  const location = useLocation();
  const { appMode } = useStory();
  const isAdminPage = location.pathname === '/admin';

  // 🌌 同步模式到 HTML 根元素
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', appMode);
  }, [appMode]);

  return (
    <div className="min-h-screen bg-[var(--color-background,#0f1016)] text-[var(--color-text-primary,#e2e8f0)] font-sans selection:bg-indigo-500/30 transition-colors duration-500">

      {/* ♯ 無障礙：跳過導航連結 */}
      <SkipToContent />

      {/* 導覽列 - 在後台頁面隱藏 */}
      {!isAdminPage && <Navbar />}

      {/* 🎯 主要內容區 */}
      <main id="main-content" tabIndex="-1" className={`outline-none ${location.pathname !== '/' ? 'pt-16' : ''}`}>

        {/* ✅ 加入頁面切換漸變效果：使用 key 來觸發過場動畫 */}
        <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Suspense fallback={<PageLoader />}>
            {/* 路由設定表 */}
            <Routes location={location}>
              <Route path="/" element={<Sanctuary />} />
              <Route path="/login" element={<Login />} />

              {/* ✅ 新增：註冊 /creator 路徑 */}
              <Route path="/creator" element={<Creator />} />
              <Route path="/create" element={<Creator />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/gallery" element={<Gallery />} />

              {/* 閱讀頁面的動態路由 */}
              <Route path="/story/:id" element={<Reader />} />

              {/* 🧒 兒童閱讀模式（獨立隔離環境） */}
              <Route path="/child-reader" element={<ChildReader />} />
              <Route path="/child-reader/:id" element={<ChildReader />} />

              {/* 🔐 管理後台 */}
              <Route path="/admin" element={<Admin />} />

              {/* 🛸 404 頁面 - 捕捉所有不存在的路由 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </main>

    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <OnboardingProvider>
          <BrowserRouter basename="/storys-universe">
            <AudioProvider>
              <StoryProvider>
                <ToastProvider>
                  <AppContent />
                </ToastProvider>
              </StoryProvider>
            </AudioProvider>
          </BrowserRouter>
        </OnboardingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;