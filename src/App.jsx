import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 引入 Context (確保音效與提示功能正常)
import { AudioProvider } from './context/AudioContext';
import { ToastProvider } from './context/ToastContext';

// 引入導覽列
import Navbar from './components/Navbar';

// 引入所有頁面
import Login from './pages/Login';
import Sanctuary from './pages/Sanctuary';
import Creator from './pages/Creator';
import Profile from './pages/Profile';
import Gallery from './pages/Gallery';
import Reader from './pages/Reader';

function App() {
  return (
    // ⚠️ 關鍵修正：這裡必須加上 basename，內容就是你的 GitHub 專案名稱
    // 這樣 Router 才知道它現在是在子目錄底下運作
    <BrowserRouter basename="/storys-universe">

      <AudioProvider>
        <ToastProvider>
          {/* 全域背景設定 */}
          <div className="min-h-screen bg-[#0f1016] text-slate-200 font-sans selection:bg-indigo-500/30">

            {/* 導覽列 (會在所有頁面顯示) */}
            <Navbar />

            {/* 路由設定 */}
            <Routes>
              <Route path="/" element={<Sanctuary />} />
              <Route path="/login" element={<Login />} />
              <Route path="/creator" element={<Creator />} />
              <Route path="/create" element={<Creator />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/gallery" element={<Gallery />} />

              {/* 閱讀頁面的動態路由 */}
              <Route path="/story/:id" element={<Reader />} />
            </Routes>

          </div>
        </ToastProvider>
      </AudioProvider>

    </BrowserRouter>
  );
}

export default App;