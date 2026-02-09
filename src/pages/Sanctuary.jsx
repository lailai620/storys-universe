import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, BookOpen, Feather, Library, Download, Sparkles, Stars, ChevronRight, User, Star, Camera } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import Logo from '../logo-v5.png';
import { useStory } from '../context/StoryContext';

const StarField = ({ isWarping }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stars = useMemo(() => {
    return Array.from({ length: 200 }).map((_, i) => { // 增加至 200 顆
      const depth = Math.random();
      const sizeBase = depth < 0.8 ? 1 : (depth < 0.95 ? 2 : 3);
      return {
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: isWarping ? sizeBase : sizeBase * (Math.random() * 0.5 + 0.5),
        opacity: Math.random() * 0.6 + 0.2,
        speed: depth * 0.2, // 視差速度隨深度變化
        animationDuration: `${Math.random() * 3 + 2}s`,
        animationDelay: `${Math.random() * 5}s`,
      };
    });
  }, [isWarping]);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full bg-white ${isWarping ? 'transition-transform duration-1000' : 'animate-pulse'}`}
          style={{
            top: star.top,
            left: star.left,
            width: isWarping ? '100px' : `${star.size}px`,
            height: isWarping ? '1px' : `${star.size}px`,
            opacity: star.opacity,
            transform: isWarping
              ? 'scaleX(1)'
              : `translateY(${scrollY * star.speed}px)`, // 核心：視差位移
            animationDuration: star.animationDuration,
            animationDelay: star.animationDelay,
            boxShadow: star.size > 2 ? `0 0 ${star.size * 2}px rgba(255,255,255,0.8)` : 'none'
          }}
        />
      ))}
    </div>
  );
};

const Sanctuary = () => {
  const navigate = useNavigate();
  const { playHover, playWarp, initAudioEngine, changeBgm, playClick } = useAudio();
  const { user, readingProgress, allStories, userStories, userCollections } = useStory();
  const [isWarping, setIsWarping] = useState(false);

  useEffect(() => {
    changeBgm('space');
  }, [changeBgm]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudioEngine();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [initAudioEngine]);

  const demoBooks = [
    { title: "迷路的星星", type: "兒童繪本", icon: <Star className="text-amber-50" size={24} />, color: "from-amber-500/90 to-orange-500/70", border: "border-amber-200/80", glow: "shadow-[0_0_30px_rgba(245,158,11,0.4)]" },
    { title: "第 24 號觀測站", type: "科幻小說", icon: <Rocket className="text-indigo-50" size={24} />, color: "from-indigo-500/90 to-purple-500/70", border: "border-indigo-200/80", glow: "shadow-[0_0_30px_rgba(99,102,241,0.4)]" },
    { title: "1998 的夏天", type: "個人回憶錄", icon: <Camera className="text-emerald-50" size={24} />, color: "from-emerald-500/90 to-teal-500/70", border: "border-emerald-200/80", glow: "shadow-[0_0_30px_rgba(16,185,129,0.4)]" }
  ];

  return (
    <div className="min-h-screen bg-[#0f1016] text-slate-100 font-sans selection:bg-indigo-400/30 relative overflow-x-hidden">

      <div className={`fixed inset-0 z-0 overflow-hidden transition-transform duration-[2000ms] ${isWarping ? 'scale-150' : 'scale-100'}`}>
        <StarField isWarping={isWarping} />
      </div>
      <div className={`fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-1000 ${isWarping ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* 內容層 */}
      <div className={`relative z-10 transition-opacity duration-500 ${isWarping ? 'opacity-0' : 'opacity-100'}`}>

        {/* HERO SECTION */}
        <div className="relative min-h-screen flex flex-col items-center justify-center">

          <div className="text-center px-6 max-w-5xl mx-auto py-20">
            {/* 主標題：優化間距與呼吸感 */}
            <div className="flex justify-center mb-12 relative group">
              <div className="absolute inset-0 bg-white/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-1000"></div>
              <img
                src={Logo}
                alt="Storys Universe - AI 驅動的創意寫作平台標誌"
                loading="eager"
                className="h-80 md:h-[500px] w-auto object-contain transform hover:scale-105 transition-transform duration-700 relative z-10 drop-shadow-[0_0_40px_rgba(255,100,0,0.4)] mix-blend-screen"
              />
            </div>
            {/* 副標題 */}
            <p className="text-indigo-100/90 font-light text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto mb-16 tracking-wide font-serif drop-shadow-sm">
              這是一個為靈魂而生的創作避難所。<br className="hidden md:block" />
              無論是封存珍貴回憶，還是構思偉大的小說篇章。
            </p>

            {/* 漫遊星際按鈕 (v.75 狀態) */}
            <div className="flex flex-col md:flex-row justify-center items-center mt-4 gap-6">
              <button
                onClick={() => { playWarp(); setIsWarping(true); setTimeout(() => navigate('/gallery'), 800); }}
                onMouseEnter={playHover}
                className="px-8 py-4 rounded-full font-bold text-lg text-white bg-white/5 border border-white/30 hover:bg-white/10 hover:border-white/60 transition-all backdrop-blur-md shadow-[0_0_30px_rgba(100,100,255,0.2)] flex items-center gap-2 group"
              >
                <Rocket size={20} className="text-indigo-300 group-hover:rotate-45 transition-transform duration-500" />
                <span>漫遊星際</span>
              </button>

              {/* 🌟 繼續閱讀動態入口 (僅對登入用戶且有進度時顯示) */}
              {user && Object.keys(readingProgress).length > 0 && (
                (() => {
                  // 找到最後更新的一個故事 ID (這部分邏輯未來可以更嚴謹，目前先抓最後一個)
                  const lastStoryId = Object.keys(readingProgress)[0];
                  // 嘗試從本地已載入的故事列表中尋找標題
                  const lastStory = [...userStories, ...userCollections].find(s => s.id === lastStoryId);

                  if (!lastStory) return null;

                  return (
                    <button
                      onClick={() => { playClick(); navigate(`/story/${lastStoryId}`); }}
                      onMouseEnter={playHover}
                      className="px-6 py-4 rounded-full font-bold text-lg text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-1000 relative overflow-hidden group/cta"
                    >
                      <div className="absolute inset-0 bg-indigo-400/20 blur-xl opacity-0 group-hover/cta:opacity-100 transition-opacity"></div>
                      <BookOpen size={20} className="relative z-10" />
                      <span className="relative z-10">繼續閱讀：{lastStory.title}</span>
                      {/* 呼吸燈特效 */}
                      <div className="absolute right-2 top-2 w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
                    </button>
                  );
                })()
              )}
            </div>

            <div className="animate-bounce mt-16 opacity-50">
              <span className="text-xs tracking-[0.3em] uppercase text-white">Scroll to Explore</span>
            </div>
          </div>
        </div>

        {/* SHOWCASE SECTION (保持不變，維持深色背景邏輯) */}
        <div id="showcase" className="relative z-10">
          <div className="h-64 bg-gradient-to-b from-transparent to-transparent"></div>
          <div className="bg-transparent py-32 border-t border-white/5">
            <div className="max-w-6xl mx-auto px-6 w-full">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                <div onMouseEnter={playHover} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-400/50 transition-all group backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-300"><Feather size={28} /></div>
                  <h3 className="text-xl font-bold text-white mb-3">小說創作助手</h3>
                  <p className="text-indigo-100/60 leading-relaxed">專為創作者打造。輸入大綱或片段，AI 協助您擴寫情節。</p>
                </div>
                <div onMouseEnter={playHover} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-400/50 transition-all group backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6 text-amber-300"><Library size={28} /></div>
                  <h3 className="text-xl font-bold text-white mb-3">多重宇宙風格</h3>
                  <p className="text-indigo-100/60 leading-relaxed">一鍵切換敘事口吻。從溫馨繪本到嚴肅文學。</p>
                </div>
                <div onMouseEnter={playHover} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-400/50 transition-all group backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 text-emerald-300"><Download size={28} /></div>
                  <h3 className="text-xl font-bold text-white mb-3">出版級排版</h3>
                  <p className="text-indigo-100/60 leading-relaxed">作品完成後，可直接匯出精美的 PDF 電子書。</p>
                </div>
              </div>

              <div className="relative rounded-3xl overflow-visible bg-white/5 border border-white/10 aspect-[16/9] md:aspect-[21/9] flex items-center justify-center group backdrop-blur-md">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay rounded-3xl"></div>
                <div className="flex gap-6 md:gap-12 px-10 opacity-100 relative z-0 w-full justify-center items-center">
                  {demoBooks.map((book, i) => (
                    <div key={i} onMouseEnter={playHover} className={`w-32 h-48 md:w-56 md:h-80 bg-gradient-to-br ${book.color} ${book.border} rounded-lg flex flex-col items-center justify-center gap-4 transform hover:-translate-y-6 hover:scale-105 transition-all duration-500 relative overflow-visible group/book flex-shrink-0 shadow-2xl cursor-pointer`}>
                      {/* 環境發光層 */}
                      <div className={`absolute inset-0 rounded-lg blur-2xl opacity-0 group-hover/book:opacity-60 transition-opacity duration-500 -z-10 ${book.glow}`}></div>

                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/book:translate-x-[100%] transition-transform duration-700 rounded-lg"></div>
                      <div className="relative z-10">{book.icon}</div>
                      <div className="text-center px-4 relative z-10">
                        <span className="block text-[10px] md:text-xs text-white/90 uppercase tracking-widest mb-2 font-bold drop-shadow-md">{book.type}</span>
                        <h4 className="text-sm md:text-xl font-serif font-bold text-white mb-3 drop-shadow-md leading-tight">{book.title}</h4>
                        <div className="h-1 w-12 bg-white/40 rounded-full mx-auto"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center mt-24">
                <p className="text-indigo-200 mb-8 font-serif italic text-lg tracking-wide">" 無論是珍藏昨日的感動，還是譜寫明日的傳奇，這裡都是您故事的起點。 "</p>
                {/* 注意：開始創作按鈕已移至 Navbar 右上角，此處不重複顯示，以保持 v.75 的乾淨佈局 */}
              </div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-6 left-0 right-0 text-center text-white/20 text-[10px] tracking-[0.5em] font-sans pointer-events-none">Storys Universe © 2026</div>
      </div>
    </div>
  );
};

export default Sanctuary;