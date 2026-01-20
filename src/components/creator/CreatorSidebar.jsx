import React from 'react';
import { Layout, Wand2, ImageIcon, Trash2, Plus, AlignJustify, Maximize, Smile, Feather, BookOpen } from 'lucide-react';

const CreatorSidebar = ({
  creationMode,
  setCreationMode,
  setIsSaved,
  setGeneratedResult,
  isSaved,
  pages,
  activePageId,
  setActivePageId,
  handleAddPage,
  handleDeletePage,
  category,
  setCategory,
  visibility,
  setVisibility,
  playClick,
  playHover
}) => {
  const isKids = category === 'kids';
  const labelColor = isKids ? 'text-slate-600' : 'text-slate-400';

  const categoryOptions = [
    { id: 'novel', label: '科幻小說', icon: <BookOpen size={16}/>, activeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/50' },
    { id: 'kids', label: '童話繪本', icon: <Smile size={16}/>, activeColor: 'text-pink-500 bg-pink-500/10 border-pink-500/50' },
    { id: 'memoir', label: '拾光回憶', icon: <Feather size={16}/>, activeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/50' },
  ];

  return (
    <div className="space-y-6">
      
      {/* 模式切換 */}
      <div className={`backdrop-blur-md p-2 rounded-2xl border flex shadow-sm ${isKids ? 'bg-white/40 border-white/50' : 'bg-white/5 border-white/10'}`}>
          <button 
              onClick={() => { playClick(); setCreationMode('manual'); setIsSaved(false); }}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${creationMode === 'manual' ? (isKids ? 'bg-white text-slate-800 shadow-md' : 'bg-amber-500 text-slate-900') : (isKids ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')}`}
          >
              <Layout size={16}/> 分頁製作
          </button>
          <button 
              onClick={() => { playClick(); setCreationMode('ai'); setGeneratedResult(null); setIsSaved(false); }}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${creationMode === 'ai' ? (isKids ? 'bg-white text-slate-800 shadow-md' : 'bg-indigo-500 text-white') : (isKids ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')}`}
          >
              <Wand2 size={16}/> AI 全自動
          </button>
      </div>

      {/* 頁面導航 (僅手動模式) */}
      {creationMode === 'manual' && !isSaved && (
          <div className={`backdrop-blur-md p-4 rounded-2xl border shadow-lg max-h-[400px] overflow-y-auto ${isKids ? 'bg-white/40 border-white/50' : 'bg-white/5 border-white/10'}`}>
              <h3 className={`font-bold mb-4 text-xs uppercase tracking-wider ${labelColor}`}>故事結構</h3>
              <div className="space-y-2">
                  <button 
                      onClick={() => { playClick(); setActivePageId('cover'); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activePageId === 'cover' ? (isKids ? 'bg-white shadow-md text-slate-800' : 'bg-indigo-500 text-white') : (isKids ? 'hover:bg-white/30 text-slate-600' : 'hover:bg-white/5 text-slate-400')}`}
                  >
                      <ImageIcon size={16} /> 封面設計
                  </button>
                  
                  {pages.map((page, index) => (
                      <div key={page.id} className="flex gap-1 group">
                          <button 
                              onClick={() => { playClick(); setActivePageId(page.id); }}
                              className={`flex-1 text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${activePageId === page.id ? (isKids ? 'bg-white shadow-md text-slate-800' : 'bg-slate-700 text-white') : (isKids ? 'hover:bg-white/30 text-slate-600' : 'hover:bg-white/5 text-slate-400')}`}
                          >
                              <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">{index + 1}</span>
                              {page.layout === 'text-only' ? <AlignJustify size={12}/> : (page.layout === 'image-only' ? <Maximize size={12}/> : <Layout size={12}/>)}
                          </button>
                          <button onClick={() => handleDeletePage(page.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                  ))}
                  
                  <button 
                      onClick={handleAddPage}
                      className={`w-full py-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm transition-all mt-4 ${isKids ? 'border-slate-400 text-slate-600 hover:bg-white/30' : 'border-white/20 text-slate-400 hover:bg-white/5'}`}
                  >
                      <Plus size={16} /> 新增一頁
                  </button>
              </div>
          </div>
      )}

      {/* 風格與隱私設定 */}
      <div className={`backdrop-blur-md p-6 rounded-2xl border shadow-lg ${isKids ? 'bg-white/40 border-white/50' : 'bg-white/5 border-white/10'}`}>
        <div className="space-y-6">
           <div>
              <label className={`block text-xs font-bold mb-3 uppercase tracking-wider ${labelColor}`}>選擇風格</label>
              <div className="grid grid-cols-1 gap-2">
                  {categoryOptions.map((m) => (
                  <button
                      key={m.id}
                      onClick={() => { playClick(); setCategory(m.id); }}
                      onMouseEnter={playHover}
                      className={`text-left p-3 rounded-xl border transition-all duration-300 ${category === m.id ? m.activeColor : (isKids ? 'border-transparent hover:bg-white/30 text-slate-500' : 'border-white/5 text-slate-400 hover:bg-white/5')}`}
                  >
                      <div className="font-bold text-sm flex items-center gap-2">{m.icon} {m.label}</div>
                  </button>
                  ))}
              </div>
           </div>
           
           <div>
              <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${labelColor}`}>隱私設定</label>
              <div className={`flex p-1 rounded-lg border ${isKids ? 'bg-white/30 border-white/30' : 'bg-black/20 border-white/10'}`}>
                  <button onClick={() => setVisibility('private')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${visibility === 'private' ? (isKids ? 'bg-white shadow-sm' : 'bg-white/20 text-white') : 'opacity-50'}`}>私密</button>
                  <button onClick={() => setVisibility('public')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${visibility === 'public' ? (isKids ? 'bg-white shadow-sm' : 'bg-white/20 text-white') : 'opacity-50'}`}>公開</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorSidebar;