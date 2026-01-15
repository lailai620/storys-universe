import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Star, Cloud, Share2, Moon, Sun, Send, Loader2 } from 'lucide-react';

const Sanctuary = () => {
  const navigate = useNavigate();
  
  // 核心狀態機：控制對話流動
  // 'init' (入口) -> 'choice' (日月選擇) -> 'input' (傾訴) -> 'thinking' (AI思考) -> 'empathy' (共情回應)
  const [phase, setPhase] = useState('init');
  const [userText, setUserText] = useState('');
  const [privacyChoice, setPrivacyChoice] = useState('private'); // 'private' | 'undecided'
  
  // 用於輸入框自動聚焦
  const textareaRef = useRef(null);

  // 當進入輸入模式時，自動聚焦
  useEffect(() => {
    if (phase === 'input' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase]);

  // 模擬 AI 共情回應邏輯
  const handleInputSubmit = () => {
    if (!userText.trim()) return;
    setPhase('thinking');
    
    // 模擬 AI 思考延遲 (1.5秒)
    setTimeout(() => {
      setPhase('empathy');
    }, 1500);
  };

  // 最終前往創作頁面
  const handleProceedToCreate = () => {
    navigate('/create', { 
      state: { 
        initialText: userText,
        initialPrivacy: privacyChoice 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center justify-center relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* 🌌 背景光影動畫 (保持黃金版設定) */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse pointer-events-none" 
        style={{ animationDuration: '4s' }}
      ></div>
      <div 
        className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[100px] animate-pulse pointer-events-none" 
        style={{ animationDuration: '6s' }}
      ></div>

      {/* 主要內容容器 */}
      <div className="w-full max-w-4xl px-6 relative z-10 flex flex-col items-center min-h-[400px] justify-center transition-all duration-700">
        
        {/* ==========================================================
            Phase 0: INIT (黃金版首頁 - 品牌印象)
           ========================================================== */}
        {phase === 'init' && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full">
            {/* 頂部膠囊 */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 backdrop-blur-md mb-10 cursor-default">
                <Sparkles size={14} className="text-amber-300" />
                <span className="text-[10px] md:text-xs font-medium tracking-[0.2em] text-slate-300 uppercase">
                    AI-Powered Legacy Platform
                </span>
            </div>
            
            {/* 標題 */}
            <div className="relative mb-8">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif tracking-tight text-white drop-shadow-2xl flex flex-col items-center gap-2">
                    <span>STORYS</span>
                    <span className="text-4xl md:text-6xl lg:text-7xl italic font-light text-slate-400 font-serif mt-2">Universe</span>
                </h1>
            </div>
            
            {/* 文案 */}
            <p className="text-slate-400 font-light text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-12 tracking-wide">
                有些故事如果不寫下來，就會隨著時間消逝。<br />
                我們用 AI 替您捕捉記憶的微光，將那一刻變成永恆。
            </p>

            {/* 按鈕組 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                    onClick={() => setPhase('choice')} // 👈 改變行為：不再跳轉，而是進入對話
                    className="group px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 relative overflow-hidden"
                >
                    <span>開始記錄</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                </button>

                <button 
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 rounded-full font-medium text-slate-400 border border-slate-700/50 hover:bg-slate-800/50 hover:text-white hover:border-slate-500 transition-all backdrop-blur-sm"
                >
                  登入帳號
                </button>
            </div>
          </div>
        )}

        {/* ==========================================================
            Phase 1: CHOICE (靈魂問候 - 日與月)
           ========================================================== */}
        {phase === 'choice' && (
          <div className="text-center animate-in fade-in zoom-in duration-700 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-serif text-white mb-12 leading-relaxed">
              你想記下一段，<br/>
              只屬於你的故事嗎？
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <button 
                onClick={() => { setPrivacyChoice('private'); setPhase('input'); }}
                className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800/80 hover:border-indigo-500/50 transition-all flex flex-col items-center gap-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Moon size={24} className="text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200 mb-1">先為自己留著</h3>
                  <p className="text-sm text-slate-500">不用急著分享，這是安全的樹洞</p>
                </div>
              </button>

              <button 
                onClick={() => { setPrivacyChoice('undecided'); setPhase('input'); }}
                className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800/80 hover:border-amber-500/50 transition-all flex flex-col items-center gap-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sun size={24} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200 mb-1">之後再決定</h3>
                  <p className="text-sm text-slate-500">也許以後會想讓誰看見</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ==========================================================
            Phase 2: INPUT (傾訴與聆聽)
           ========================================================== */}
        {phase === 'input' && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-8 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 animate-pulse"></div>
              <div className="bg-slate-800/50 p-6 rounded-2xl rounded-tl-none border border-slate-700/50 backdrop-blur-md">
                <p className="text-slate-300 text-lg leading-relaxed">
                  你可以慢慢說，不完整也沒關係。<br/>
                  也許可以從這個開始：<span className="text-white font-medium">最近，有一件事常常出現在你心裡嗎？</span>
                </p>
              </div>
            </div>

            <div className="relative group">
              <textarea
                ref={textareaRef}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="在這裡輸入..."
                className="w-full h-40 bg-transparent text-2xl md:text-3xl text-white placeholder:text-slate-700 border-none outline-none resize-none font-serif leading-relaxed"
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleInputSubmit();
                  }
                }}
              />
              <div className="absolute bottom-0 right-0">
                <button 
                  onClick={handleInputSubmit}
                  disabled={!userText.trim()}
                  className={`p-4 rounded-full transition-all duration-300 ${userText.trim() ? 'bg-white text-slate-900 hover:scale-110' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================
            Phase 3: THINKING (AI 思考中)
           ========================================================== */}
        {phase === 'thinking' && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
            <Loader2 size={40} className="text-indigo-400 animate-spin" />
            <p className="text-slate-500 font-serif tracking-widest text-sm uppercase">Listening...</p>
          </div>
        )}

        {/* ==========================================================
            Phase 4: EMPATHY (共情回應 & 轉化)
           ========================================================== */}
        {phase === 'empathy' && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* AI 共情回應 */}
            <div className="mb-12 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
              <div className="bg-slate-800/80 p-6 rounded-2xl rounded-tl-none border border-slate-600/50 backdrop-blur-md shadow-xl">
                <p className="text-indigo-100 text-xl leading-relaxed font-serif italic">
                  " 我聽到了。<br/>
                  那種說不出口的感受，本身就很真實。<br/>
                  謝謝你願意把這份重量託付給我。 "
                </p>
              </div>
            </div>

            {/* 轉化選項 */}
            <div className="text-center space-y-8 animate-in fade-in duration-1000 delay-500">
              <p className="text-slate-400">如果你願意，我可以幫你把這段話整理成一個完整的故事...</p>
              
              <button 
                onClick={handleProceedToCreate}
                className="group relative inline-flex items-center gap-3 px-10 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] overflow-hidden"
              >
                <Sparkles size={20} className="text-indigo-600" />
                <span>轉換成圖文故事</span>
                <div className="absolute inset-0 bg-indigo-500/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
              </button>
            </div>
          </div>
        )}

      </div>
      
      {/* 底部浮水印 */}
      <div className={`absolute bottom-6 text-slate-800 text-[10px] tracking-[0.5em] font-sans opacity-40 uppercase transition-opacity duration-500 ${phase !== 'init' ? 'opacity-0' : 'opacity-40'}`}>
        Storys Universe © 2026
      </div>
    </div>
  );
};

export default Sanctuary;