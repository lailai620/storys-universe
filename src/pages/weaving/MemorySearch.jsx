import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { searchMemories, isAIConfigured } from '../../services/weavingAI';
import { getStories } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { tapFeedback, successFeedback } from '../../services/hapticService';

/**
 * 🔍 AI 時光機 — 用自然語言找回你的珍貴回憶
 */
const MemorySearch = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState(null); // { results: [], message: '' }
    const [allStories, setAllStories] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    // ─── 語音輸入 (Web Speech API) ──────────────────────────
    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setQuery('（您的瀏覽器不支援語音輸入，請直接打字搜尋）');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-TW';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            setQuery(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        tapFeedback();
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    // ─── 執行搜尋 ──────────────────────────────────────────────
    const handleSearch = useCallback(async () => {
        if (!query.trim() || isSearching) return;
        tapFeedback();
        setIsSearching(true);
        setResults(null);

        try {
            // 先載入所有故事（給結果頁面用）
            const stories = await getStories();
            setAllStories(stories);

            // 呼叫 AI 語意搜尋
            const searchResult = await searchMemories(query.trim());
            setResults(searchResult);
            successFeedback();
        } catch (error) {
            console.error('搜尋失敗:', error);
            setResults({
                results: [],
                message: '搜尋時發生了問題，請稍後再試。',
            });
        } finally {
            setIsSearching(false);
        }
    }, [query, isSearching]);

    // ─── 根據 ID 找到完整故事資料 ────────────────────────────
    const getStoryDetails = (storyId) => {
        return allStories.find(s => s.id === storyId);
    };

    // ─── 快捷搜尋建議 ──────────────────────────────────────────
    const SUGGESTIONS = [
        '找出和家人有關的故事',
        '去年最開心的回憶',
        '跟寵物有關的溫暖時刻',
        '讓我感動落淚的故事',
    ];

    return (
        <WeavingLayout showNav={false}>
            {/* Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-base font-bold font-display">AI 時光機</h1>
                    <p className="text-xs text-violet-500 font-medium">用語言找回你的回憶</p>
                </div>
                <div className="w-10" />
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24 overflow-y-auto">
                {/* 搜尋區域 */}
                <div className="mt-6 mb-8">
                    {/* 魔法光暈背景 */}
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/10 via-primary/10 to-rose-500/10 rounded-3xl blur-2xl animate-pulse" />
                        <div className="relative bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-lg shadow-violet-500/5 border border-violet-500/15">
                            {/* 語音 + 文字輸入 */}
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
                                        isListening
                                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse scale-110'
                                            : 'bg-violet-500/15 text-violet-600 dark:text-violet-400 hover:bg-violet-500/25'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-2xl">
                                        {isListening ? 'stop_circle' : 'mic'}
                                    </span>
                                </button>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder={isListening ? '正在聆聽你的聲音...' : '描述你想找的回憶...'}
                                        className="w-full px-4 py-3 bg-background-light dark:bg-background-dark rounded-xl text-sm border border-violet-500/20 focus:border-violet-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* 搜尋按鈕 */}
                            <button
                                onClick={handleSearch}
                                disabled={!query.trim() || isSearching}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                    query.trim() && !isSearching
                                        ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                                        : 'bg-violet-500/10 text-violet-500/40 cursor-not-allowed'
                                }`}
                            >
                                {isSearching ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        AI 正在翻閱你的時光...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">search</span>
                                        搜尋回憶
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 快捷建議 */}
                    {!results && (
                        <div className="mt-5 space-y-2">
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium px-1">
                                試試這樣搜尋：
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => { setQuery(s); tapFeedback(); }}
                                        className="px-3 py-1.5 text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full hover:bg-violet-500/20 transition-colors border border-violet-500/20"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 搜尋結果 */}
                {results && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* AI 回覆訊息 */}
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                            </div>
                            <div className="flex-1 bg-surface-light dark:bg-surface-dark rounded-2xl rounded-tl-sm p-4">
                                <p className="text-sm text-text-primary-light dark:text-text-primary-dark leading-relaxed">
                                    {results.message}
                                </p>
                            </div>
                        </div>

                        {/* 故事結果卡片 */}
                        {results.results.length > 0 && (
                            <div className="space-y-3">
                                {results.results.map((r, i) => {
                                    const story = getStoryDetails(r.id);
                                    if (!story) return null;
                                    const date = story.created_at || story.createdAt;
                                    const dateStr = date ? new Date(date).toLocaleDateString('zh-TW') : '';

                                    return (
                                        <button
                                            key={r.id}
                                            onClick={() => { tapFeedback(); navigate(`/story/${r.id}`); }}
                                            className="w-full text-left bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-violet-500/30 border border-transparent transition-all active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2"
                                            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-violet-500 text-lg">auto_stories</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark truncate">
                                                        {story.title || '無標題'}
                                                    </h3>
                                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5 line-clamp-2">
                                                        {(story.content || '').substring(0, 80)}...
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {dateStr && (
                                                            <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark bg-violet-500/5 px-2 py-0.5 rounded-full">
                                                                {dateStr}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                                                            {r.relevance}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                                                    arrow_forward_ios
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* 無結果 */}
                        {results.results.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-violet-500 text-3xl">search_off</span>
                                </div>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    試試用不同的方式描述你的回憶吧！
                                </p>
                            </div>
                        )}

                        {/* 重新搜尋 */}
                        <button
                            onClick={() => { setResults(null); setQuery(''); }}
                            className="w-full py-2.5 text-sm text-violet-600 dark:text-violet-400 font-medium bg-violet-500/10 rounded-xl hover:bg-violet-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            重新搜尋
                        </button>
                    </div>
                )}

                {/* 未登入提示 */}
                {!isAuthenticated && !results && (
                    <div className="mt-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-violet-500 text-3xl">lock</span>
                        </div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                            登入後即可使用 AI 時光機搜尋你的故事
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2.5 bg-violet-500 text-white text-sm font-bold rounded-xl hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/20"
                        >
                            前往登入
                        </button>
                    </div>
                )}
            </main>
        </WeavingLayout>
    );
};

export default MemorySearch;
