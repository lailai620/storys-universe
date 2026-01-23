import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';

// 假設你有用 lucide-react 的圖示，如果沒有可以拿掉
import { LogIn, Sparkles } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { playClick, playHover } = useAudio();
  const { showToast } = useToast();

  // 檢查是否已登入，如果已登入直接踢去首頁
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    playClick(); // 播放點擊音效

    try {
      // 🧠 核心修改：智慧判斷環境
      // import.meta.env.DEV 是 Vite 內建變數，開發模式時為 true
      const redirectUrl = import.meta.env.DEV
        ? 'http://localhost:5173'  // 本機開發環境
        : 'https://lailai620.github.io/storys-universe/'; // 線上正式環境

      console.log('正在登入，準備跳轉至:', redirectUrl); // 除錯用

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // 注意：OAuth 登入會直接跳轉離開頁面，所以這裡不需要寫 navigate

    } catch (error) {
      console.error('登入錯誤:', error);
      showToast(error.message || '登入失敗，請稍後再試', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* 背景特效 (可以根據你的喜好調整) */}
      <div className="absolute inset-0 bg-[#0f1016]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0f1016] to-[#0f1016]"></div>
      </div>

      {/* 登入卡片 */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-indigo-500/10">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200">
              歡迎回到宇宙
            </h1>
            <p className="text-slate-400 mt-2">
              登入以繼續你的星際旅程
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            onMouseEnter={playHover}
            className="w-full group relative px-4 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-600 hover:border-indigo-500/50 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
          >
            {/* 按鈕發光特效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="font-medium tracking-wide">使用 Google 帳號登入</span>
          </button>

          <div className="mt-6 text-center text-xs text-slate-500">
            登入即代表您同意我們的星際航行條款
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;