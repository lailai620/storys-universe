import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { generateStoryFromGroq, generateImageFromFlux } from '../aiService';
import {
  ArrowLeft, Save, Plus, Image as ImageIcon,
  Shuffle, Sparkles, Globe, Lock, Layout, Bot, Stars, Coins, PenTool, Eye, X, Maximize, Minimize, Calendar, Mic, MicOff, Wand2, LogIn
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAudio } from '../context/AudioContext';
import StardustAnimation from '../components/StardustAnimation';
import { useOnboarding, OnboardingTrigger } from '../components/Onboarding';
import { getModeConfig } from '../config/modeConfig';
import { Helmet } from 'react-helmet-async';

// --- CSS Animations ---
const styles = `
@keyframes scan {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(200%); opacity: 0; }
}
.animate-scan {
  animation: scan 2s linear infinite;
}
.page-transition {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
`;

const Creator = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { playClick, playHover, playSuccess } = useAudio();
  const { createStory, user, appMode, saveAsGuest, balance, membershipTier, deductTokens } = useStory();

  // 取得當前模式配置
  const currentModeConfig = getModeConfig(appMode);

  // 狀態管理
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai'
  const [pages, setPages] = useState([{ id: 1, type: 'cover', text: '' }]);
  const [selectedPageId, setSelectedPageId] = useState(1);
  const [privacy, setPrivacy] = useState('public'); // 'public' | 'private'
  const [style, setStyle] = useState(currentModeConfig.categories[0]?.id || 'scifi');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [mood, setMood] = useState('neutral'); // 'neutral' | 'happy' | 'peaceful' | 'intense' | 'sad'
  const [isListening, setIsListening] = useState(false);
  const [isAiInspiring, setIsAiInspiring] = useState(false);
  const [aiFullAutoPrompt, setAiFullAutoPrompt] = useState('');
  const [isFullAutoGenerating, setIsFullAutoGenerating] = useState(false);

  // 🌟 Onboarding 新手導覽
  const { startOnboarding, hasCompletedOnboarding } = useOnboarding();

  // 首次訪問時自動啟動導覽
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding('creator')) {
        startOnboarding();
      }
    }, 1000); // 延遲 1 秒讓頁面完全載入
    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding, startOnboarding]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showStardust, setShowStardust] = useState(false); // ✨ 星塵消費動畫

  // 🎯 功能：頁面內容同步 (切換頁面時自動載入該頁內容)
  useEffect(() => {
    const page = pages.find(p => p.id === selectedPageId);
    if (page) {
      setDisplayedText(page.text || '');
    }
  }, [selectedPageId]);

  // 🎯 功能：即時儲存內容到 pages 陣列中
  useEffect(() => {
    if (isFullAutoGenerating) return; // 自動生成時不干擾
    setPages(prev => prev.map(p =>
      p.id === selectedPageId ? { ...p, text: displayedText } : p
    ));
  }, [displayedText, selectedPageId]);

  // --- 🎙️ Voice Legacy (Speech-to-Text) ---
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      showToast('您的瀏覽器不支援語音功能', 'error');
      return;
    }

    if (isListening) {
      window.recognition?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setDisplayedText(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    window.recognition = recognition;
    recognition.start();
  };

  // --- 🎭 AI 情感分析邏輯 ---
  const analyzeMood = (text) => {
    const keywords = {
      happy: ['好', '開心', '快樂', '熱情', '光', '暖', '笑', '喜'],
      peaceful: ['靜', '思', '夢', '星', '慢', '海', '聽', '空', '悠'],
      intense: ['戰', '火', '衝', '憤', '強', '力', '破', '黑', '暗'],
      sad: ['悲', '泣', '冷', '雨', '失', '淚', '孤', '獨', '傷']
    };

    let counts = { happy: 0, peaceful: 0, intense: 0, sad: 0 };
    Object.keys(keywords).forEach(m => {
      keywords[m].forEach(kw => {
        if (text.includes(kw)) counts[m]++;
      });
    });

    const topMood = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    setMood(counts[topMood] > 0 ? topMood : 'neutral');
  };

  useEffect(() => {
    analyzeMood(displayedText);
  }, [displayedText]);

  const getMoodAura = () => {
    switch (mood) {
      case 'happy': return 'from-amber-500/10 via-orange-500/5 to-transparent';
      case 'peaceful': return 'from-blue-500/10 via-cyan-500/5 to-transparent';
      case 'intense': return 'from-purple-500/15 via-indigo-900/10 to-transparent';
      case 'sad': return 'from-slate-500/10 via-blue-900/5 to-transparent';
      default: return 'from-indigo-500/5 via-transparent to-transparent';
    }
  };

  // 根據全域模式初始化風格
  useEffect(() => {
    if (appMode === 'senior') setStyle('memory');
    else if (appMode === 'kids') setStyle('fairy');
  }, [appMode]);

  // 準備故事資料
  const prepareStoryData = () => {
    const categoryInfo = currentModeConfig.categories.find(c => c.id === style);
    return {
      title,
      content: pages.map(p => ({
        text: p.id === 1 ? displayedText : p.text,
        image: p.image || null
      })),
      cover_image: pages.find(p => p.type === 'cover')?.image || null,
      category: categoryInfo?.name || style,
      style,
      mode: appMode,
      visibility: privacy,
      memory_date: memoryDate
    };
  };

  // 儲存功能 (支援登入用戶和訪客)
  const handleSave = async () => {
    if (!title.trim()) {
      showToast('請輸入故事標題才能封存唷！', 'error');
      return;
    }

    // 未登入用戶：顯示選項
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    playClick();
    setIsSaving(true);
    showToast('正在將您的回憶封存至星核...', 'info');

    try {
      await createStory(prepareStoryData());
      showToast('作品已成功封存至星塵庫 ✨', 'success');
      playSuccess();
      setTimeout(() => navigate('/profile'), 1500);
    } catch (e) {
      console.error('儲存失敗:', e);
      showToast('封存失敗，請檢查網路連線', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 訪客本地儲存
  const handleGuestSave = () => {
    playClick();
    setIsSaving(true);
    setShowLoginPrompt(false);

    try {
      saveAsGuest(prepareStoryData());
      showToast('作品已儲存到您的裝置 📱', 'success');
      playSuccess();
      setTimeout(() => navigate('/'), 1500);
    } catch (e) {
      showToast('本地儲存失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 🌟 真實 AI 圖片生成 (功能 2)
  const handleAiGenerate = async () => {
    if (isGenerating) return;

    // 檢查星塵 (VIP: 2, Standard: 5)
    const cost = membershipTier === 'vip' ? 2 : 5;
    if (user && balance < cost) {
      showToast(`星塵不足！生成插圖需要 ${cost} 星塵。`, 'error');
      return;
    }

    playClick();
    setIsGenerating(true);
    showToast('AI 正在從星雲中召喚靈感...', 'info');
    setShowStardust(true);

    const currentPage = pages.find(p => p.id === selectedPageId);
    const prompt = currentPage?.imagePrompt || title || 'fantasy landscape';

    try {
      const imageUrl = await generateImageFromFlux(prompt, {
        userId: user?.id,
        storyId: 'creator_temp',
        type: selectedPageId === 1 ? 'cover' : 'page'
      });

      // 扣除星塵
      if (user) await deductTokens(cost, 'generate_image');

      setPages(prev => prev.map(p =>
        p.id === selectedPageId ? { ...p, image: imageUrl } : p
      ));

      showToast(`✨ 場景生成完成！(消耗 ${cost} 星塵)`, 'success');
      playSuccess();
    } catch (error) {
      console.error('Image generation failed:', error);
      showToast('AI 繪圖失敗，請稍後再試', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 🌟 AI 靈感功能
  const handleAiInspiration = async () => {
    if (isAiInspiring) return;

    // 靈感較便宜 (VIP: 1, Standard: 2)
    const cost = membershipTier === 'vip' ? 1 : 2;
    if (user && balance < cost) {
      showToast(`星塵不足！AI 靈感需要 ${cost} 星塵。`, 'error');
      return;
    }

    playClick();
    setIsAiInspiring(true);
    showToast('AI 正在從星雲中召喚靈感...', 'info');

    try {
      const prompt = displayedText.trim() || '請幫我寫一個關於夢想的溫馨故事開頭';
      const storyData = await generateStoryFromGroq(prompt);

      if (user) await deductTokens(cost, 'ai_inspiration');

      // 打字機效果顯示第一頁內容
      const fullText = storyData.pages?.[0]?.text || storyData.title || '在遙遠的星雲深處，隱藏著一個被時間遺忘的祕密...';
      let current = displayedText;
      let index = 0;

      const timer = setInterval(() => {
        if (index < fullText.length) {
          current += fullText[index];
          setDisplayedText(current);
          index++;
        } else {
          clearInterval(timer);
          setIsAiInspiring(false);
          showToast('✨ AI 靈感注入完成！', 'success');
          playSuccess();
        }
      }, 40);
    } catch (error) {
      console.error('AI 靈感生成失敗:', error);
      setIsAiInspiring(false);
      showToast('AI 靈感召喚失敗，請稍後再試', 'error');
    }
  };

  // 🚀 AI 全自動模式 - 一鍵生成完整故事
  const handleFullAutoGenerate = async () => {
    if (isFullAutoGenerating || !aiFullAutoPrompt.trim()) {
      if (!aiFullAutoPrompt.trim()) {
        showToast('請先輸入故事主題或靈感', 'error');
      }
      return;
    }

    // 全自動最貴 (VIP: 5, Standard: 10)
    const cost = membershipTier === 'vip' ? 5 : 10;
    if (user && balance < cost) {
      showToast(`星塵不足！全自動創作需要 ${cost} 星塵。`, 'error');
      return;
    }

    playClick();
    setIsFullAutoGenerating(true);
    setShowStardust(true); // 顯示星塵動畫
    showToast('🚀 AI 全自動創作啟動中...', 'info');

    try {
      const storyData = await generateStoryFromGroq(aiFullAutoPrompt);
      if (user) await deductTokens(cost, 'ai_full_auto');

      // 自動填入標題
      setTitle(storyData.title || '我的 AI 故事');

      // 🎯 功能 1：多頁面 AI 自動填充
      // 將 AI 生成的每個頁面分別添加到 pages 狀態
      if (storyData.pages && storyData.pages.length > 0) {
        const newPages = storyData.pages.map((page, index) => ({
          id: index + 1,
          type: index === 0 ? 'cover' : 'page',
          text: page.text || '',
          imagePrompt: page.image_prompt || '', // 用於後續圖片生成
        }));

        setPages(newPages);
        setSelectedPageId(1);

        // 打字機效果顯示第一頁內容
        const firstPageText = newPages[0]?.text || '';
        let current = '';
        let index = 0;

        const timer = setInterval(() => {
          if (index < firstPageText.length) {
            current += firstPageText[index];
            setDisplayedText(current);
            index++;
          } else {
            clearInterval(timer);
            setIsFullAutoGenerating(false);
            showToast(`✨ 全自動創作完成！已生成 ${newPages.length} 頁內容`, 'success');
            playSuccess();
          }
        }, 30);
      } else {
        // 降級處理：如果沒有多頁結構，使用舊邏輯
        const allText = storyData.pages?.map(p => p.text).join('\n\n') || '';
        setDisplayedText(allText);
        setIsFullAutoGenerating(false);
        showToast('✨ 全自動創作完成！', 'success');
        playSuccess();
      }
    } catch (error) {
      console.error('全自動生成失敗:', error);
      setIsFullAutoGenerating(false);
      showToast('全自動創作失敗，請稍後再試', 'error');
    }
  };

  return (
    <div className={`min-h-screen ${appMode === 'senior' ? 'bg-[#1a1614]' : '#0f1016'} text-slate-200 flex flex-col font-sans transition-colors duration-1000 overflow-hidden ${appMode === 'senior' ? 'text-lg' : ''}`}>
      <Helmet>
        <title>創作工坊 | Storys Universe</title>
        <meta name="description" content="在 Storys Universe 創作你的專屬故事，支援 AI 輔助、語音輸入和多種風格。" />
      </Helmet>

      {/* 🔮 拾光背景效果 (Senior) */}
      {appMode === 'senior' && (
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)] pointer-events-none z-10 opacity-30"></div>
      )}

      {/* 🧚 童話星塵效果 (Kids) */}
      {appMode === 'kids' && (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>
      )}

      {/* 1. 頂部導覽列 (Navbar) */}
      <nav className="h-16 border-b border-slate-800/60 bg-[#0f1016]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { playClick(); navigate('/'); }}
            onMouseEnter={playHover}
            className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">返回首頁</span>
          </button>
          <div className="h-4 w-px bg-slate-800 mx-2"></div>
          <span className="font-bold text-lg flex items-center gap-2 text-white">
            <Sparkles className="text-amber-400 w-5 h-5" />
            創作工作室
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => { playClick(); setIsPreviewOpen(true); }}
            onMouseEnter={playHover}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-full transition-all text-sm border border-slate-700"
          >
            <Eye className="w-4 h-4" />
            <span>預覽作品</span>
          </button>
          <div className="flex items-center gap-2 bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-500/30">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-mono font-bold text-sm text-amber-500">120</span>
          </div>
          <button
            data-onboarding="save-button"
            onClick={handleSave}
            onMouseEnter={playHover}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-full transition-all text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50"
          >
            {isSaving ? (
              <Bot className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? '正在封存...' : '封存作品'}</span>
          </button>
        </div>
      </nav>

      <style>{styles}</style>

      {/* 🔮 情感星雲背景層 */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-all duration-1000 bg-gradient-to-tr ${getMoodAura()}`}></div>

      <div className="flex-1 flex overflow-hidden">

        {/* 2. 左側側邊欄 (Sidebar) */}
        <aside className="w-80 border-r border-slate-800/60 bg-[#0f1016] flex flex-col p-4 gap-6 overflow-y-auto hidden md:flex">

          {/* 模式切換 Tabs */}
          <div data-onboarding="mode-switch" className="bg-white/5 p-1 rounded-2xl flex border border-white/10">
            <button
              onClick={() => { playClick(); setActiveTab('manual'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'manual'
                ? 'bg-[#FF9800] text-black shadow-lg shadow-orange-500/20'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Layout className="w-4 h-4" />
              分頁製作
            </button>
            <button
              onClick={() => { playClick(); setActiveTab('ai'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'ai'
                ? 'bg-slate-800 text-slate-400'
                : 'text-slate-500 hover:text-slate-300 shadow-lg'
                }`}
            >
              <Bot className="w-4 h-4" />
              AI 全自動
            </button>
          </div>

          {/* AI 全自動模式介面 */}
          {activeTab === 'ai' && (
            <div className="space-y-4 bg-gradient-to-br from-indigo-900/20 to-purple-900/10 p-5 rounded-2xl border border-indigo-500/20">
              <div className="flex items-center gap-2 text-indigo-300">
                <Wand2 className="w-5 h-5" />
                <h3 className="font-bold">AI 全自動創作</h3>
              </div>
              <p className="text-xs text-slate-400">
                輸入您的想法，AI 將自動生成完整故事，包含標題和多頁內容。
              </p>
              <textarea
                placeholder="例如：一隻勇敢的小貓咪尋找回家的路..."
                value={aiFullAutoPrompt}
                onChange={(e) => setAiFullAutoPrompt(e.target.value)}
                className="w-full h-24 bg-slate-800/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
              <button
                onClick={handleFullAutoGenerate}
                disabled={isFullAutoGenerating || !aiFullAutoPrompt.trim()}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isFullAutoGenerating
                  ? 'bg-indigo-600 text-white animate-pulse'
                  : aiFullAutoPrompt.trim()
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
              >
                {isFullAutoGenerating ? (
                  <>
                    <Bot className="w-4 h-4 animate-spin" />
                    AI 創作中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    一鍵生成故事
                  </>
                )}
              </button>
            </div>
          )}

          {/* 故事結構 (頁面列表) - 只在手動模式顯示 */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">故事結構</h3>
              <div className="space-y-2">
                {/* 封面頁 (固定) */}
                <div
                  onClick={() => { playClick(); setSelectedPageId(1); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${selectedPageId === 1
                    ? 'bg-[#6366F1] border-[#6366F1]/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">封面設計</span>
                </div>

                {/* 其他頁面 */}
                <div className="pl-4 space-y-2 border-l-2 border-slate-800 ml-4 py-2">
                  <div
                    onClick={() => playClick()}
                    className="flex items-center gap-3 px-3 py-3 text-sm text-slate-400 hover:text-white cursor-pointer group bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                  >
                    <span className="text-slate-600 group-hover:text-slate-400 font-mono">1</span>
                    <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                      <Layout className="w-3 h-3 text-slate-500" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => playClick()}
                  className="w-full py-3 border border-dashed border-white/20 rounded-2xl text-slate-500 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新增一頁
                </button>
              </div>
            </div>
          )}

          {/* 類別選擇 - 根據當前模式動態顯示 */}
          <div className="space-y-3 mt-auto">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-2">
              <span>{currentModeConfig.icon}</span> 選擇類別
            </h3>
            <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
              {currentModeConfig.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setStyle(cat.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${style === cat.id
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 拾光模式專屬：日期選擇器 */}
            {appMode === 'memoir' && (
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3 mt-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> 心情日期
                </label>
                <input
                  type="date"
                  value={memoryDate}
                  onChange={(e) => setMemoryDate(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* AI 情感共鳴指示器 */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 mb-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>AI 情感共鳴</span>
              <span className={`px-2 py-0.5 rounded transition-colors duration-500 ${mood !== 'neutral' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                {mood === 'neutral' ? '偵測中...' : mood.toUpperCase()}
              </span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${mood === 'happy' ? 'bg-amber-400 w-full' : mood === 'peaceful' ? 'bg-cyan-400 w-full' : mood === 'intense' ? 'bg-purple-500 w-full' : mood === 'sad' ? 'bg-slate-400 w-full' : 'bg-indigo-500 w-1/3 opacity-20'}`}></div>
            </div>
          </div>
        </aside>

        {/* 3. 右側主編輯區 (Main Canvas) */}
        <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-8">

            {/* 標題輸入 */}
            <div data-onboarding="title-input" className="bg-white/5 p-12 rounded-3xl border border-white/10 flex items-center justify-center text-center shadow-lg">
              <input
                type="text"
                placeholder="在此輸入標題..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-5xl font-bold text-center placeholder:text-slate-700 outline-none focus:placeholder:text-slate-800 transition-colors py-4 text-white"
              />
            </div>

            {/* 主要畫布區塊 */}
            <div data-onboarding="canvas" className={`aspect-video w-full ${appMode === 'senior' ? 'bg-[#2a2624]' : 'bg-[#161821]'} rounded-2xl border ${appMode === 'senior' ? 'border-amber-900/30' : 'border-slate-800'} relative group overflow-hidden shadow-2xl shadow-black/50 page-transition ${isGenerating ? 'ring-2 ring-indigo-500/50' : ''}`}>

              {/* AI 掃描特效 */}
              {isGenerating && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan"></div>
                </div>
              )}

              {/* 狀態顯示或圖片 */}
              {pages.find(p => p.id === selectedPageId)?.image ? (
                <img src={pages.find(p => p.id === selectedPageId).image} alt="Scene" className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000" />
              ) : (
                <div className={`absolute inset-0 flex flex-col items-center justify-center text-slate-700 gap-4 transition-opacity duration-500 ${isGenerating ? 'opacity-20' : 'opacity-100'}`}>
                  <div className={`w-24 h-24 rounded-3xl ${appMode === 'senior' ? 'bg-amber-900/20' : 'bg-gradient-to-br from-slate-800 to-slate-900'} flex items-center justify-center shadow-inner border border-white/5`}>
                    <ImageIcon className={`w-10 h-10 opacity-30 ${appMode === 'senior' ? 'text-amber-500' : 'text-indigo-400'}`} />
                  </div>
                  <p className={`font-bold tracking-widest ${appMode === 'senior' ? 'text-amber-900/60 text-2xl' : 'text-slate-600 text-xl'}`}>
                    {appMode === 'senior' ? '點擊右下角上傳您的珍貴照片' : '從星雲中召喚封面...'}
                  </p>
                </div>
              )}

              {/* 浮動工具列 */}
              <div className={`absolute bottom-6 right-6 flex gap-3 transition-all duration-300 ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}>
                <button
                  onClick={() => playClick()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 font-bold text-sm shadow-xl transition-all"
                >
                  <ImageIcon className="w-4 h-4" />
                  上傳圖片
                </button>
                <button
                  onClick={() => playClick()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 font-bold text-sm border border-white/20 transition-all"
                >
                  <Shuffle className="w-4 h-4" />
                  隨機更換
                </button>
                <button
                  onClick={handleAiGenerate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  AI 生成
                </button>
              </div>

            </div>

            {/* 文字內容編輯區 */}
            <div data-onboarding="text-editor" className={`w-full ${appMode === 'senior' ? 'bg-amber-900/10 border-amber-900/20' : 'bg-white/5 border-white/5'} rounded-2xl border p-8 space-y-4 shadow-2xl transition-all duration-500`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold uppercase tracking-widest flex items-center gap-2 ${appMode === 'senior' ? 'text-amber-500 text-xl' : 'text-slate-500 text-xs'}`}>
                  <Mic size={appMode === 'senior' ? 24 : 14} className={isListening ? 'text-rose-500 animate-pulse' : ''} />
                  {isListening ? '正在聽取您的回憶...' : appMode === 'senior' ? '說說這張照片的故事...' : '故事內容 / 語音輸入'}
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={toggleListening}
                    className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-bold transition-all shadow-xl ${isListening ? 'bg-rose-500 text-white animate-bounce' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    <span className={appMode === 'senior' ? 'text-xl' : 'text-xs'}>{isListening ? '停止' : appMode === 'senior' ? '按這裏說話' : '開啟語音'}</span>
                  </button>
                  <button
                    onClick={handleAiInspiration}
                    disabled={isAiInspiring}
                    className={`font-bold flex items-center gap-1 transition-colors ${appMode === 'senior' ? 'text-2xl text-amber-400' : 'text-xs text-indigo-400 hover:text-indigo-300'} ${isAiInspiring ? 'animate-pulse' : ''}`}
                  >
                    <Bot size={appMode === 'senior' ? 24 : 14} className={isAiInspiring ? 'animate-spin' : ''} />
                    {isAiInspiring ? 'AI 思考中...' : 'AI 點子'}
                  </button>
                </div>
              </div>
              <textarea
                placeholder={appMode === 'senior' ? "請在這邊輸入文字，或者按右邊藍色按鈕用說的..." : "在此寫下你的故事開頭，或點擊 AI 撰寫獲取靈感..."}
                value={displayedText}
                onChange={(e) => setDisplayedText(e.target.value)}
                className={`w-full bg-transparent border-none focus:outline-none transition-all placeholder:text-slate-700 resize-none min-h-[250px] ${appMode === 'senior' ? 'text-4xl leading-relaxed text-amber-50 placeholder:text-amber-900/20 font-medium' : 'text-lg text-slate-200'}`}
              />
            </div>

          </div>
        </main>

      </div >

      {/* 4. 全螢幕預覽模式 */}
      {
        isPreviewOpen && (
          <div className="fixed inset-0 z-[100] bg-[#0f1016] flex flex-col items-center p-8 overflow-y-auto animate-in fade-in duration-500">
            <button
              onClick={() => { playClick(); setIsPreviewOpen(false); }}
              className="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
            >
              <Minimize className="w-6 h-6" />
            </button>

            <div className="w-full max-w-5xl space-y-12 py-12">
              <h1 className="text-6xl font-bold text-center text-white">{title || "無標題故事"}</h1>
              <div className="aspect-video w-full bg-[#161821] rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center">
                <ImageIcon className="w-16 h-16 opacity-10 text-indigo-400" />
              </div>
              <div className="max-w-3xl mx-auto">
                <p className="text-2xl leading-relaxed text-slate-300 font-serif">
                  {displayedText || "故事正在靜靜等待被啟封..."}
                </p>
              </div>
            </div>

            <div className="mt-auto py-8">
              <span className="text-slate-600 text-sm font-bold tracking-widest uppercase">Draft Preview Mode</span>
            </div>
          </div>
        )
      }

      {/* 5. 登入提示對話框 (未登入時封存作品) */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#161821] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/50">
            {/* 標題 */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Save className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">儲存您的創作</h3>
                <p className="text-sm text-slate-400">選擇儲存方式</p>
              </div>
            </div>

            {/* 說明文字 */}
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              目前您尚未登入。登入後可將作品同步至雲端星塵庫，或選擇暫時儲存到本地裝置。
            </p>

            {/* 按鈕區 */}
            <div className="space-y-3">
              <button
                onClick={() => { playClick(); setShowLoginPrompt(false); navigate('/login'); }}
                onMouseEnter={playHover}
                className="w-full py-3 px-4 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                登入後儲存至雲端
              </button>
              <button
                onClick={handleGuestSave}
                onMouseEnter={playHover}
                className="w-full py-3 px-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                儲存到本地裝置
              </button>
              <button
                onClick={() => { playClick(); setShowLoginPrompt(false); }}
                onMouseEnter={playHover}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ 星塵消費動畫 */}
      <StardustAnimation
        isActive={showStardust || isAiInspiring || isFullAutoGenerating}
        onComplete={() => setShowStardust(false)}
      />
    </div >
  );
};

export default Creator;