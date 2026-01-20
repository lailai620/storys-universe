import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { useToast } from '../context/ToastContext';
import { useAudio } from '../context/AudioContext'; 
import { supabase } from '../supabaseClient'; 
import { Wand2, Save, ArrowLeft, Loader2, Sparkles, Check, Coins, AlertCircle, X } from 'lucide-react';

// 引入子組件
import CreatorSidebar from '../components/creator/CreatorSidebar';
import CoverEditor from '../components/creator/CoverEditor';
import PageEditor from '../components/creator/PageEditor';

// 穩定圖庫 (Mock AI)
const STOCK_IMAGES = {
    kids: [
        "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=1000", 
        "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=1000", 
        "https://images.unsplash.com/photo-1596464716127-f9a8759fa069?q=80&w=1000", 
        "https://images.unsplash.com/photo-1633477189729-9290b3261d0a?q=80&w=1000", 
        "https://images.unsplash.com/photo-1535572290543-960a8046f5af?q=80&w=1000", 
        "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1000", 
    ],
    novel: [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000", 
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000", 
        "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1000", 
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1000", 
    ],
    memoir: [
        "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=1000", 
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000", 
        "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=1000", 
        "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=1000", 
    ]
};

const mockGenerateImageForPage = async (text, category = 'kids') => {
    await new Promise(r => setTimeout(r, 1500));
    const collection = STOCK_IMAGES[category] || STOCK_IMAGES.kids;
    return collection[Math.floor(Math.random() * collection.length)];
};

const mockGenerateStory = async (prompt, mode) => {
  await new Promise(r => setTimeout(r, 2000)); 
  const styles = {
    memoir: { title: "那年夏天的微光", tone: "回憶錄" },
    novel: { title: "第 24 號觀測站", tone: "科幻小說" },
    kids: { title: "迷路的星星", tone: "童話繪本" }
  };
  const style = styles[mode] || styles.memoir;
  const collection = STOCK_IMAGES[mode] || STOCK_IMAGES.memoir;
  return {
    title: style.title,
    content: [
      { text: `(AI 根據您的輸入「${prompt}」進行了擴寫...)\n\n這是一個關於${style.tone}的故事...`, image: collection[0] },
      { text: "我們總以為來日方長，卻忘了世事無常...", image: collection[1] }
    ],
    cover_image: collection[2] || collection[0]
  };
};

const TokenModal = ({ onClose, onTopUp }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-[#1a1b26] border border-white/10 p-8 rounded-3xl max-w-md w-full text-center relative shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
            <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32}/>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">星塵能量不足</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
                您的創作能量（代幣）已用盡。<br/>
                AI 繪圖需要消耗大量的運算星塵。
            </p>
            <div className="space-y-3">
                <button onClick={onTopUp} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                    <Coins size={20}/> 補充 50 枚代幣 (NT$ 30)
                </button>
                <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all">
                    稍後再說
                </button>
            </div>
        </div>
    </div>
);

const Creator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createStory } = useStory(); 
  const { showToast } = useToast();
  const { playHover, playClick, playSuccess, changeBgm } = useAudio(); 

  const { initialText, initialPrivacy } = location.state || {};

  const [creationMode, setCreationMode] = useState('manual');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  const [pages, setPages] = useState([{ id: 1, text: '', image: '', layout: 'mixed' }]);
  const [activePageId, setActivePageId] = useState('cover'); 
  const [manualTitle, setManualTitle] = useState('');
  const [manualCover, setManualCover] = useState('');
  
  const [generatingPageImage, setGeneratingPageImage] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false); 
  
  const [category, setCategory] = useState('novel'); 
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [visibility, setVisibility] = useState('public');

  // 💰 代幣系統狀態 (真實資料庫連動)
  const [tokenBalance, setTokenBalance] = useState(0); 
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [userId, setUserId] = useState(null); 

  const fileInputRef = useRef(null);
  const isKids = category === 'kids';
  
  useEffect(() => {
    if (initialText) setPrompt(initialText);
    if (initialPrivacy === 'private') setVisibility('private');
  }, [initialText, initialPrivacy]);

  useEffect(() => {
    if (category === 'kids') changeBgm('kids');
    else if (category === 'novel') changeBgm('novel');
    else changeBgm('memoir');
  }, [category, changeBgm]);

  // ✅ 核心功能：初始化時抓取真實代幣餘額
  useEffect(() => {
    const fetchBalance = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            const { data, error } = await supabase
                .from('profiles')
                .select('token_balance')
                .eq('id', user.id)
                .single();
            
            if (data) {
                setTokenBalance(data.token_balance);
            } else if (!error) {
                // 如果沒有 profile (極少見)，可能需要手動建立或給預設值
                setTokenBalance(5);
            }
        }
    };
    fetchBalance();
  }, []);

  // ✅ 核心功能：更新資料庫代幣餘額
  const updateTokenBalance = async (amount) => {
      if (!userId) return;
      const newBalance = tokenBalance + amount;
      
      // 更新前端顯示 (樂觀更新 UI)
      setTokenBalance(newBalance);

      // 更新資料庫
      const { error } = await supabase
          .from('profiles')
          .update({ token_balance: newBalance })
          .eq('id', userId);
      
      if (error) {
          console.error("Error updating token:", error);
          showToast("代幣同步失敗", "error");
          setTokenBalance(tokenBalance); 
      }
  };

  const handleTopUp = async () => {
      playSuccess();
      await updateTokenBalance(50); 
      setShowTokenModal(false);
      showToast("充能成功！獲得 50 枚代幣", "success");
  };

  const handleAddPage = () => {
    playClick();
    const newId = pages.length > 0 ? Math.max(...pages.map(p => p.id)) + 1 : 1;
    setPages([...pages, { id: newId, text: '', image: '', layout: 'mixed' }]);
    setActivePageId(newId);
  };

  const handleDeletePage = (id) => {
    if (pages.length <= 1) {
        showToast("故事至少需要一頁內容", "error");
        return;
    }
    if (!window.confirm("確定要刪除這一頁嗎？")) return;
    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);
    setActivePageId(newPages[newPages.length - 1].id);
  };

  const updatePage = (id, field, value) => {
    setPages(pages.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleImageUploadTrigger = () => {
    playClick();
    if(fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  // ✅ 核心修正：將 Bucket 名稱從 'images' 改為 'story-assets'
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast("檔案過大，請上傳 5MB 以下的圖片", "error");
        e.target.value = '';
        return;
    }

    try {
        playClick();
        showToast("正在上傳圖片至星際雲端...", "info");

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${category}/${fileName}`;

        // 📝 修正點：使用 story-assets
        const { error: uploadError } = await supabase.storage
            .from('story-assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('story-assets')
            .getPublicUrl(filePath);
        
        const publicUrl = data.publicUrl;

        if (activePageId === 'cover') {
            setManualCover(publicUrl);
        } else {
            updatePage(activePageId, 'image', publicUrl);
        }
        
        playSuccess();
        showToast("圖片上傳備份完成", "success");

    } catch (error) {
        console.error('Upload failed:', error);
        showToast(`上傳失敗: ${error.message}`, "error");
        const previewUrl = URL.createObjectURL(file);
        if (activePageId === 'cover') setManualCover(previewUrl);
        else updatePage(activePageId, 'image', previewUrl);
    } finally {
        e.target.value = '';
    }
  };

  const getRandomCover = () => {
    playClick();
    const collection = STOCK_IMAGES[category] || STOCK_IMAGES.kids;
    let nextCover = collection[Math.floor(Math.random() * collection.length)];
    setManualCover(nextCover);
  };

  const handleAiImageForPage = async (pageId) => {
    if (!userId) {
        showToast("請先登入以使用 AI 功能", "error");
        return;
    }

    let textToUse = '';
    if (pageId === 'cover') {
        textToUse = manualTitle;
        if (!textToUse.trim()) {
            showToast("請先輸入標題，AI 才能為您繪製封面", "error");
            return;
        }
    } else {
        const page = pages.find(p => p.id === pageId);
        textToUse = page?.text || '';
        if (!textToUse.trim()) {
            showToast("請先在下方輸入故事，AI 才能為您繪製插圖", "error");
            return;
        }
    }

    playClick();

    if (tokenBalance < 1) {
        setShowTokenModal(true);
        return; 
    }

    setGeneratingPageImage(true);
    try {
        const imgUrl = await mockGenerateImageForPage(textToUse, category);
        if (pageId === 'cover') {
            setManualCover(imgUrl);
        } else {
            updatePage(pageId, 'image', imgUrl);
        }
        
        await updateTokenBalance(-1);
        
        playSuccess();
        showToast("✨ AI 繪圖完成 (已扣除 1 代幣)", "success");

    } catch (e) {
        showToast("繪製失敗", "error");
    } finally {
        setGeneratingPageImage(false);
    }
  };

  const handleGenerateFull = async () => {
    if (!prompt.trim()) return;
    if (!userId) {
        showToast("請先登入", "error");
        return;
    }
    
    if (tokenBalance < 3) {
        playClick();
        setShowTokenModal(true);
        return;
    }

    playClick();
    setIsGenerating(true);
    setIsSaved(false); 
    try {
      const result = await mockGenerateStory(prompt, category);
      setGeneratedResult(result);
      
      await updateTokenBalance(-3);

      playSuccess(); 
      showToast("全書生成完成 (已扣除 3 代幣)", "success");
    } catch (error) {
      console.error("Generate failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    playClick();
    let storyData = {};
    if (creationMode === 'ai') {
        if (!generatedResult) return;
        storyData = {
            title: generatedResult.title,
            content: generatedResult.content, 
            cover_image: generatedResult.cover_image
        };
    } else {
        if (!manualTitle.trim()) {
            showToast("請為故事取個標題", "error");
            return;
        }
        const validPages = pages.filter(p => {
             if (p.layout === 'text-only') return p.text.trim().length > 0;
             if (p.layout === 'image-only') return !!p.image;
             return p.text.trim().length > 0 || !!p.image;
        });
        if (validPages.length === 0) {
            showToast("故事內容不能為空", "error");
            return;
        }
        const contentArray = pages.map(p => ({
            text: p.layout === 'image-only' ? '' : p.text, 
            image: p.layout === 'text-only' ? null : (p.image || null), 
            layout: p.layout 
        }));
        storyData = {
            title: manualTitle,
            content: contentArray,
            cover_image: manualCover || STOCK_IMAGES.kids[0]
        };
    }

    setIsSaving(true);
    try {
      await createStory({
        ...storyData,
        category: category,
        visibility: visibility,
        memory_date: memoryDate
      });
      playSuccess(); 
      showToast("故事已成功封存入宇宙紀錄！", "success");
      setIsSaved(true); 
    } catch (error) {
      console.error("Save failed:", error);
      showToast(`保存失敗：${error.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen bg-transparent pb-20 pt-24 px-4 md:px-8 font-sans transition-colors duration-500 ${isKids ? 'text-slate-900' : 'text-slate-100'} overflow-x-hidden selection:bg-amber-500/30`}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      
      {showTokenModal && <TokenModal onClose={() => setShowTokenModal(false)} onTopUp={handleTopUp} />}

      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <button onClick={() => { playClick(); navigate('/'); }} onMouseEnter={playHover} className={`flex items-center gap-2 text-sm mb-2 transition-colors group ${isKids ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}>
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> 返回首頁
            </button>
            <h1 className={`text-3xl font-serif font-bold flex items-center gap-3 drop-shadow-sm ${isKids ? 'text-slate-800' : 'text-white'}`}>
              <Sparkles className={isKids ? "text-amber-500" : "text-amber-300"} />
              {isSaved ? "記憶封存完成" : "創作工作室"}
            </h1>
          </div>
          <div className="flex gap-3 items-center">
             
             <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isKids ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-white/10 border-white/20 text-white'}`} title="剩餘代幣">
                <Coins size={16} className="text-amber-400" />
                <span className="font-bold">{userId ? tokenBalance : '-'}</span>
                <button onClick={() => setShowTokenModal(true)} className="ml-2 w-5 h-5 bg-amber-500 hover:bg-amber-400 text-white rounded-full flex items-center justify-center text-xs transition-colors">+</button>
             </div>

             {((creationMode === 'ai' && generatedResult) || creationMode === 'manual') && !isSaved && (
               <button onClick={handleSave} onMouseEnter={playHover} disabled={isSaving} className={`px-6 py-3 rounded-full font-medium transition-all shadow-lg flex items-center gap-2 animate-in fade-in hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${isKids ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-indigo-50'}`}>
                 {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
                 {isSaving ? "正在封存..." : "封存作品"}
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-3">
            <CreatorSidebar 
                creationMode={creationMode} setCreationMode={setCreationMode} setIsSaved={setIsSaved} setGeneratedResult={setGeneratedResult} isSaved={isSaved}
                pages={pages} activePageId={activePageId} setActivePageId={setActivePageId} handleAddPage={handleAddPage} handleDeletePage={handleDeletePage}
                category={category} setCategory={setCategory} visibility={visibility} setVisibility={setVisibility} playClick={playClick} playHover={playHover}
            />
          </div>

          <div className="lg:col-span-9">
            
            {creationMode === 'manual' && !isSaved && (
                <div className="animate-in fade-in slide-in-from-right duration-500">
                    {activePageId === 'cover' ? (
                        <CoverEditor 
                            category={category}
                            manualTitle={manualTitle} setManualTitle={setManualTitle}
                            manualCover={manualCover} generatingPageImage={generatingPageImage}
                            handleImageUploadTrigger={handleImageUploadTrigger} getRandomCover={getRandomCover} handleAiImageForPage={handleAiImageForPage}
                        />
                    ) : (
                        pages.map(page => (
                            page.id === activePageId && (
                                <PageEditor 
                                    key={page.id}
                                    page={page} category={category} updatePage={updatePage}
                                    generatingPageImage={generatingPageImage}
                                    handleImageUploadTrigger={handleImageUploadTrigger} handleAiImageForPage={handleAiImageForPage}
                                />
                            )
                        ))
                    )}
                </div>
            )}

            {creationMode === 'ai' && (
                <div className={`bg-white/5 backdrop-blur-md p-8 rounded-3xl border shadow-xl min-h-[400px] flex flex-col justify-center ${isKids ? 'bg-white/40 border-white/50' : 'border-white/10'}`}>
                    {!generatedResult ? (
                        <>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="請輸入主題，AI 將為您完成整本故事 (需消耗 3 代幣)..." className={`flex-1 w-full bg-transparent resize-none outline-none text-xl font-serif leading-relaxed p-2 z-10 ${isKids ? 'text-slate-800 placeholder:text-slate-400' : 'text-slate-200 placeholder:text-slate-600'}`}/>
                            <div className="flex justify-end pt-6 mt-4"><button onClick={handleGenerateFull} disabled={isGenerating || !prompt.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg disabled:opacity-50 flex items-center gap-2">{isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />} 開始生成 (3 代幣)</button></div>
                        </>
                    ) : (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl relative"><img src={generatedResult.cover_image} className="w-full h-full object-cover"/></div>
                            <h2 className={`text-3xl font-bold ${isKids?'text-slate-800':'text-white'}`}>{generatedResult.title}</h2>
                            <button onClick={() => setGeneratedResult(null)} className="text-slate-400 hover:underline">重新生成</button>
                        </div>
                    )}
                </div>
            )}

            {isSaved && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 text-center py-20">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400 border border-green-500/30"><Check size={40} /></div>
                    <h2 className={`text-3xl font-bold ${isKids ? 'text-slate-800' : 'text-white'}`}>紀錄已安全封存</h2>
                    <p className="text-slate-400">這段記憶將永遠漂浮在宇宙資料庫中。</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Creator;