import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../firebaseConfig'; // 保持原有的引用路徑
import { useStory } from '../context/StoryContext';
import { Sparkles, ArrowRight, Loader2, Lock, Mail } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, createStory, fetchStories } = useStory();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fromCreator = location.state?.returnTo === '/create';

  // 監聽登入狀態變化 (邏輯保持不變，也能處理 Google 登入後的跳轉回歸)
  useEffect(() => {
    const handlePendingStory = async () => {
      if (user) {
        // 1. 檢查是否有暫存的訪客故事
        const pendingStoryJson = localStorage.getItem('pending_story');
        
        if (pendingStoryJson) {
          setIsSaving(true);
          try {
            const storyData = JSON.parse(pendingStoryJson);
            
            // 2. 執行封存 (寫入 DB)
            await createStory({
              title: storyData.title,
              content: storyData.content,
              cover_image: storyData.cover_image,
              category: storyData.category || 'memoir',
              visibility: storyData.visibility || 'private',
              memory_date: storyData.memory_date || new Date().toISOString()
            });

            // 3. 清除暫存
            localStorage.removeItem('pending_story');
            
            // 4. 強制刷新資料
            if (fetchStories) await fetchStories();

            // 5. 導向個人畫廊
            navigate('/profile');
            
          } catch (error) {
            console.error("Auto-save failed:", error);
            alert("封存過程中發生異常，請聯繫管理員，您的故事暫時保存在本機。");
            setIsSaving(false);
          }
        } else {
          // 一般登入
          navigate(fromCreator ? '/create' : '/');
        }
      }
    };

    handlePendingStory();
  }, [user, navigate, createStory, fetchStories, fromCreator]);

  // Email 登入邏輯
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      setMessage('魔法連結已發送至您的信箱，請點擊登入。');
    } catch (error) {
      setMessage(error.message || '發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // Google 登入邏輯
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 使用 origin 確保導回網站根目錄，這是最穩定的設定
          // 請務必確認 Supabase 後台的 Redirect URL 已包含此網址
          redirectTo: window.location.origin, 
        }
      });
      if (error) throw error;
      // 注意：OAuth 會觸發頁面跳轉，因此這邊不一定會執行到 setGoogleLoading(false)
    } catch (error) {
      console.error("Google login error:", error);
      setMessage('Google 登入啟動失敗，請檢查 Supabase 設定');
      setGoogleLoading(false);
    }
  };

  if (isSaving) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Sparkles size={48} className="text-amber-300 animate-pulse mb-6" />
        <h2 className="text-2xl font-serif font-bold mb-2">正在封存您的回憶...</h2>
        <p className="text-slate-400">請稍候，我們正在將這段時光放入保險箱</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* 背景裝飾 */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-900/50 p-8 md:p-12 rounded-3xl border border-slate-700/50 backdrop-blur-xl relative z-10 shadow-2xl animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-4 ring-1 ring-slate-700">
            <Lock size={20} className="text-indigo-400" />
          </div>
          <h1 className="text-3xl font-serif text-white mb-2">
            {fromCreator ? "封存這段回憶" : "回到 Storys"}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {fromCreator 
              ? "登入後，我們將為您永久保存這段故事，\n並贈送您 500 SEED 作為見面禮。" 
              : "選擇您習慣的方式，繼續書寫旅程。"}
          </p>
        </div>

        <div className="space-y-6">
            {/* Google 登入按鈕 */}
            <button
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3 relative overflow-hidden"
            >
                {googleLoading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>使用 Google 帳號登入</span>
                    </>
                )}
            </button>

            {/* 分隔線 */}
            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs tracking-widest uppercase">或者使用 Email</span>
                <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* Email 表單 */}
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full bg-slate-800 text-slate-200 font-bold py-4 rounded-xl hover:bg-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] border border-slate-700 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">發送登入連結 <ArrowRight size={18}/></span>}
                </button>
            </form>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-sm text-center animate-in fade-in slide-in-from-top-2 ${message.includes('錯誤') || message.includes('失敗') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center">
           <button onClick={() => navigate('/')} className="text-slate-500 text-xs hover:text-slate-300 transition-colors">
             暫不登入，回到首頁
           </button>
        </div>

      </div>
    </div>
  );
};

export default Login;