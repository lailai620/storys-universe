import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, User, LogOut, PenTool, Globe, Stars } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';
import Logo from '../logo-v3.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playHover, playClick } = useAudio();
  const [user, setUser] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // 監聽登入狀態與餘額
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from('profiles').select('token_balance').eq('id', user.id).single();
        if (data) setTokenBalance(data.token_balance);
      }
    };
    fetchUser();

    // 監聽 Auth 變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  const handleLogout = async () => {
    playClick();
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleNavigate = (path) => {
    playClick();
    navigate(path);
    setShowDropdown(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 p-6 z-50 flex justify-between items-center pointer-events-none">

      {/* 1. Logo (STORYS) */}
      <div className="pointer-events-auto">
        <button
          onClick={() => navigate('/')}
          onMouseEnter={playHover}
          className="flex items-center rounded-full bg-white/5 border border-white/20 backdrop-blur-md shadow-lg hover:bg-white/10 transition-all overflow-hidden p-1 px-4"
        >
          <img src={Logo} alt="STORYS Logo" className="h-8 md:h-10 object-contain mix-blend-screen" />
        </button>
      </div>

      {/* 右上角功能區 */}
      <div className="flex items-center gap-4 pointer-events-auto">

        {/* 2. 開始創作按鈕 (常駐) */}
        <button
          onClick={() => { playClick(); navigate('/create'); }}
          onMouseEnter={playHover}
          className="hidden md:flex items-center gap-2 px-6 py-2 bg-white text-slate-900 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 transition-all"
        >
          <PenTool size={16} />
          <span>開始創作</span>
        </button>

        {/* 3. 星塵顯示 (若已登入) */}
        {user && (
          <button
            onClick={() => { playClick(); navigate('/profile?tab=vault'); }}
            onMouseEnter={playHover}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-white backdrop-blur-md hover:bg-indigo-900/60 transition-all group"
          >
            <Sparkles size={14} className="text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold text-amber-200">{tokenBalance}</span>
          </button>
        )}

        {/* 4. 個人檔案 / 登入 */}
        <div className="relative">
          <button
            onClick={() => user ? setShowDropdown(!showDropdown) : navigate('/login')}
            onMouseEnter={playHover}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
          >
            {user ? (
              <span className="text-xs font-bold text-white">{user.email[0].toUpperCase()}</span>
            ) : (
              <User size={18} className="text-white" />
            )}
          </button>

          {/* 下拉選單 */}
          {showDropdown && user && (
            <div className="absolute top-12 right-0 w-56 bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
              <div className="px-4 py-3 border-b border-white/5 text-xs text-slate-400 truncate">
                {user.email}
              </div>

              <button onClick={() => handleNavigate('/profile?tab=planet')} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors">
                <Globe size={16} className="text-indigo-400" /> 我的星球
              </button>

              <button onClick={() => handleNavigate('/profile?tab=vault')} onMouseEnter={playHover} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors">
                <Stars size={16} className="text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" /> 星塵庫
              </button>

              <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 border-t border-white/5 transition-colors">
                <LogOut size={16} /> 登出
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;