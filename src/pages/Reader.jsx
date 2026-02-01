import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import { useStory } from '../context/StoryContext';
import {
    ArrowLeft, Play, Pause, Heart, MessageCircle,
    Send, User, ChevronLeft, ChevronRight, Layers,
    Settings, Wand2, BookOpen, Loader2, Sparkles, Volume2, VolumeX, Square
} from 'lucide-react';
import { ShareDropdown } from '../components/ShareButtons';

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
    const {
        appMode,
        user,
        userCollections,
        toggleFavorite,
        readingProgress,
        updateProgress
    } = useStory();

    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(0);
    const [commentInput, setCommentInput] = useState("");
    const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

    // 判斷是否已收藏 (與 Context 連動)
    const isLiked = userCollections.some(s => s.id === id);

    // 🎙️ TTS 語音朗讀狀態 (使用 AudioContext 的狀態)
    const { isSpeaking: isAiSpeaking, startSpeaking, stopSpeaking } = useAudio();
    const [isLoadingVoice, setIsLoadingVoice] = useState(false);

    // 🎙️ TTS 控制函數 (AI 自然語言版)
    const handleSpeak = async () => {
        if (!story) return;
        playClick();

        // 停止之前的朗讀
        if (isAiSpeaking) {
            stopSpeaking();
            return;
        }

        // 取得當前頁面的文字
        const text = isMultiPage
            ? story.content[activePage]?.text || ''
            : story.content || '';

        if (!text.trim()) {
            showToast('此頁沒有可朗讀的內容', 'info');
            return;
        }

        setIsLoadingVoice(true);
        showToast('🎙️ AI 正在解碼星際語音...', 'info');

        try {
            // 根據故事風格選擇適合的音色
            let voice = 'nova';
            if (story.style === 'kids') voice = 'alloy';
            if (story.style === 'horror') voice = 'onyx';
            if (story.style === 'romance') voice = 'shimmer';

            await startSpeaking(text, { voice });
        } catch (error) {
            console.error('Speech synthesis failed:', error);
            showToast('語音朗讀失敗，請檢查 API Key 設定。', 'error');
        } finally {
            setIsLoadingVoice(false);
        }
    };

    const handleStopSpeak = () => {
        playClick();
        stopSpeaking();
    };

    // 切換頁面時停止朗讀
    useEffect(() => {
        return () => {
            stopSpeaking();
        };
    }, [activePage, stopSpeaking]);


    // 從 Supabase 或 localStorage 抓取故事
    useEffect(() => {
        const fetchStory = async () => {
            try {
                // 檢查是否為訪客故事 (ID 以 'guest_' 開頭)
                if (id && id.startsWith('guest_')) {
                    const guestStories = JSON.parse(localStorage.getItem('guest_stories') || '[]');
                    const guestStory = guestStories.find(s => s.id === id);
                    if (guestStory) {
                        setStory(guestStory);
                    } else {
                        showToast('找不到本地故事', 'error');
                    }
                    setLoading(false);
                    return;
                }

                // 從 Supabase 抓取
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

    // 🔄 恢復閱讀進度
    useEffect(() => {
        if (story && !hasRestoredProgress && readingProgress[id] !== undefined) {
            const lastPage = readingProgress[id];
            if (lastPage > 0 && lastPage < (Array.isArray(story.content) ? story.content.length : 1)) {
                setActivePage(lastPage);
                showToast(`🚀 已自動跳轉至上次閱讀進度 (第 ${lastPage + 1} 頁)`, 'info');
            }
            setHasRestoredProgress(true);
        }
    }, [story, readingProgress, id, hasRestoredProgress]);

    // 🔄 自動儲存進度
    useEffect(() => {
        if (user && story && hasRestoredProgress) {
            updateProgress(id, activePage);
        }
    }, [activePage, id, user, story, hasRestoredProgress]);

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

    const handleLike = async () => {
        if (!user) {
            showToast('請先登入才能收藏故事唷 ✨', 'error');
            return;
        }
        playClick();
        const success = await toggleFavorite(id);
        if (success) {
            if (!isLiked) {
                playSuccess();
                showToast('已加入您的星際收藏 ✨', 'success');
            } else {
                showToast('已從收藏中移出', 'info');
            }
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
            <div className="relative z-10 max-w-5xl mx-auto min-h-screen flex flex-col items-center gap-12 p-6 pt-24 pb-32">

                {/* 1. 標題與作者區 (標前置頂) */}
                <div className="text-center space-y-4 w-full">
                    <h1 className={`${appMode === 'senior' ? 'text-6xl text-amber-200' : 'text-4xl md:text-6xl text-white font-serif'} font-bold transition-all duration-500`}>
                        {story.title}
                    </h1>
                    <div className={`flex items-center justify-center gap-4 ${appMode === 'senior' ? 'text-xl text-amber-500/80' : 'text-sm text-slate-400'}`}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-white/5">
                                <User size={appMode === 'senior' ? 18 : 14} className="text-indigo-300" />
                            </div>
                            <span className="font-medium">{story.author_name || '探索者'}</span>
                        </div>
                        <span className="opacity-30">|</span>
                        <span>{dateStr}</span>
                        {story.style && (
                            <>
                                <span className="opacity-30">|</span>
                                <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 uppercase tracking-tighter text-[10px] font-bold">
                                    {story.style}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. 視覺區塊 (大圖展示) */}
                <div className="w-full aspect-video relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group shadow-black/80">
                    {/* 背景底圖/漸層 */}
                    <div className={`absolute inset-0 ${getGradientByStyle(story.style)}`}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>

                    {/* 這裡未來可擴展為真實圖片，目前以圖標與漸層示意 */}
                    {pageContent?.image ? (
                        <img src={pageContent.image} alt="Story Scene" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles size={120} className={`opacity-10 ${appMode === 'senior' ? 'text-amber-500' : 'text-indigo-400'}`} />
                        </div>
                    )}

                    {/* 多頁導航按鈕 (僅在多頁時顯示) */}
                    {isMultiPage && (
                        <>
                            <button
                                onClick={handlePrev}
                                disabled={activePage === 0}
                                onMouseEnter={playHover}
                                className="absolute left-0 top-0 bottom-0 w-1/6 bg-gradient-to-r from-black/60 to-transparent opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all disabled:hidden"
                            >
                                <ChevronLeft size={64} className="text-white drop-shadow-2xl" />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={activePage === totalPages - 1}
                                onMouseEnter={playHover}
                                className="absolute right-0 top-0 bottom-0 w-1/6 bg-gradient-to-l from-black/60 to-transparent opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all disabled:hidden"
                            >
                                <ChevronRight size={64} className="text-white drop-shadow-2xl" />
                            </button>
                        </>
                    )}
                </div>

                {/* 3. 文字內容區 (寬度優化有利於閱讀) */}
                <div className="w-full max-w-3xl flex flex-col gap-8">
                    {/* 分隔線裝飾 */}
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                        <BookOpen size={20} className="text-white/20" />
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                    </div>

                    {/* 正文內容 */}
                    <div className={`${appMode === 'senior' ? 'text-4xl leading-relaxed text-amber-50' : 'text-xl leading-relaxed text-slate-200'} whitespace-pre-wrap min-h-[150px] transition-all duration-500 font-serif`}>
                        {pageContent?.text || story.content}
                    </div>

                    {/* 頁面分點指示器 */}
                    {isMultiPage && (
                        <div className="flex justify-center gap-3 py-4">
                            {story.content.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { playClick(); setActivePage(i); }}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${i === activePage ? 'bg-indigo-400 w-12' : 'bg-white/10 w-3 hover:bg-white/20'}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* 互動工具列 */}
                    <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/5 pt-8">
                        {/* 🎙️ TTS 朗讀按鈕 (AI 自然語言版) */}
                        <button
                            onClick={handleSpeak}
                            onMouseEnter={playHover}
                            disabled={isLoadingVoice}
                            className={`flex items-center gap-2 ${appMode === 'senior' ? 'px-8 py-4 text-2xl' : 'px-4 py-2 text-base'} rounded-full border backdrop-blur-md transition-all shadow-xl font-bold ${isAiSpeaking
                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                                : 'border-white/20 text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            {isLoadingVoice ? (
                                <><Loader2 size={appMode === 'senior' ? 24 : 16} className="animate-spin" /> {appMode === 'senior' ? '正在解讀...' : '解讀語音中'}</>
                            ) : isAiSpeaking ? (
                                <><Square size={appMode === 'senior' ? 24 : 16} /> {appMode === 'senior' ? '停止朗讀' : '停止朗讀'}</>
                            ) : (
                                <><Volume2 size={appMode === 'senior' ? 24 : 16} /> {appMode === 'senior' ? '播放故事' : '朗讀故事'}</>
                            )}
                        </button>


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

                        {/* 📤 社群分享按鈕 */}
                        <ShareDropdown
                            url={typeof window !== 'undefined' ? window.location.href : ''}
                            text={`來看看這個精彩的故事：「${story?.title || ''}」🌟`}
                        />
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