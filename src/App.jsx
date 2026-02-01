import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 引入 Context (確保音效與提示功能正常)
import { AudioProvider } from './context/AudioContext';
import { ToastProvider } from './context/ToastContext';
import { StoryProvider } from './context/StoryContext';

// 引入導覽列
import Navbar from './components/Navbar';

// ✅ 效能優化：使用 lazy loading 延遲載入非首屏頁面
// 這能減少首次載入的 JavaScript 大小，加快首頁呈現速度
const Login = lazy(() => import('./pages/Login'));
const Sanctuary = lazy(() => import('./pages/Sanctuary'));
const Creator = lazy(() => import('./pages/Creator'));
const Profile = lazy(() => import('./pages/Profile'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Reader = lazy(() => import('./pages/Reader'));

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

function App() {
  return (
    // basename 設定確保在 GitHub Pages 子目錄下正常運作
    <BrowserRouter basename="/storys-universe">

      <AudioProvider>
        <StoryProvider>
          <ToastProvider>
            {/* 全域背景與字體設定 */}
            <div className="min-h-screen bg-[#0f1016] text-slate-200 font-sans selection:bg-indigo-500/30">

              {/* 導覽列 (會在所有頁面顯示) */}
              <Navbar />

              {/* ✅ Suspense 邊界：所有 lazy 元件必須包在 Suspense 內 */}
              <Suspense fallback={<PageLoader />}>
                {/* 路由設定表 */}
                <Routes>
                  <Route path="/" element={<Sanctuary />} />
                  <Route path="/login" element={<Login />} />

                  {/* ✅ 新增：註冊 /creator 路徑 */}
                  <Route path="/creator" element={<Creator />} />
                  <Route path="/create" element={<Creator />} />

                  <Route path="/profile" element={<Profile />} />
                  <Route path="/gallery" element={<Gallery />} />

                  {/* 閱讀頁面的動態路由 */}
                  <Route path="/story/:id" element={<Reader />} />
                </Routes>
              </Suspense>

            </div>
          </ToastProvider>
        </StoryProvider>
      </AudioProvider>

    </BrowserRouter>
  );
}

export default App;