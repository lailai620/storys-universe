import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { Wand2, Image as ImageIcon, Save, ArrowLeft, Loader2, Sparkles, Lock, Globe, Calendar } from 'lucide-react';
// 假設您有 aiService，若無則使用內建模擬邏輯
import { generateStoryFromGroq } from '../aiService'; 

const Creator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, createStory, balance, deductSeed, loading: authLoading } = useStory();

  // 接收來自 Sanctuary 的靈魂碎片
  const { initialText, initialPrivacy } = location.state || {};

  // 狀態管理
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [mode, setMode] = useState('memoir'); // default mode
  const [memoryDate, setMemoryDate] = useState(''); // 時光機日期
  const [visibility, setVisibility] = useState('private');
  
  // 初始化：承接文字與設定
  useEffect(() => {
    if (initialText) {
      setPrompt(initialText);
    }
    if (initialPrivacy) {
      setVisibility(initialPrivacy === 'undecided' ? 'private' : initialPrivacy);
    }
  }, [initialText, initialPrivacy]);

  // 防呆與權限檢查
  useEffect(() => {
    // 如果沒有 User 也沒有 initialText (直接闖入)，且非 Loading 狀態，則導回首頁或登入
    if (!authLoading && !user && !initialText) {
      // 保持寬容，讓舊用戶或直接訪問者也能看到介面，但在按鈕上做卡控
      // navigate('/login'); 
    }
  }, [user, initialText, authLoading, navigate]);

  // 模擬/呼叫 AI 生成
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // 餘額檢查 (僅針對已登入用戶)
    if (user && balance < 50) {
      alert("SEED 不足，請先儲值");
      return;
    }

    setIsGenerating(true);

    try {
      // 這裡整合真實或模擬的 AI 服務
      let result;
      if (typeof generateStoryFromGroq === 'function') {
        result = await generateStoryFromGroq(prompt, mode);
      } else {
        // Mock AI (Fallback)
        await new Promise(r => setTimeout(r, 2000));
        result = {
          title: "關於那份疲憊的回應",
          content: [
            { 
              text: "這段日子確實不容易，你承擔了很多看不見的重量...", 
              image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=2000&auto=format&fit=crop" 
            },
            { 
              text: prompt, // 將用戶的原始輸入融入故事
              image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2000&auto=format&fit=crop" 
            }
          ],
          cover_image: "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=2000&auto=format&fit=crop"
        };
      }

      setGeneratedResult(result);
      
      // 若是已登入用戶，預扣 SEED
      if (user) {
        // await deductSeed(50); 
      }

    } catch (error) {
      console.error("Generate failed:", error);
      alert("生成過程中發生了一點小插曲，請稍後再試。");
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存/發布
  const handleSave = async () => {
    if (!generatedResult) return;

    if (!user) {
      // 🛑 訪客攔截點：引導去登入以保存
      const confirmLogin = window.confirm("為了不讓這段珍貴的回憶遺失，請先登入帳號進行封存。\n\n點擊「確定」前往登入 (我們會幫您暫存這段故事)。");
      if (confirmLogin) {
        // 帶著暫存資料去登入頁
        localStorage.setItem('pending_story', JSON.stringify({
          ...generatedResult,
          category: mode,
          visibility,
          memory_date: memoryDate
        }));
        navigate('/login', { state: { returnTo: '/create' } });
      }
      return;
    }

    // 已登入用戶直接保存
    try {
      await createStory({
        title: generatedResult.title,
        content: generatedResult.content, // JSON array
        cover_image: generatedResult.cover_image,
        category: mode,
        visibility: visibility,
        memory_date: memoryDate || new Date().toISOString()
      });
      alert("故事已封存至您的收藏館。");
      navigate('/profile');
    } catch (error) {
      console.error("Save failed:", error);
      alert("保存失敗，請檢查網路連線。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-20 px-4 md:px-8 font-sans transition-colors duration-500">
      
      <div className="max-w-5xl mx-auto">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <button 
              onClick={() => navigate('/')} 
              className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-sm mb-2 transition-colors"
            >
              <ArrowLeft size={16} /> 返回首頁
            </button>
            <h1 className="text-3xl font-serif font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-indigo-500" />
              {generatedResult ? "回憶已顯影" : "創作工作室"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {user 
                ? `錢包餘額: ${balance} SEED` 
                : "訪客模式 (Guest Mode) - 請盡情體驗"}
            </p>
          </div>

          {/* Action Buttons (Top) */}
          {generatedResult && (
            <button 
              onClick={handleSave}
              className="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-full font-medium transition-all shadow-lg flex items-center gap-2 animate-in fade-in"
            >
              <Save size={18} />
              {user ? "封存回憶" : "登入以保存"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Settings & Input */}
          <div className={`lg:col-span-4 space-y-6 ${generatedResult ? 'hidden lg:block' : ''}`}>
            
            {/* Mode Selection */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Wand2 size={18} /> 選擇基調
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'memoir', label: '拾光回憶 (Memoir)', desc: '溫暖、感性、第一人稱' },
                  { id: 'novel', label: '小說敘事 (Novel)', desc: '結構完整、第三人稱' },
                  { id: 'kids', label: '童話繪本 (Kids)', desc: '純真、簡單、富有童趣' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      mode === m.id 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900' 
                        : 'border-slate-200 hover:border-indigo-200'
                    }`}
                  >
                    <div className="font-bold text-sm">{m.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Machine & Visibility */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} /> 發生時間 (時光機)
                </label>
                <input 
                  type="date" 
                  value={memoryDate}
                  onChange={(e) => setMemoryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  {visibility === 'public' ? <Globe size={16} /> : <Lock size={16} />} 隱私設定
                </label>
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <button 
                    onClick={() => setVisibility('private')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${visibility === 'private' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                  >
                    私密保存
                  </button>
                  <button 
                    onClick={() => setVisibility('public')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${visibility === 'public' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                  >
                    公開分享
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel: Prompt & Result */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Input Area */}
            {!generatedResult && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="請輸入您想記錄的故事片段... (AI 會為您補全細節)"
                  className="flex-1 w-full bg-transparent resize-none outline-none text-lg text-slate-700 placeholder:text-slate-300 font-serif leading-relaxed p-2"
                />
                <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4">
                  <div className="text-xs text-slate-400">
                    {prompt.length} 字
                  </div>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                    {isGenerating ? "AI 正在編織..." : "開始生成"}
                  </button>
                </div>
              </div>
            )}

            {/* Result Area (Preview) */}
            {generatedResult && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
                
                {/* Cover Image */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg relative group">
                  <img src={generatedResult.cover_image} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                    <h2 className="text-3xl font-bold text-white font-serif">{generatedResult.title}</h2>
                  </div>
                </div>

                {/* Content Cards */}
                <div className="space-y-6">
                  {/* 🔧 修復點：加上可選串連 ?. 避免 content 為 undefined 時崩潰 */}
                  {generatedResult.content?.map((block, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                      {block.image && (
                         <div className="w-full md:w-48 aspect-square rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                           <img src={block.image} alt="Scene" className="w-full h-full object-cover" />
                         </div>
                      )}
                      <p className="text-lg text-slate-700 font-serif leading-loose flex-1">
                        {block.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-8">
                   <button 
                     onClick={() => setGeneratedResult(null)}
                     className="text-slate-400 hover:text-slate-600 underline text-sm"
                   >
                     不滿意？重新修改輸入
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