import React from 'react';
import { ImageIcon, Loader2, Upload, RefreshCw, Sparkles } from 'lucide-react';

const CoverEditor = ({
  category,
  manualTitle,
  setManualTitle,
  manualCover,
  generatingPageImage,
  handleImageUploadTrigger,
  getRandomCover,
  handleAiImageForPage
}) => {
  const isKids = category === 'kids';
  const labelColor = isKids ? 'text-slate-600' : 'text-slate-400';
  const titleInputClass = isKids
    ? 'text-slate-800 placeholder:text-slate-400'
    : 'text-white placeholder:text-white/50';

  return (
    <div className="space-y-6">
        
        {/* 標題輸入區 */}
        <div className={`p-12 rounded-3xl border flex flex-col items-center justify-center text-center shadow-sm ${isKids ? 'bg-white/50 border-white/60' : 'bg-white/5 border-white/10'}`}>
            <input 
                type="text" 
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="在此輸入標題..."
                className={`w-full bg-transparent border-none outline-none text-4xl md:text-6xl font-bold font-serif text-center ${titleInputClass}`}
            />
        </div>

        {/* 封面圖片區 */}
        <div className={`relative aspect-video w-full rounded-3xl overflow-hidden shadow-lg border group ${isKids ? 'bg-white/30 border-white/40' : 'bg-black/20 border-white/10'}`}>
            {manualCover ? (
                <img src={manualCover} alt="Cover" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400/50">
                    <ImageIcon size={48} />
                    <span className="text-sm font-bold">尚未設定封面圖</span>
                </div>
            )}
            
            {generatingPageImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white flex-col gap-2 z-20">
                    <Loader2 className="animate-spin" size={32}/>
                    <span className="text-xs font-bold tracking-widest">AI 正在繪製封面...</span>
                </div>
            )}

            <div className="absolute bottom-6 right-6 flex gap-3 z-10">
                <button 
                    onClick={handleImageUploadTrigger}
                    className="px-4 py-2 rounded-xl backdrop-blur-md font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 bg-white/90 text-slate-700 hover:bg-white"
                >
                    <Upload size={16}/> 上傳圖片
                </button>
                <button 
                    onClick={getRandomCover}
                    className="px-4 py-2 rounded-xl backdrop-blur-md font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 bg-white/10 text-white hover:bg-white/20"
                >
                    <RefreshCw size={16}/> 隨機更換
                </button>
                <button 
                    onClick={() => handleAiImageForPage('cover')}
                    disabled={generatingPageImage}
                    className="px-4 py-2 rounded-xl backdrop-blur-md font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                    <Sparkles size={16}/> ✨ AI 生成
                </button>
            </div>
        </div>
    </div>
  );
};

export default CoverEditor;