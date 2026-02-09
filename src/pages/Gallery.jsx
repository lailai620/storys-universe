import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import { useStory } from '../context/StoryContext';
import { getModeConfig } from '../config/modeConfig';
import { Search, Compass, BookOpen, Sparkles, HardDrive } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import OptimizedImage from '../components/OptimizedImage';
import { GallerySkeleton } from '../components/Skeleton';
import { EmptyState, Card3D } from '../components/ui';

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
  const { getGuestStories, appMode } = useStory();

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

  // 取得當前模式配置
  const currentModeConfig = getModeConfig(appMode);

  // 🎯 根據模式過濾故事：只顯示該模式下創建的故事
  const filteredStories = stories.filter(story => {
    const storyStyle = story.style || 'novel';
    const storyMode = story.mode || 'universe'; // 預設為 universe 模式

    // 模式過濾：只顯示當前模式的故事
    const matchesMode = storyMode === appMode;

    // 類別過濾
    const matchesFilter = activeFilter === 'all' || storyStyle === activeFilter;

    // 搜尋過濾
    const matchesSearch = story.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.content && typeof story.content === 'string' && story.content.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesMode && matchesFilter && matchesSearch;
  });

  // 🎨 根據當前模式動態生成類別選項
  const categories = [
    { id: 'all', label: appMode === 'kids' ? '🌈 全部故事' : (appMode === 'memoir' ? '📷 全部回憶' : '🌌 全部星域') },
    ...currentModeConfig.categories.map(cat => ({
      id: cat.id,
      label: `${cat.icon} ${cat.name}`,
    })),
  ];

  return (
    // 修改 1: 改為 bg-transparent，讓 ScreenEffects 的動態星球色彩透出來
    <div className="min-h-screen bg-transparent text-slate-200 font-sans selection:bg-indigo-500/30 pt-8 pb-20 px-4 md:px-8 relative">
      <Helmet>
        <title>星際畫廊 | Storys Universe - 漫遊大眾的故事宇宙</title>
        <meta name="description" content="在星際畫廊中發掘來自世界各地的精彩故事與回憶。這裡漂浮著來自各個時空的記憶碎片。" />
        <meta property="og:title" content="Storys Universe 星際畫廊" />
        <meta property="og:description" content="漫遊星際畫廊，發掘無限靈魂的創作。" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="max-w-7xl mx-auto relative z-10">

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
          <div className="max-w-lg mx-auto relative group">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative">
              <Search className="absolute left-5 top-4 text-indigo-300/70" size={20} />
              <input
                type="text"
                placeholder="搜尋故事標題或內容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all shadow-lg backdrop-blur-xl"
              />
            </div>
          </div>
        </div>

        {/* 分類導航 */}
        <div className="flex flex-wrap justify-center gap-3 mb-14 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { playClick(); setActiveFilter(cat.id); }}
              onMouseEnter={playHover}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 border backdrop-blur-sm cursor-pointer ${activeFilter === cat.id
                ? 'bg-white text-slate-900 border-white shadow-lg scale-105'
                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/15 hover:text-white hover:border-white/25'
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
          <GallerySkeleton count={8} />
        ) : filteredStories.length === 0 ? (
          <EmptyState
            variant={searchTerm ? 'search' : 'stories'}
            title={searchTerm ? '找不到相關故事' : '星際畫廊目前是空的'}
            description={searchTerm ? `沒有找到「${searchTerm}」相關的故事，試試其他關鍵字吧` : '等待第一位旅人分享他的故事...'}
            actionLabel="開始創作"
            onAction={() => navigate('/create')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-1000">
            {filteredStories.map((story, idx) => (
              <Card3D
                key={story.id}
                intensity={8}
                scale={1.02}
                className="cursor-pointer"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div
                  onClick={() => { playClick(); navigate(`/story/${story.id}`); }}
                  onMouseEnter={playHover}
                  className="group relative bg-white/10 hover:bg-white/20 rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] flex flex-col backdrop-blur-md h-full"
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
              </Card3D>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Gallery;