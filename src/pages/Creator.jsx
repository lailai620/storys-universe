import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Image as ImageIcon,
  Shuffle, Sparkles, Globe, Lock, Layout, Bot
} from 'lucide-react';
import { useToast } from '../context/ToastContext'; // 假設你有這個
// 如果沒有 Toast Context，可以暫時註解掉相關程式碼

const Creator = () => {
  const navigate = useNavigate();
  // const { showToast } = useToast(); // 暫時註解，避免報錯

  // 狀態管理
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai'
  const [pages, setPages] = useState([{ id: 1, type: 'cover' }]);
  const [selectedPageId, setSelectedPageId] = useState(1);
  const [privacy, setPrivacy] = useState('public'); // 'public' | 'private'
  const [style, setStyle] = useState('scifi'); // 'scifi' | 'fairy' | 'memory'

  // 模擬儲存功能
  const handleSave = () => {
    console.log('Saving story:', { title, pages, privacy, style });
    // showToast('作品已封存', 'success');
  };

  return (
    <div className="min-h-screen bg-[#0f1016] text-slate-200 flex flex-col font-sans">

      {/* 1. 頂部導覽列 (Navbar) */}
      <nav className="h-16 border-b border-slate-800/60 bg-[#0f1016]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-slate-200">
            ✨ 創作工作室
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            草稿自動儲存中
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-slate-200 font-semibold rounded-full transition-all text-sm"
          >
            <Save className="w-4 h-4" />
            <span>封存作品</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">

        {/* 2. 左側側邊欄 (Sidebar) */}
        <aside className="w-80 border-r border-slate-800/60 bg-[#0f1016] flex flex-col p-4 gap-6 overflow-y-auto hidden md:flex">

          {/* 模式切換 Tabs */}
          <div className="bg-slate-900/80 p-1 rounded-xl flex">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'manual'
                  ? 'bg-[#FFC107] text-black shadow-lg shadow-orange-500/20'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Layout className="w-4 h-4" />
              分頁製作
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'ai'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300'
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
                onClick={() => setSelectedPageId(1)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${selectedPageId === 1
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">封面設計</span>
              </div>

              {/* 其他頁面 */}
              <div className="pl-4 space-y-2 border-l-2 border-slate-800 ml-4 py-2">
                <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white cursor-pointer group">
                  <span className="text-slate-600 group-hover:text-slate-400">01</span>
                  <span>第一章：啟程</span>
                </div>
              </div>

              <button className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-all text-sm flex items-center justify-center gap-2">
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
              onClick={() => setPrivacy('private')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${privacy === 'private' ? 'bg-slate-700 text-white' : 'text-slate-500'
                }`}
            >
              <Lock className="w-3 h-3" /> 私密
            </button>
            <button
              onClick={() => setPrivacy('public')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${privacy === 'public' ? 'bg-slate-700 text-white' : 'text-slate-500'
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
            <input
              type="text"
              placeholder="在此輸入標題..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-5xl font-bold text-center placeholder:text-slate-700 focus:outline-none focus:placeholder:text-slate-800 transition-colors py-4"
            />

            {/* 主要畫布區塊 */}
            <div className="aspect-video w-full bg-[#161821] rounded-2xl border border-slate-800 relative group overflow-hidden shadow-2xl shadow-black/50">

              {/* 空狀態顯示 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                </div>
                <p className="font-medium text-lg">尚未設定封面圖</p>
              </div>

              {/* 浮動工具列 */}
              <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 backdrop-blur text-white rounded-xl hover:bg-slate-700 font-medium text-sm border border-slate-700/50 transition-all">
                  <ImageIcon className="w-4 h-4" />
                  上傳圖片
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 backdrop-blur text-white rounded-xl hover:bg-slate-700 font-medium text-sm border border-slate-700/50 transition-all">
                  <Shuffle className="w-4 h-4" />
                  隨機更換
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/90 backdrop-blur text-white rounded-xl hover:bg-indigo-500 font-medium text-sm shadow-lg shadow-indigo-500/20 transition-all">
                  <Sparkles className="w-4 h-4" />
                  AI 生成
                </button>
              </div>

            </div>

            {/* 文字內容編輯區 */}
            <div className="w-full">
              <textarea
                placeholder="寫下你的故事開頭..."
                className="w-full h-40 bg-transparent text-lg leading-relaxed text-slate-300 placeholder:text-slate-700 resize-none focus:outline-none p-4"
              ></textarea>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
};

export default Creator;