import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { useToast } from '../context/ToastContext';
import { Sparkles, ArrowLeft, Mail, Lock, LogIn, UserPlus, Loader2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useStory();
  const { showToast } = useToast();

  const [isLogin, setIsLogin] = useState(true); // 切換登入/註冊模式
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
        showToast("請輸入完整的星際座標 (Email 與密碼)", "error");
        return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        showToast("身份確認，歡迎回到指揮艙。", "success");
        navigate('/'); // 登入成功回首頁
      } else {
        await signUp(email, password);
        showToast("註冊成功！請檢查您的信箱以啟用星門連結。", "success");
        // 註冊後通常 Supabase 預設需要 Email 驗證，或者直接登入(取決於設定)
        // 這裡假設設定為「不需要驗證」或「自動登入」
      }
    } catch (error) {
      console.error("Auth error:", error);
      showToast(`驗證失敗: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-indigo-500/30 relative flex items-center justify-center overflow-hidden">
      
      {/* 背景特效 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <button onClick={() => navigate('/')} className="absolute top-[-60px] left-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> 返回宇宙
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-4">
                    <Sparkles size={16} className="text-indigo-300"/>
                    <span className="text-xs font-bold tracking-widest text-indigo-200 uppercase">Star Gate System</span>
                </div>
                <h1 className="text-3xl font-serif font-bold text-white mb-2">{isLogin ? "登入星艦" : "註冊通行證"}</h1>
                <p className="text-slate-400 text-sm">輸入您的憑證以存取私有星域。</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="commander@universe.io"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                    {loading ? "連線中..." : (isLogin ? "啟動連結" : "建立檔案")}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
                >
                    {isLogin ? "還沒有通行證？ 點此註冊" : "已有帳號？ 點此登入"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;