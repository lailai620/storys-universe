import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, User, LogOut, Coins, PenTool, Globe, Wallet } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playHover, playClick } = useAudio();
  const [user, setUser] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // 監聽登入狀態與餘額
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('token_balance')
          .eq('id', userId)
          .single();
        
        if (mounted && data) {
          setTokenBalance(data.token_balance);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    const initializeUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    };

    initializeUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setTokenBalance(0);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    playClick();
    await supabase.auth.signOut();
    setShowDropdown(false);
    navigate('/');
  };

  const handleNavigate = (path) => {
    playClick();
    navigate(path);
    setShowDropdown(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 p-6 z-50 flex justify-between items-center pointer-events-none">
      
      <div className="pointer-events-auto">
        <button 
            onClick={() => navigate('/')}
            onMouseEnter={playHover}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#0f1016]/80 border border-white/20 backdrop-blur-md shadow-lg hover:bg-white/10 transition-all group"
        >
            <Sparkles size={14} className="text-amber-300 group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-bold tracking-[0.2em] text-white uppercase shadow-black drop-shadow-md">STORYS</span>
        </button>
      </div>

      <div className="flex items-center gap-4 pointer-events-auto">
        
        <button 
            onClick={() => { playClick(); navigate('/create'); }}
            onMouseEnter={playHover}
            className="hidden md:flex items-center gap-2 px-6 py-2 bg-white text-slate-900 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 transition-all"
        >
            <PenTool size={16} />
            <span>開始創作</span>
        </button>

        {user && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 text-white backdrop-blur-md">
                <Coins size={14} className="text-amber-400" />
                <span className="text-xs font-bold">{tokenBalance}</span>
            </div>
        )}

        <div className="relative">
            <button 
                onClick={() => user ? setShowDropdown(!showDropdown) : navigate('/login')}
                onMouseEnter={playHover}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20 flex items-center justify-center shadow-lg hover:scale-105 transition-all text-white overflow-hidden"
            >
                {user ? (
                    <span className="text-xs font-bold">{user.email[0].toUpperCase()}</span>
                ) : (
                    <User size={18} />
                )}
            </button>

            {showDropdown && user && (
                <div className="absolute top-12 right-0 w-56 bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col z-50">
                    <div className="px-4 py-3 border-b border-white/5 text-xs text-slate-400 truncate bg-black/20">
                        {user.email}
                    </div>
                    
                    <button onClick={() => handleNavigate('/profile?tab=planet')} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors">
                        <Globe size={16} className="text-indigo-400"/> 我的星球
                    </button>
                    
                    <button onClick={() => handleNavigate('/profile?tab=vault')} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors">
                        <Wallet size={16} className="text-amber-400"/> 我的金庫
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
