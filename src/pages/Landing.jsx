import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Baby, Heart, Shield, Zap, ArrowRight, Star } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* 1. 導航列 */}
      <nav className="fixed w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">STORYS</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hidden md:block text-slate-300 hover:text-white font-medium transition-colors">會員登入</button>
            <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-white text-slate-900 rounded-full font-bold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-xl shadow-white/10">
              開始旅程
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero 區域：視覺震撼 */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* 背景光暈特效 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 animate-fade-in-up">
            <Star size={14} className="fill-indigo-300"/> 生命基礎建設 Life Infrastructure
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8 tracking-tight">
            紀錄回憶，創造夢想，<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-300">傳承永恆的故事。</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            STORYS 不僅僅是寫作工具，它是您的數位時光膠囊。從孩子的睡前繪本，到您的人生回憶錄，我們用 AI 為您保存生命中最重要的時刻。
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')} className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
              <Zap size={20} /> 免費開始創作
            </button>
            <button className="w-full md:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-lg transition-all backdrop-blur-sm">
              了解運作原理
            </button>
          </div>
        </div>
      </section>

      {/* 3. 三大核心宇宙 (呼應 App 內的功能) */}
      <section className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">為每個生命階段打造</h2>
            <p className="text-slate-400 text-lg">無論是啟蒙、創作還是回顧，都有專屬的模式。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 兒童繪本卡片 */}
            <div className="group p-8 rounded-3xl bg-slate-800/50 border border-white/5 hover:border-sky-500/50 hover:bg-slate-800 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Baby size={120} /></div>
              <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-6">
                <Baby size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">兒童繪本宇宙</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                專為 3-8 歲兒童設計。AI 自動過濾不當內容，生成溫馨、教育意義的插圖故事，是父母最好的睡前幫手。
              </p>
              <span className="text-sky-400 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">探索 Kids Mode <ArrowRight size={16}/></span>
            </div>

            {/* 一般文學卡片 */}
            <div className="group p-8 rounded-3xl bg-slate-800/50 border border-white/5 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><BookOpen size={120} /></div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                <BookOpen size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">無限創作宇宙</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                釋放您的想像力。使用 Llama-3 與 Flux 引擎，將您的腦中構想瞬間轉化為圖文並茂的小說作品。
              </p>
              <span className="text-indigo-400 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">探索 Novel Mode <ArrowRight size={16}/></span>
            </div>

            {/* 拾光回憶卡片 */}
            <div className="group p-8 rounded-3xl bg-slate-800/50 border border-white/5 hover:border-amber-500/50 hover:bg-slate-800 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Heart size={120} /></div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
                <Heart size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">拾光回憶宇宙</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                將珍貴的人生時刻封存。獨特的時間軸設計與隱私保護，讓您的回憶成為留給未來的最美禮物。
              </p>
              <span className="text-amber-400 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">探索 Memoir Mode <ArrowRight size={16}/></span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 安全承諾 (Trust) */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-6">
                <Shield size={32}/>
            </div>
            <h2 className="text-3xl font-bold mb-4">User Choice First 的隱私承諾</h2>
            <p className="text-slate-400 text-lg">
                在 STORYS，您的回憶屬於您。我們採用銀行級的隱私架構，
                預設「私人」設定，除非您選擇公開，否則無人能窺探您的時光膠囊。
            </p>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="py-8 border-t border-white/10 text-center text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} STORYS Universe. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;