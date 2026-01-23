import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Context Providers
import { StoryProvider } from './context/StoryContext';
import { ToastProvider } from './context/ToastContext';
import { AudioProvider } from './context/AudioContext';

// Pages
import Sanctuary from './pages/Sanctuary';
import Creator from './pages/Creator';
import Gallery from './pages/Gallery';
import Reader from './pages/Reader';       // ✅ 使用新版 Reader
import Login from './pages/Login';
import Profile from './pages/Profile';

const App = () => {
  return (
    <Router basename="/storys-universe">
      <AudioProvider>
        <ToastProvider>
          <StoryProvider>
            <div className="antialiased text-slate-100 bg-[#0f1016] min-h-screen selection:bg-indigo-500/30">
              <Routes>
                {/* 首頁 (已包含 Navbar) */}
                <Route path="/" element={<Sanctuary />} />

                {/* 創作工作坊 */}
                <Route path="/create" element={<Creator />} />

                {/* 畫廊與閱讀器 */}
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/story/:id" element={<Reader />} />

                {/* ✅ 新增：會員系統路由 */}
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </div>
          </StoryProvider>
        </ToastProvider>
      </AudioProvider>
    </Router>
  );
};

export default App;