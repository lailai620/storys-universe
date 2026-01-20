import React from 'react';
import { Layout, AlignJustify, Maximize, ImageIcon, Upload, Sparkles, Loader2, PenLine } from 'lucide-react';

const PageEditor = ({
  page,
  category,
  updatePage,
  generatingPageImage,
  handleImageUploadTrigger,
  handleAiImageForPage
}) => {
  const isKids = category === 'kids';
  const labelColor = isKids ? 'text-slate-600' : 'text-slate-400';
  const textareaClass = isKids
    ? 'text-slate-800 placeholder:text-slate-400 focus:bg-white/40'
    : 'text-white placeholder:text-white/50 focus:bg-white/5';

  return (
    <div className={`rounded-3xl border shadow-xl overflow-hidden min-h-[700px] flex flex-col ${isKids ? 'bg-white/60 border-white/50' : 'bg-white/5 border-white/10 backdrop-blur-md'}`}>
        
        {/* 版型切換工具列 */}
        <div className={`px-6 py-3 border-b flex items-center gap-3 ${isKids ? 'border-white/30 bg-white/40' : 'border-white/10 bg-black/20'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>版型設定：</span>
            <button onClick={() => updatePage(page.id, 'layout', 'mixed')} className={`p-2 rounded-lg transition-all ${page.layout === 'mixed' ? (isKids ? 'bg-white shadow text-indigo-600' : 'bg-indigo-600 text-white') : 'hover:bg-white/20'}`} title="圖文並茂">
                <Layout size={16}/>
            </button>
            <button onClick={() => updatePage(page.id, 'layout', 'text-only')} className={`p-2 rounded-lg transition-all ${page.layout === 'text-only' ? (isKids ? 'bg-white shadow text-indigo-600' : 'bg-indigo-600 text-white') : 'hover:bg-white/20'}`} title="純文字">
                <AlignJustify size={16}/>
            </button>
            <button onClick={() => updatePage(page.id, 'layout', 'image-only')} className={`p-2 rounded-lg transition-all ${page.layout === 'image-only' ? (isKids ? 'bg-white shadow text-indigo-600' : 'bg-indigo-600 text-white') : 'hover:bg-white/20'}`} title="純圖片">
                <Maximize size={16}/>
            </button>
        </div>

        {/* 圖像創作區 */}
        {page.layout !== 'text-only' && (
            <div className={`w-full ${page.layout === 'image-only' ? 'flex-1' : 'h-[400px]'} relative ${isKids ? 'bg-white/30' : 'bg-black/20'} transition-all duration-300`}>
                {page.image ? (
                    <img src={page.image} alt="Page Visual" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 opacity-40">
                        <ImageIcon size={64} className={isKids ? "text-slate-400" : "text-slate-600"}/>
                        <span className={`text-sm font-bold ${labelColor}`}>本頁尚無插圖</span>
                    </div>
                )}

                {generatingPageImage && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white flex-col gap-2 z-20">
                        <Loader2 className="animate-spin" size={32}/>
                        <span className="text-xs font-bold tracking-widest">AI 繪圖中...</span>
                    </div>
                )}

                <div className="absolute bottom-6 right-6 flex gap-3 z-10">
                    <button onClick={handleImageUploadTrigger} className="px-4 py-2 rounded-xl backdrop-blur-md font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 bg-white/90 text-slate-700 hover:bg-white"><Upload size={16}/> 上傳圖片</button>
                    <button onClick={() => handleAiImageForPage(page.id)} disabled={generatingPageImage} className="px-4 py-2 rounded-xl backdrop-blur-md font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"><Sparkles size={16}/> ✨ AI 生成</button>
                </div>
            </div>
        )}

        {/* 文字創作區 */}
        {page.layout !== 'image-only' && (
            <div className={`flex-1 p-8 flex flex-col ${page.layout === 'mixed' ? 'border-t border-white/10' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${labelColor}`}>
                        <PenLine size={14}/> 故事內容
                    </h3>
                </div>
                <textarea 
                    value={page.text}
                    onChange={(e) => updatePage(page.id, 'text', e.target.value)}
                    placeholder="在此輸入本頁的故事內容..."
                    className={`flex-1 w-full bg-transparent resize-none outline-none text-xl md:text-2xl font-serif leading-loose p-4 rounded-xl transition-all ${textareaClass}`}
                />
            </div>
        )}
    </div>
  );
};

export default PageEditor;