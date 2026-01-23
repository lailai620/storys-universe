import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import {
    ArrowLeft, Play, Pause, Heart, MessageCircle,
    Send, User, ChevronLeft, ChevronRight, Layers,
    Settings, Wand2, BookOpen, Loader2, Sparkles
} from 'lucide-react';

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

const Reader = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { playClick, playHover, playSuccess } = useAudio();
    const { showToast } = useToast();

    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [activePage, setActivePage] = useState(0);
    const [commentInput, setCommentInput] = useState("");

    // 從 Supabase 抓取故事
    useEffect(() => {
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
                showToast('無法載入故事', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchStory();
    }, [id]);

    // Loading 狀態
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f1016] flex items-center justify-center text-indigo-200">
                <Loader2 className="animate-spin mr-3" size={24} />
                <span className="text-sm tracking-widest uppercase">正在解讀星塵訊號...</span>
            </div>
        );
    }

    // 找不到故事
    if (!story) {
        return (
            <div className="min-h-screen bg-[#0f1016] flex flex-col items-center justify-center text-slate-400 gap-4">
                <BookOpen size={48} className="opacity-50" />
                <p>這段記憶似乎已經遺失在黑洞中...</p>
                <button
                    onClick={() => { playClick(); navigate('/gallery'); }}
                    onMouseEnter={playHover}
                    className="text-indigo-400 hover:text-white transition-colors underline"
                >
                    返回星際畫廊
                </button>
            </div>
        );
    }

    // 解析內容
    const isMultiPage = Array.isArray(story.content);
    const pageContent = isMultiPage ? story.content[activePage] : { text: story.content };
    const totalPages = isMultiPage ? story.content.length : 1;

    const handleNext = () => {
        playClick();
        if (activePage < totalPages - 1) setActivePage(activePage + 1);
    };

    const handlePrev = () => {
        playClick();
        if (activePage > 0) setActivePage(activePage - 1);
    };

    const handleLike = () => {
        playClick();
        if (!isLiked) {
            setIsLiked(true);
            playSuccess();
            showToast('已接收到您的情感共鳴 ✨', 'success');
        } else {
            setIsLiked(false);
        }
    };

    const handleGiftStardust = () => {
        playClick();
        playSuccess();
        showToast('🌟 已投遞 10 星塵給作者！（功能開發中）', 'success');
    };

    const handleSendComment = () => {
        if (!commentInput.trim()) return;
        playSuccess();
        showToast('留言已送出！', 'success');
        setCommentInput("");
    };

    const isKids = story.style === 'kids';
    const dateStr = story.created_at
        ? new Date(story.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    return (
        <div className="min-h-screen bg-[#0f1016] text-slate-200 font-sans selection:bg-indigo-500/30 relative">

            {/* 動態漸層背景 */}
            <div className={`absolute top-0 left-0 right-0 h-[50vh] ${getGradientByStyle(story.style)} opacity-30 blur-3xl`}></div>
            <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-transparent to-[#0f1016]"></div>

            {/* 頂部導航 */}
            <div className="fixed top-4 left-4 z-50 flex items-center gap-4">
                <button
                    onClick={() => { playClick(); navigate(-1); }}
                    onMouseEnter={playHover}
                    className="bg-black/40 backdrop-blur-md p-3 rounded-full hover:bg-black/60 transition text-white border border-white/10"
                >
                    <ArrowLeft size={20} />
                </button>
                {isMultiPage && (
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold flex items-center gap-2 border border-white/10">
                        <Layers size={14} /> 第 {activePage + 1} / {totalPages} 頁
                    </div>
                )}
            </div>

            {/* 主內容區 */}
            <div className="relative z-10 max-w-6xl mx-auto min-h-screen flex flex-col md:flex-row items-center justify-center gap-8 p-6 pt-24">

                {/* 左側：視覺區塊（漸層替代圖片） */}
                <div className="w-full md:w-1/2 aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                    {/* 漸層背景 */}
                    <div className={`absolute inset-0 ${getGradientByStyle(story.style)}`}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* 中央裝飾 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={80} className="text-white/20" />
                    </div>

                    {/* 風格標籤 */}
                    <div className="absolute top-4 right-4 z-20">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 uppercase tracking-wider text-white">
                            {story.style || 'story'}
                        </span>
                    </div>

                    {/* 多頁導航 */}
                    {isMultiPage && (
                        <>
                            <button
                                onClick={handlePrev}
                                disabled={activePage === 0}
                                onMouseEnter={playHover}
                                className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-black/40 to-transparent opacity-0 hover:opacity-100 flex items-center justify-center transition disabled:hidden"
                            >
                                <ChevronLeft size={48} className="text-white drop-shadow-lg" />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={activePage === totalPages - 1}
                                onMouseEnter={playHover}
                                className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-black/40 to-transparent opacity-0 hover:opacity-100 flex items-center justify-center transition disabled:hidden"
                            >
                                <ChevronRight size={48} className="text-white drop-shadow-lg" />
                            </button>
                        </>
                    )}
                </div>

                {/* 右側：文字區 */}
                <div className="w-full md:w-1/2 space-y-6">

                    {/* 標題區 */}
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-bold text-white font-serif">{story.title}</h1>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center">
                                    <User size={12} className="text-indigo-300" />
                                </div>
                                <span>{story.author_name || 'Unknown Traveler'}</span>
                            </div>
                            <span className="opacity-50">•</span>
                            <span>{dateStr}</span>
                        </div>
                    </div>

                    {/* 分隔線 */}
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    {/* 內容 */}
                    <div className="text-lg leading-relaxed text-slate-300 whitespace-pre-wrap min-h-[200px]">
                        {pageContent?.text || story.content}
                    </div>

                    {/* 頁面指示器 */}
                    {isMultiPage && (
                        <div className="flex justify-center gap-2 pt-4">
                            {story.content.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { playClick(); setActivePage(i); }}
                                    className={`h-2 rounded-full transition-all ${i === activePage ? 'bg-indigo-500 w-8' : 'bg-slate-600 w-2 hover:bg-slate-500'}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* 互動按鈕 */}
                    <div className="flex flex-wrap gap-3 pt-4">
                        <button
                            onClick={handleLike}
                            onMouseEnter={playHover}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md transition-all ${isLiked ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'border-white/20 text-slate-300 hover:bg-white/10'}`}
                        >
                            <Heart size={16} className={isLiked ? 'fill-rose-400' : ''} />
                            {isLiked ? '已喜歡' : '喜歡'}
                        </button>

                        <button
                            onClick={() => { playClick(); navigate('/create'); }}
                            onMouseEnter={playHover}
                            className="flex items-center gap-2 px-4 py-2 border border-indigo-500/30 text-indigo-400 rounded-full hover:bg-indigo-500/10 backdrop-blur-md transition"
                        >
                            <Wand2 size={16} /> 進行二創
                        </button>
                    </div>
                </div>
            </div>

            {/* 底部區塊 */}
            <div className="relative z-10 max-w-3xl mx-auto px-6 pb-20 space-y-8">

                {/* 投遞星塵按鈕 */}
                <div className="flex justify-center">
                    <button
                        onClick={handleGiftStardust}
                        onMouseEnter={playHover}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-lg shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] hover:scale-105 transition-all"
                    >
                        <Sparkles size={24} className="drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                        投遞星塵給作者
                    </button>
                </div>

                {/* 留言區 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-300">
                        <MessageCircle size={18} /> 留言區
                    </h3>
                    <div className="flex gap-3">
                        <input
                            value={commentInput}
                            onChange={e => setCommentInput(e.target.value)}
                            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none text-white placeholder:text-slate-500 focus:border-indigo-500 transition-colors"
                            placeholder="說點什麼..."
                        />
                        <button
                            onClick={handleSendComment}
                            onMouseEnter={playHover}
                            className="bg-indigo-600 hover:bg-indigo-500 px-5 rounded-xl text-white font-bold transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

                {/* 結尾標記 */}
                <div className="flex justify-center pt-8">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <BookOpen size={16} />
                        <span className="tracking-widest uppercase">End of Story</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reader;