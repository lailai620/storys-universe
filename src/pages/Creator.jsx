import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Image as ImageIcon,
  Shuffle, Sparkles, Globe, Lock, Layout, Bot, Stars, Coins, PenTool, Eye, X, Maximize, Minimize
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAudio } from '../context/AudioContext';

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

  // 狀態管理
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai'
  const [pages, setPages] = useState([{ id: 1, type: 'cover' }]);
  const [selectedPageId, setSelectedPageId] = useState(1);
  const [privacy, setPrivacy] = useState('public'); // 'public' | 'private'
  const [style, setStyle] = useState('scifi'); // 'scifi' | 'fairy' | 'memory'
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  // 模擬儲存功能
  const handleSave = () => {
    playClick();
    showToast('作品已成功封存至星塵庫 ✨', 'success');
    playSuccess();
  };

  // 模擬 AI 生成圖片
  const handleAiGenerate = () => {
    playClick();
    setIsGenerating(true);
    showToast('AI 正在從星雲中召喚靈感...', 'info');

    setTimeout(() => {
      setIsGenerating(false);
      showToast('✨ 場景生成完成！', 'success');
      playSuccess();
    }, 3000);
  };

  // 模擬 AI 生成文字 (打字機效果)
  const handleAiText = () => {
    const fullText = "在遙遠的星雲深處，隱藏著一個被時間遺忘的祕密。在那裡，星塵不再只是光點，而是生命跳動的脈搏...";
    let current = "";
    let index = 0;

    playClick();
    showToast('AI 正在構思故事語句...', 'info');

    const timer = setInterval(() => {
      if (index < fullText.length) {
        current += fullText[index];
        setDisplayedText(current);
        index++;
      } else {
        clearInterval(timer);
        playSuccess();
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#0f1016] text-slate-200 flex flex-col font-sans">

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
            onClick={handleSave}
            onMouseEnter={playHover}
            className="flex items-center gap-2 px-6 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-full transition-all text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Save className="w-4 h-4" />
            <span>封存作品</span>
          </button>
        </div>
      </nav>

      <style>{styles}</style>

      <div className="flex-1 flex overflow-hidden">

        {/* 2. 左側側邊欄 (Sidebar) */}
        <aside className="w-80 border-r border-slate-800/60 bg-[#0f1016] flex flex-col p-4 gap-6 overflow-y-auto hidden md:flex">

          {/* 模式切換 Tabs */}
          <div className="bg-white/5 p-1 rounded-2xl flex border border-white/10">
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

          {/* 故事結構 (頁面列表) */}
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

          {/* 風格選擇 */}
          <div className="space-y-3 mt-auto">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">選擇風格</h3>
            <div className="grid gap-2">
              {[
                { id: 'scifi', label: '科幻小說', icon: '🌌' },
                { id: 'fairy', label: '童話繪本', icon: '🏰' },
                { id: 'memory', label: '拾光回憶', icon: '🕰️' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${style === s.id
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 隱私設定 Toggle */}
          <div className="bg-slate-900/60 p-1 rounded-lg flex border border-slate-800">
            <button
              onClick={() => { playClick(); setPrivacy('private'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${privacy === 'private' ? 'bg-white/20 text-white' : 'text-slate-500'
                }`}
            >
              <Lock className="w-3 h-3" /> 私密
            </button>
            <button
              onClick={() => { playClick(); setPrivacy('public'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${privacy === 'public' ? 'bg-white/20 text-white' : 'text-slate-500'
                }`}
            >
              <Globe className="w-3 h-3" /> 公開
            </button>
          </div>

        </aside>

        {/* 3. 右側主編輯區 (Main Canvas) */}
        <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-8">

            {/* 標題輸入 */}
            <div className="bg-white/5 p-12 rounded-3xl border border-white/10 flex items-center justify-center text-center shadow-lg">
              <input
                type="text"
                placeholder="在此輸入標題..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-5xl font-bold text-center placeholder:text-slate-700 outline-none focus:placeholder:text-slate-800 transition-colors py-4 text-white"
              />
            </div>

            {/* 主要畫布區塊 */}
            <div className={`aspect-video w-full bg-[#161821] rounded-2xl border border-slate-800 relative group overflow-hidden shadow-2xl shadow-black/50 page-transition ${isGenerating ? 'ring-2 ring-indigo-500/50' : ''}`}>

              {/* AI 掃描特效 */}
              {isGenerating && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan"></div>
                </div>
              )}

              {/* 空狀態顯示 */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center text-slate-700 gap-4 transition-opacity duration-500 ${isGenerating ? 'opacity-20' : 'opacity-100'}`}>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-inner border border-white/5">
                  <ImageIcon className="w-10 h-10 opacity-30 text-indigo-400" />
                </div>
                <p className="font-bold text-xl tracking-widest text-slate-600">從星雲中召喚封面...</p>
              </div>

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
            <div className="w-full bg-white/5 rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">故事靈感</span>
                <button
                  onClick={handleAiText}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Bot className="w-3 h-3" /> 使用 AI 撰寫
                </button>
              </div>
              <textarea
                placeholder="在此寫下你的故事開頭，或點擊 AI 撰寫獲取靈感..."
                value={displayedText}
                onChange={(e) => setDisplayedText(e.target.value)}
                className="w-full h-40 bg-transparent text-lg leading-relaxed text-slate-300 placeholder:text-slate-700 resize-none focus:outline-none scrollbar-hide"
              ></textarea>
            </div>

          </div>
        </main>

      </div>

      {/* 4. 全螢幕預覽模式 */}
      {isPreviewOpen && (
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
      )}
    </div>
  );
};

export default Creator;