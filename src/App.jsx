import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { StoryProvider } from './context/StoryContext';

// 引入頁面元件
import Navbar from './components/Navbar';
import Sanctuary from './pages/Sanctuary';
import Login from './pages/Login';
import Creator from './pages/Creator';
import Profile from './pages/Profile';

const AppContent = () => {
  const location = useLocation();
  
  // 🛑 關鍵邏輯：在「首頁 (/)」和「登入頁 (/login)」隱藏通用導航列
  // 這樣首頁就能維持全螢幕深色設計，不會被白條遮擋
  const showNavbar = location.pathname !== '/login' && location.pathname !== '/';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 只有在內頁 (Creator, Profile) 才會出現白色導航列 */}
      {showNavbar && <Navbar />}
      
      <Routes>
        <Route path="/" element={<Sanctuary />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create" element={<Creator />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <StoryProvider>
        <AppContent />
      </StoryProvider>
    </BrowserRouter>
  );
}

export default App;