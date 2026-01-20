import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';
import { Save, Sparkles, BookOpen, Settings, ChevronLeft, PenTool, RefreshCw } from 'lucide-react';

const Creator = () => {
  const navigate = useNavigate();
  const { playClick, playHover, playSuccess } = useAudio();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [genre, setGenre] = useState('fantasy'); // 預設類別

  // 模擬 AI 擴寫功能 (之後對接真正的 API)
  const handleAIAssist = async () => {
    playClick();
    if (!content) {
      showToast('請先寫一點內容，AI 才能幫你...', 'error');
      return;
    }
    
    setLoading(true);
    showToast('AI 正在讀取星象，構思劇情中...', 'info');
    
    // 模擬延遲
    setTimeout(() => {
      setContent(prev => prev + '\n\n(AI 續寫)... 就在這時，原本平靜的星空忽然泛起了一陣紫色的漣漪，彷彿宇宙的心跳漏了一拍。');
      setLoading(false);
      playSuccess();
      showToast('靈感已送達！', 'success');
    }, 2000);
  };

  const handleSave = async () => {
    playClick();
    if (!title) {
        showToast('故事需要一個標題', 'error');
        return;
    }
    
    setLoading(true);
    // 這裡預留對接 Supabase Database 的接口
    // const { error } = await supabase.from('stories').insert(...)
    
    setTimeout(() => {
        setLoading(false);
        playSuccess();
        showToast('草稿已儲存至雲端金庫', 'success');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0f1016] text-slate-200 font-sans selection:bg-indigo-500/30">
      <Navbar />

      <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto h-screen flex flex-col">
        {/* 頂部工具列 */}
        <div className="flex justify-between items-center mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/')} 
                    onMouseEnter={playHover}
                    className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <PenTool className="text-indigo-400" size={20}/>
                        創作工坊
                    </h1>
                    <p className="text-xs text-slate-500 tracking-wider uppercase">Project: UNIVERSE-01</p>
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    onMouseEnter={playHover}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-all text-sm font-medium"
                >
                    {loading ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16} />}
                    <span>儲存草稿</span>
                </button>
                <button 
                    onClick={handleAIAssist}
                    disabled={loading}
                    onMouseEnter={playHover}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all text-sm font-bold group"
                >
                    <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                    <span>AI 靈感擴寫</span>
                </button>
            </div>
        </div>

        {/* 主要工作區 */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 pb-8">
            
            {/* 左側：設定面板 */}
            <div className="lg:col-span-1 space-y-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                <div className="bg-[#15161c] border border-white/5 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 text-indigo-300 mb-4 text-sm font-bold uppercase tracking-wider">
                        <Settings size={14} /> 故事設定
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-2">故事標題</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="輸入標題..."
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-500 mb-2">類型風格</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['fantasy', 'scifi', 'romance', 'horror'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => { playClick(); setGenre(t); }}
                                        className={`p-2 rounded-lg text-xs border transition-all capitalize ${
                                            genre === t 
                                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                                            : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#15161c] border border-white/5 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 text-amber-300 mb-4 text-sm font-bold uppercase tracking-wider">
                        <BookOpen size={14} /> 靈感筆記
                    </div>
                    <textarea 
                        className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-xs text-slate-400 focus:outline-none focus:border-amber-500/50 resize-none"
                        placeholder="隨手記下你的點子..."
                    ></textarea>
                </div>
            </div>

            {/* 右側：寫作編輯器 */}
            <div className="lg:col-span-3 bg-[#15161c] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 opacity-50"></div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="在浩瀚的宇宙中，故事是這樣開始的..."
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-200 text-lg leading-loose resize-none placeholder:text-slate-700"
                    spellCheck="false"
                ></textarea>
                
                <div className="absolute bottom-4 right-6 text-xs text-slate-600 font-mono">
                    {content.length} 字數
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Creator;