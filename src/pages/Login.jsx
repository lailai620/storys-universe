import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import { LogIn, Sparkles, UserPlus, Mail, Lock, Eye, EyeOff, ArrowRight, Globe } from 'lucide-react';
import Logo from '../logo-v5.png';
import { FormInput, Button } from '../components/ui';
import { Helmet } from 'react-helmet-async';

const Login = () => {
  const navigate = useNavigate();
  const { playClick, playHover, playSuccess } = useAudio();
  const { showToast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 檢查是否已登入
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('請填寫完整資訊', 'info');
      return;
    }

    playClick();
    setLoading(true);

    try {
      if (isSignUp) {
        // 註冊邏輯
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data?.user && data?.session) {
          showToast('註冊成功！', 'success');
          playSuccess();
          navigate('/');
        } else {
          showToast('請前往信箱驗證您的帳號', 'info');
        }
      } else {
        // 登入邏輯
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showToast('歡迎回來！', 'success');
        playSuccess();
        navigate('/');
      }
    } catch (error) {
      console.error('認證錯誤:', error);
      showToast(error.message || '認證失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    playClick();
    try {
      const redirectUrl = import.meta.env.DEV
        ? window.location.origin
        : 'https://lailai620.github.io/storys-universe/';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google 登入錯誤:', error);
      showToast(error.message || 'Google 登入失敗', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0c]">
      <Helmet>
        <title>{isSignUp ? '加入星際聯盟' : '登入'} | Storys Universe</title>
        <meta name="description" content="登入 Storys Universe，開始您的星際故事之旅。" />
      </Helmet>
      {/* 背景動態球 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          {/* 裝飾線條 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6 group transition-all duration-500 hover:scale-110">
              <img src={Logo} alt="Logo" className="w-28 h-28 object-contain group-hover:rotate-6 transition-transform" style={{ mixBlendMode: 'screen' }} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              {isSignUp ? '加入星際聯盟' : '歡迎回家'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isSignUp ? '開啟您的星際故事之旅' : '宇宙的精彩正在等待您續寫'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <FormInput
              label="星際信箱"
              type="email"
              placeholder="您的星際信箱"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <FormInput
              label="宇宙通訊密碼"
              type="password"
              placeholder="宇宙通訊密碼"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText={isSignUp ? "密碼至少需 6 個字元" : ""}
            />

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              fullWidth
              loading={loading}
              onMouseEnter={playHover}
              className="py-6 rounded-2xl shadow-indigo-600/20"
            >
              {isSignUp ? '即刻啟航' : '進入傳送門'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4 text-slate-600 text-xs">
            <div className="h-[1px] flex-1 bg-white/5"></div>
            <span>或者</span>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            onMouseEnter={playHover}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-3 font-medium mb-8"
          >
            <Globe className="w-5 h-5 text-indigo-400" />
            使用 Google 帳號探索
          </button>

          <div className="text-center text-sm">
            <span className="text-slate-400">
              {isSignUp ? '已經有星際證明了？' : '還沒有星際身分？'}
            </span>
            <button
              onClick={() => { playClick(); setIsSignUp(!isSignUp); }}
              className="ml-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
            >
              {isSignUp ? '立即登入' : '申請註冊'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
