import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

// 新版卡片式組件
import CreatorSidebar from '../components/creator/CreatorSidebar';
import CoverEditor from '../components/creator/CoverEditor';
import PageEditor from '../components/creator/PageEditor';

import {
  ChevronLeft,
  Save,
  RefreshCw,
  Sparkles,
  Coins,
  PenTool,
  Wand2,
  Loader2,
  Send
} from 'lucide-react';

const Creator = () => {
  const navigate = useNavigate();
  const { playClick, playHover, playSuccess } = useAudio();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // === 狀態管理 ===
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [generatingPageImage, setGeneratingPageImage] = useState(false);

  // 模式選擇: 'manual' (分頁製作) 或 'ai' (AI 全自動)
  const [creationMode, setCreationMode] = useState('manual');

  // 風格: 'novel' | 'kids' | 'memoir'
  const [category, setCategory] = useState('novel');

  // 隱私: 'private' | 'public'
  const [visibility, setVisibility] = useState('private');

  // 手動模式資料
  const [manualTitle, setManualTitle] = useState('');
  const [manualCover, setManualCover] = useState('');
  const [activePageId, setActivePageId] = useState('cover'); // 'cover' 或 page.id
  const [pages, setPages] = useState([
    { id: 'page-1', layout: 'mixed', text: '', image: '' }
  ]);

  // AI 全自動模式資料
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null);

  // === 頁面管理 ===
  const handleAddPage = () => {
    playClick();
    const newPage = {
      id: `page-${Date.now()}`,
      layout: 'mixed',
      text: '',
      image: ''
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    showToast('✨ 新增了一頁！', 'success');
  };

  const handleDeletePage = (pageId) => {
    playClick();
    if (pages.length <= 1) {
      showToast('至少需要保留一頁喔', 'error');
      return;
    }
    setPages(pages.filter(p => p.id !== pageId));
    if (activePageId === pageId) {
      setActivePageId('cover');
    }
    showToast('頁面已刪除', 'info');
  };

  const updatePage = (pageId, field, value) => {
    setPages(pages.map(p =>
      p.id === pageId ? { ...p, [field]: value } : p
    ));
  };

  // === 圖片處理 ===
  const handleImageUploadTrigger = () => {
    playClick();
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result;
      if (activePageId === 'cover') {
        setManualCover(imageUrl);
      } else {
        updatePage(activePageId, 'image', imageUrl);
      }
      showToast('圖片上傳成功！', 'success');
    };
    reader.readAsDataURL(file);
  };

  const getRandomCover = () => {
    playClick();
    const randomId = Math.floor(Math.random() * 1000);
    const url = `https://picsum.photos/seed/${randomId}/800/450`;
    setManualCover(url);
    showToast('已隨機更換封面', 'success');
  };

  const handleAiImageForPage = async (pageId) => {
    playClick();
    setGeneratingPageImage(true);
    showToast('AI 正在繪製中...', 'info');

    // 模擬 AI 圖片生成
    setTimeout(() => {
      const randomId = Math.floor(Math.random() * 1000);
      const url = `https://picsum.photos/seed/ai-${randomId}/800/450`;

      if (pageId === 'cover') {
        setManualCover(url);
      } else {
        updatePage(pageId, 'image', url);
      }

      setGeneratingPageImage(false);
      playSuccess();
      showToast('✨ AI 繪圖完成！', 'success');
    }, 2000);
  };

  // === 儲存邏輯 ===
  const handleSave = async () => {
    playClick();

    if (!manualTitle.trim()) {
      showToast('請輸入故事標題', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showToast('請先登入才能儲存故事', 'error');
        setLoading(false);
        return;
      }

      // 組裝內容
      const content = pages.map(p => ({
        layout: p.layout,
        text: p.text,
        image: p.image
      }));

      const { data, error } = await supabase
        .from('stories')
        .insert({
          title: manualTitle.trim(),
          content: content,
          style: category,
          cover_image: manualCover,
          visibility: visibility,
          is_public: visibility === 'public',
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('儲存失敗:', error);
        showToast(`儲存失敗: ${error.message}`, 'error');
        return;
      }

      playSuccess();
      setIsSaved(true);
      showToast('🎉 故事已發布至星雲！', 'success');

    } catch (err) {
      console.error('未預期的錯誤:', err);
      showToast('發生未知錯誤，請稍後再試', 'error');
    } finally {
      setLoading(false);
    }
  };

  // === AI 全自動生成 ===
  const handleAIGenerate = async () => {
    playClick();

    if (!aiPrompt.trim()) {
      showToast('請輸入故事靈感或主題', 'error');
      return;
    }

    setLoading(true);
    showToast('AI 正在構思故事中...', 'info');

    // 模擬 AI 生成
    setTimeout(() => {
      setGeneratedResult({
        title: `${aiPrompt}的奇幻冒險`,
        cover: `https://picsum.photos/seed/ai-cover-${Date.now()}/800/450`,
        pages: [
          { text: '在遙遠的星雲深處，有一個被遺忘的世界...', image: `https://picsum.photos/seed/ai-p1-${Date.now()}/800/450` },
          { text: '主角踏上了一段充滿未知的旅程，每一步都閃爍著星光。', image: `https://picsum.photos/seed/ai-p2-${Date.now()}/800/450` },
          { text: '最終，他們發現了隱藏在宇宙深處的秘密...', image: `https://picsum.photos/seed/ai-p3-${Date.now()}/800/450` }
        ]
      });
      setLoading(false);
      playSuccess();
      showToast('✨ AI 生成完成！請檢視結果', 'success');
    }, 3000);
  };

  // === 取得當前頁面 ===
  const activePage = pages.find(p => p.id === activePageId);

  // === 判斷主題風格 ===
  const isKids = category === 'kids';
  const bgClass = isKids
    ? 'bg-gradient-to-br from-pink-100 via-orange-50 to-yellow-100'
    : 'bg-[#0f1016]';
  const textClass = isKids ? 'text-slate-800' : 'text-slate-200';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} font-sans selection:bg-indigo-500/30`}>
      <Navbar />

      {/* 隱藏的檔案上傳 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">

        {/* 頂部工具列 */}
        <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { playClick(); navigate('/'); }}
              onMouseEnter={playHover}
              className={`p-2 rounded-full transition-colors ${isKids ? 'hover:bg-white/50 text-slate-600' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold flex items-center gap-2 ${isKids ? 'text-slate-800' : 'text-white'}`}>
                <PenTool className="text-indigo-500" size={20} />
                創作工作室
              </h1>
              <p className={`text-xs tracking-wider uppercase ${isKids ? 'text-slate-500' : 'text-slate-500'}`}>
                Card-Style Creator Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 金幣顯示 (示意) */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isKids ? 'bg-white/60 border-amber-300' : 'bg-amber-900/30 border-amber-500/30'}`}>
              <Coins size={16} className="text-amber-500" />
              <span className="font-mono font-bold text-sm text-amber-500">120</span>
            </div>

            <button
              onClick={handleSave}
              disabled={loading || creationMode === 'ai'}
              onMouseEnter={playHover}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 ${isKids ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]'}`}
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              <span>發布故事</span>
            </button>
          </div>
        </div>

        {/* 主要工作區 - 兩欄佈局 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-12">

          {/* 左側邊欄 */}
          <div className="lg:col-span-1 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
            <CreatorSidebar
              creationMode={creationMode}
              setCreationMode={setCreationMode}
              setIsSaved={setIsSaved}
              setGeneratedResult={setGeneratedResult}
              isSaved={isSaved}
              pages={pages}
              activePageId={activePageId}
              setActivePageId={setActivePageId}
              handleAddPage={handleAddPage}
              handleDeletePage={handleDeletePage}
              category={category}
              setCategory={setCategory}
              visibility={visibility}
              setVisibility={setVisibility}
              playClick={playClick}
              playHover={playHover}
            />
          </div>

          {/* 右側編輯區 */}
          <div className="lg:col-span-3 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">

            {/* 手動模式 */}
            {creationMode === 'manual' && !isSaved && (
              <>
                {activePageId === 'cover' ? (
                  <CoverEditor
                    category={category}
                    manualTitle={manualTitle}
                    setManualTitle={setManualTitle}
                    manualCover={manualCover}
                    generatingPageImage={generatingPageImage}
                    handleImageUploadTrigger={handleImageUploadTrigger}
                    getRandomCover={getRandomCover}
                    handleAiImageForPage={handleAiImageForPage}
                  />
                ) : activePage && (
                  <PageEditor
                    page={activePage}
                    category={category}
                    updatePage={updatePage}
                    generatingPageImage={generatingPageImage}
                    handleImageUploadTrigger={handleImageUploadTrigger}
                    handleAiImageForPage={handleAiImageForPage}
                  />
                )}
              </>
            )}

            {/* AI 全自動模式 */}
            {creationMode === 'ai' && !generatedResult && (
              <div className={`rounded-3xl border p-8 md:p-12 shadow-xl min-h-[600px] flex flex-col items-center justify-center ${isKids ? 'bg-white/60 border-white/50' : 'bg-white/5 border-white/10 backdrop-blur-md'}`}>
                <Wand2 size={64} className={`mb-6 ${isKids ? 'text-indigo-400' : 'text-indigo-500'}`} />
                <h2 className={`text-2xl font-bold mb-2 ${isKids ? 'text-slate-700' : 'text-white'}`}>
                  AI 全自動創作
                </h2>
                <p className={`text-sm mb-8 ${isKids ? 'text-slate-500' : 'text-slate-400'}`}>
                  輸入一個主題或靈感，AI 會為你生成完整的故事和插圖
                </p>

                <div className="w-full max-w-lg">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="例如：一隻小狐狸在星空下尋找失落的月亮..."
                    className={`w-full h-32 p-4 rounded-2xl border resize-none outline-none text-lg transition-all ${isKids ? 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-indigo-400' : 'bg-black/30 border-white/10 text-white placeholder:text-white/40 focus:border-indigo-500'}`}
                  />

                  <button
                    onClick={handleAIGenerate}
                    disabled={loading}
                    className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        AI 正在創作中...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        開始 AI 創作
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* AI 生成結果預覽 */}
            {creationMode === 'ai' && generatedResult && (
              <div className={`rounded-3xl border p-8 shadow-xl ${isKids ? 'bg-white/60 border-white/50' : 'bg-white/5 border-white/10 backdrop-blur-md'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isKids ? 'text-slate-700' : 'text-white'}`}>
                  ✨ AI 生成結果
                </h2>

                <div className="space-y-6">
                  {/* 封面預覽 */}
                  <div className="rounded-2xl overflow-hidden">
                    <img src={generatedResult.cover} alt="Cover" className="w-full h-64 object-cover" />
                  </div>
                  <h3 className={`text-xl font-bold ${isKids ? 'text-slate-800' : 'text-white'}`}>
                    {generatedResult.title}
                  </h3>

                  {/* 頁面預覽 */}
                  {generatedResult.pages.map((page, idx) => (
                    <div key={idx} className={`flex gap-4 p-4 rounded-xl ${isKids ? 'bg-white/50' : 'bg-white/5'}`}>
                      <img src={page.image} alt={`Page ${idx + 1}`} className="w-24 h-24 rounded-lg object-cover" />
                      <div className="flex-1">
                        <span className={`text-xs font-bold ${isKids ? 'text-slate-400' : 'text-slate-500'}`}>第 {idx + 1} 頁</span>
                        <p className={`mt-1 ${isKids ? 'text-slate-700' : 'text-slate-300'}`}>{page.text}</p>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      playClick();
                      // 將 AI 結果轉為手動模式編輯
                      setManualTitle(generatedResult.title);
                      setManualCover(generatedResult.cover);
                      setPages(generatedResult.pages.map((p, i) => ({
                        id: `ai-page-${i}`,
                        layout: 'mixed',
                        text: p.text,
                        image: p.image
                      })));
                      setCreationMode('manual');
                      setGeneratedResult(null);
                      showToast('已轉為手動編輯模式', 'info');
                    }}
                    className="w-full py-3 rounded-xl bg-amber-500 text-slate-900 font-bold flex items-center justify-center gap-2 hover:bg-amber-400 transition-all"
                  >
                    <Send size={18} />
                    採用此結果並編輯
                  </button>
                </div>
              </div>
            )}

            {/* 發布成功畫面 */}
            {isSaved && (
              <div className={`rounded-3xl border p-12 shadow-xl min-h-[500px] flex flex-col items-center justify-center text-center ${isKids ? 'bg-white/60 border-white/50' : 'bg-white/5 border-white/10 backdrop-blur-md'}`}>
                <div className="text-6xl mb-6">🎉</div>
                <h2 className={`text-3xl font-bold mb-2 ${isKids ? 'text-slate-700' : 'text-white'}`}>
                  故事已發布！
                </h2>
                <p className={`mb-8 ${isKids ? 'text-slate-500' : 'text-slate-400'}`}>
                  你的創作已經飛向星雲，等待被發現
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => { playClick(); navigate('/gallery'); }}
                    className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all"
                  >
                    前往星雲畫廊
                  </button>
                  <button
                    onClick={() => {
                      playClick();
                      setIsSaved(false);
                      setManualTitle('');
                      setManualCover('');
                      setPages([{ id: 'page-1', layout: 'mixed', text: '', image: '' }]);
                      setActivePageId('cover');
                    }}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${isKids ? 'bg-white text-slate-700 hover:bg-slate-100' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    繼續創作新故事
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Creator;