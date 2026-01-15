import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, ArrowRight, X, BookOpen, Calendar, Clock, Share2, Quote } from 'lucide-react';

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 閱讀狀態控制
  const [currentPage, setCurrentPage] = useState(-1); // -1 代表封面
  const [isDarkMode, setIsDarkMode] = useState(true); // 閱讀器預設深色模式，更有氛圍

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStory(data);
    } catch (error) {
      console.error('Error fetching story:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-300">
        <div className="animate-pulse flex flex-col items-center gap-4">
            <BookOpen size={48} />
            <span className="text-sm tracking-widest uppercase">Opening Story...</span>
        </div>
    </div>
  );

  if (!story) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">故事已佚失在時光中...</div>;

  // 計算總頁數
  const totalPages = story.content?.length || 0;
  const progress = ((currentPage + 1) / (totalPages + 1)) * 100;

  // 樣式變數
  const bgClass = isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800';
  const cardBgClass = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-700 ${bgClass}`}>
      
      {/* 頂部導航 (閱讀模式下盡量隱藏干擾) */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50">
        <button 
            onClick={() => navigate(-1)} 
            className={`p-2 rounded-full backdrop-blur-md transition-all ${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700 text-slate-300' : 'bg-white/50 hover:bg-white text-slate-700 shadow-sm'}`}
        >
            <X size={20} />
        </button>

        <div className="flex gap-3">
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest backdrop-blur-md transition-all ${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-white/50 text-slate-600 shadow-sm'}`}
            >
                {isDarkMode ? 'LIGHT' : 'DARK'}
            </button>
        </div>
      </div>

      {/* 進度條 */}
      <div className="fixed bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300 z-50" style={{ width: `${progress}%` }}></div>

      {/* 主要內容區 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        
        {/* 背景裝飾光 (深色模式才有) */}
        {isDarkMode && (
            <>
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-amber-900/5 rounded-full blur-[100px] pointer-events-none"></div>
            </>
        )}

        {/* 📖 封面模式 (CurrentPage === -1) */}
        {currentPage === -1 && (
            <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 md:gap-16 items-center animate-in fade-in zoom-in-95 duration-700">
                {/* 封面圖 */}
                <div className="w-full md:w-1/2 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl relative group cursor-pointer" onClick={() => setCurrentPage(0)}>
                    <img src={story.cover_image || story.coverImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                    <div className="absolute bottom-6 right-6 flex items-center gap-2 text-white/80 animate-pulse">
                        <span className="text-sm tracking-widest uppercase">開始閱讀</span>
                        <ArrowRight size={16} />
                    </div>
                </div>

                {/* 書籍資訊 */}
                <div className="w-full md:w-1/2 space-y-8 text-center md:text-left">
                    <div className="space-y-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs tracking-widest uppercase border ${isDarkMode ? 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 bg-indigo-50'}`}>
                            {story.category || 'Memory'}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-serif leading-tight">{story.title}</h1>
                        <div className={`flex items-center justify-center md:justify-start gap-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <div className="flex items-center gap-2"><Calendar size={14}/> {story.memory_date || 'Unknown Date'}</div>
                            <div className="flex items-center gap-2"><Clock size={14}/> {new Date(story.created_at).toLocaleDateString()} 封存</div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setCurrentPage(0)}
                        className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold tracking-widest shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3"
                    >
                        翻開故事 <BookOpen size={18} />
                    </button>
                </div>
            </div>
        )}

        {/* 📖 內頁模式 (CurrentPage >= 0) */}
        {currentPage >= 0 && story.content && story.content[currentPage] && (
            <div className="w-full max-w-6xl flex flex-col md:flex-row h-full md:h-[80vh] gap-6 md:gap-12 animate-in fade-in slide-in-from-right-8 duration-500 key={currentPage}">
                
                {/* 圖像區 */}
                <div className="w-full md:w-1/2 h-[40vh] md:h-full rounded-2xl overflow-hidden shadow-2xl relative">
                    <img 
                        src={story.content[currentPage].image} 
                        alt={`Page ${currentPage + 1}`} 
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* 文字區 */}
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <div className="mb-8 opacity-50 text-xs tracking-[0.2em] font-serif uppercase">
                        Page {currentPage + 1} / {totalPages}
                    </div>
                    
                    <div className="relative">
                        <Quote size={48} className={`absolute -top-8 -left-6 opacity-10 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                        <p className="text-xl md:text-2xl leading-relaxed font-serif whitespace-pre-wrap">
                            {story.content[currentPage].text}
                        </p>
                    </div>

                    {/* 翻頁控制器 */}
                    <div className="mt-12 flex gap-4">
                        <button 
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className={`flex-1 py-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${cardBgClass} hover:bg-indigo-500 hover:border-indigo-500 hover:text-white group`}
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> 上一頁
                        </button>
                        
                        <button 
                            onClick={() => {
                                if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
                                else navigate('/profile'); // 最後一頁看完回列表
                            }}
                            className={`flex-[2] py-4 rounded-xl bg-indigo-600 text-white font-bold tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 group`}
                        >
                            {currentPage < totalPages - 1 ? (
                                <>下一頁 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/></>
                            ) : (
                                <>闔上回憶 <BookOpen size={18}/></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default StoryViewer;