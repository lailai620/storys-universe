import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { supabase } from '../supabaseClient';
import { Menu, X, User, LogOut, Zap, BookOpen, Layout } from 'lucide-react';

const Navbar = () => {
  const { user, balance } = useStory();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 text-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-wider text-indigo-600 hover:opacity-80 transition-opacity">
            <SparklesIcon />
            STORYS
          </Link>

          {/* 電腦版選單 */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/home" className="hover:text-indigo-600 transition-colors font-medium text-sm">探索</Link>
                <Link to="/create" className="hover:text-indigo-600 transition-colors font-medium text-sm">創作</Link>
                
                {/* 錢包狀態 */}
                <Link to="/wallet" className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200 hover:bg-amber-100 transition-colors">
                    <Zap size={14} fill="currentColor" />
                    {balance}
                </Link>

                {/* 個人選單 */}
                <div className="relative group">
                    <button className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                            {user.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={16} className="text-slate-500" />
                            )}
                        </div>
                    </button>
                    {/* 下拉選單 */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
                        <div className="py-2">
                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"><BookOpen size={16}/> 我的畫廊</Link>
                            <Link to="/wallet" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"><Zap size={16}/> 靈魂金庫</Link>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 text-left"><LogOut size={16}/> 登出</button>
                        </div>
                    </div>
                </div>
              </>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">登入</Link>
                <Link to="/login" className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200">開始體驗</Link>
              </div>
            )}
          </div>

          {/* 手機版漢堡選單按鈕 */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* 手機版展開選單 */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-6 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 py-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                        {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover"/> : <User size={20}/>}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">{user.email?.split('@')[0]}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Zap size={12} className="text-amber-500"/> {balance} SEED</p>
                    </div>
                </div>
                <Link to="/home" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"><Layout size={18}/> 探索故事</Link>
                <Link to="/create" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"><SparklesIcon size={18}/> 開始創作</Link>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"><BookOpen size={18}/> 我的畫廊</Link>
                <Link to="/wallet" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"><Zap size={18}/> 靈魂金庫</Link>
                <button onClick={handleLogout} className="flex items-center gap-3 px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg mt-2"><LogOut size={18}/> 登出</button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-4">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-3 text-center border border-slate-200 rounded-xl font-bold text-slate-600">登入</Link>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-3 text-center bg-indigo-600 text-white rounded-xl font-bold shadow-lg">註冊帳號</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// 簡單的 Logo Icon
const SparklesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" />
    </svg>
);

export default Navbar;