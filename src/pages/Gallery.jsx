import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import { useStory } from '../context/StoryContext';
import { Search, Compass, BookOpen, Filter, Loader2, Sparkles, ArrowLeft, User, HardDrive } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import OptimizedImage from '../components/OptimizedImage';

// Helper: 根據風格回傳漸層背景
const getGradientByStyle = (style) => {
  const gradients = {
    fantasy: 'bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900',
    scifi: 'bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-950',
    romance: 'bg-gradient-to-br from-rose-900 via-pink-800 to-purple-900',
    horror: 'bg-gradient-to-br from-red-950 via-gray-900 to-black',
    novel: 'bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900',
    kids: 'bg-gradient-to-br from-pink-400 via-orange-300 to-yellow-300',
    memoir: 'bg-gradient-to-br from-amber-800 via-orange-700 to-rose-800',
  };
  return gradients[style] || 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900';
};

// Helper: 根據風格回傳標籤樣式
const getTagStyleByStyle = (style) => {
  const styles = {
    fantasy: 'bg-purple-500/40 border-purple-300/50 text-purple-100',
    scifi: 'bg-cyan-500/40 border-cyan-300/50 text-cyan-100',
    romance: 'bg-rose-500/40 border-rose-300/50 text-rose-100',
    horror: 'bg-red-500/40 border-red-300/50 text-red-100',
    novel: 'bg-emerald-500/40 border-emerald-300/50 text-emerald-100',
    kids: 'bg-pink-500/40 border-pink-300/50 text-pink-100',
    memoir: 'bg-amber-500/40 border-amber-300/50 text-amber-100',
  };
  return styles[style] || 'bg-indigo-500/40 border-indigo-300/50 text-indigo-100';
};

const Gallery = () => {
  const navigate = useNavigate();
  const { playHover, playClick, changeBgm } = useAudio();
  const { showToast } = useToast();
  const { getGuestStories } = useStory();

  const [stories, setStories] = useState([]);
  const [guestStories, setGuestStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPublicStories();
    // 載入本地訪客故事
    const localStories = getGuestStories();
    setGuestStories(localStories);
    changeBgm('space');
  }, []);

  const fetchPublicStories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching public stories:', error);
    } finally {
      // 確保至少加載一秒顯示動畫
      setTimeout(() => setLoading(false), 800);
    }
  };

  const filteredStories = stories.filter(story => {
    const storyStyle = story.style || 'novel';
    const matchesFilter = activeFilter === 'all' || storyStyle === activeFilter;
    const matchesSearch = story.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.content && typeof story.content === 'string' && story.content.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const categories = [
    { id: 'all', label: '全部星域' },
    { id: 'novel', label: '小說象限' },
    { id: 'fantasy', label: '奇幻星雲' },
    { id: 'scifi', label: '科幻銀河' },
    { id: 'romance', label: '浪漫星座' },
    { id: 'horror', label: '暗黑深淵' },
    { id: 'memoir', label: '回憶星雲' },
    { id: 'kids', label: '童話星系' },
  ];

  return (
    // 修改 1: 改為 bg-transparent，讓 ScreenEffects 的動態星球色彩透出來
    <div className="min-h-screen bg-transparent text-slate-200 font-sans selection:bg-indigo-500/30 pt-36 pb-20 px-4 md:px-8 relative">
      <Helmet>
        <title>星際畫廊 | Storys Universe - 漫遊大眾的故事宇宙</title>
        <meta name="description" content="在星際畫廊中發掘來自世界各地的精彩故事與回憶。這裡漂浮著來自各個時空的記憶碎片。" />
        <meta property="og:title" content="Storys Universe 星際畫廊" />
        <meta property="og:description" content="漫遊星際畫廊，發掘無限靈魂的創作。" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* 導航列 */}
        <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
          <button
            onClick={() => { playClick(); navigate('/'); }}
            onMouseEnter={playHover}
            className="text-indigo-200/70 hover:text-white flex items-center gap-2 text-sm transition-colors group px-4 py-2 rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 返回宇宙首頁
          </button>

          <button
            onClick={() => { playClick(); navigate('/profile'); }}
            onMouseEnter={playHover}
            className="text-indigo-200/70 hover:text-white flex items-center gap-2 text-sm transition-colors group px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 backdrop-blur-sm"
          >
            <User size={14} /> 我的檔案館
          </button>
        </div>

        {/* 標題與搜尋區 */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-bold tracking-[0.2em] uppercase mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Compass size={14} /> Public Universe
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
            漫遊星際畫廊
          </h1>
          <p className="text-indigo-100/80 max-w-xl mx-auto text-lg mb-10 font-medium">
            這裡漂浮著來自各個時空的記憶碎片。<br />選擇一個感興趣的訊號，開始解讀。
          </p>

          {/* 搜尋框 */}
          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-indigo-200" size={20} />
              <input
                type="text"
                placeholder="搜尋故事標題或內容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-full py-3 pl-12 pr-6 text-white placeholder:text-indigo-200/50 focus:outline-none focus:border-indigo-400/50 focus:bg-white/20 transition-all shadow-xl backdrop-blur-md"
              />
            </div>
          </div>
        </div>

        {/* 分類導航 */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { playClick(); setActiveFilter(cat.id); }}
              onMouseEnter={playHover}
              className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-300 border backdrop-blur-sm ${activeFilter === cat.id
                ? 'bg-white text-indigo-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-105'
                : 'bg-white/5 text-indigo-200 border-white/10 hover:bg-white/20 hover:text-white hover:border-white/30'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 🌟 我的創作區塊 (本地訪客故事) */}
        {guestStories.length > 0 && (
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40">
                <HardDrive size={16} className="text-amber-400" />
                <span className="text-amber-300 font-bold text-sm">我的創作</span>
              </div>
              <span className="text-slate-500 text-sm">儲存在您裝置上的故事</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {guestStories.map((story, idx) => (
                <div
                  key={story.id}
                  onClick={() => { playClick(); navigate(`/story/${story.id}`); }}
                  onMouseEnter={playHover}
                  className="group relative bg-amber-500/5 hover:bg-amber-500/10 rounded-2xl overflow-hidden border border-amber-500/20 hover:border-amber-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] cursor-pointer flex flex-col backdrop-blur-md"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* 圖片區 */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    <div className={`w-full h-full ${getGradientByStyle(story.style)} flex items-center justify-center`}>
                      <Sparkles size={48} className="text-white/30" />
                    </div>
                    <div className="absolute top-3 left-3 z-20">
                      <span className="text-[10px] font-bold px-2 py-1 rounded border backdrop-blur-md uppercase tracking-wider shadow-lg bg-amber-500/40 border-amber-300/50 text-amber-100">
                        本地
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 z-20">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border backdrop-blur-md uppercase tracking-wider shadow-lg ${getTagStyleByStyle(story.style)}`}>
                        {story.style || 'story'}
                      </span>
                    </div>
                  </div>

                  {/* 文字區 */}
                  <div className="p-5 flex-1 flex flex-col relative">
                    <div className="absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent group-hover:via-amber-500/60 transition-colors duration-500"></div>

                    <h3 className="text-lg font-bold text-white mb-2 font-serif line-clamp-1 group-hover:text-amber-200 transition-colors drop-shadow-sm">
                      {story.title}
                    </h3>
                    <p className="text-indigo-100/70 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
                      {Array.isArray(story.content) ? story.content[0]?.text : story.content?.substring(0, 80)}...
                    </p>

                    <div className="flex items-center justify-between text-xs text-indigo-200/60 mt-auto pt-4 border-t border-amber-500/20">
                      <span className="flex items-center gap-1 group-hover:text-white transition-colors">
                        <HardDrive size={12} className="text-amber-300" />
                        {story.author_name || "訪客旅人"}
                      </span>
                      <span className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity text-white font-bold">
                        閱讀 <BookOpen size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 故事網格 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-indigo-200">
            <div className="w-10 h-10 border-4 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin"></div>
            <span className="text-xs tracking-widest uppercase opacity-70">Scanning Sector...</span>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20 opacity-50 text-indigo-200">
            <Filter size={48} className="mx-auto mb-4" />
            <p>這個星域目前沒有偵測到任何訊號。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-1000">
            {filteredStories.map((story, idx) => (
              <div
                key={story.id}
                onClick={() => { playClick(); navigate(`/story/${story.id}`); }}
                onMouseEnter={playHover}
                // 修改 2: 卡片全玻璃化，讓背景透出來
                className="group relative bg-white/10 hover:bg-white/20 rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] cursor-pointer flex flex-col backdrop-blur-md"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* 圖片區 */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
                  {story.cover_image ? (
                    <OptimizedImage
                      src={story.cover_image}
                      alt={story.title}
                      width={400} // 畫廊卡片使用中尺寸縮圖
                      className="w-full h-full transition-transform duration-1000 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`w-full h-full ${getGradientByStyle(story.style)} flex items-center justify-center`}>
                      <Sparkles size={48} className="text-white/30" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 z-20">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border backdrop-blur-md uppercase tracking-wider shadow-lg ${getTagStyleByStyle(story.style)}`}>
                      {story.style || 'story'}
                    </span>
                  </div>
                </div>

                {/* 文字區 */}
                <div className="p-5 flex-1 flex flex-col relative">
                  <div className="absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/50 transition-colors duration-500"></div>

                  <h3 className="text-lg font-bold text-white mb-2 font-serif line-clamp-1 group-hover:text-amber-200 transition-colors drop-shadow-sm">
                    {story.title}
                  </h3>
                  <p className="text-indigo-100/70 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
                    {Array.isArray(story.content) ? story.content[0]?.text : story.content?.substring(0, 80)}...
                  </p>

                  <div className="flex items-center justify-between text-xs text-indigo-200/60 mt-auto pt-4 border-t border-white/10">
                    <span className="flex items-center gap-1 group-hover:text-white transition-colors">
                      <Sparkles size={12} className="text-amber-300" />
                      {story.author_name || "Unknown Traveler"}
                    </span>
                    <span className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity text-white font-bold">
                      Read Story <BookOpen size={12} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Gallery;