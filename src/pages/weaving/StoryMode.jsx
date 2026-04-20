import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tapFeedback, successFeedback } from '../../services/hapticService';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import {
    sendMessage,
    getInitialGreeting,
    saveSession,
    loadSession,
    summarizeStory,
    saveCompletedStory,
    isAIConfigured,
    getEmotionStyle,
    speakWithOpenAI,
} from '../../services/weavingAI';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

/**
 * 🌟 故事模式：溫柔採訪者
 * AI 引導使用者回憶並記錄珍貴的生命故事
 */
const StoryMode = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { isPro } = useAuth();
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category') || 'default';
    const sessionId = searchParams.get('session') || `session_${Date.now()}`;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [occurredAt, setOccurredAt] = useState(new Date().toISOString().split('T')[0]);
    const [showSuccessGlow, setShowSuccessGlow] = useState(false);
    // 情緒引擎：接收 AI 回傳的 emotion tag
    const [currentEmotion, setCurrentEmotion] = useState('calm');
    // 使用者自訂的故事標題
    const [customTitle, setCustomTitle] = useState('');

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const initializedRef = useRef(false);

    // ─── 初始化對話 ───────────────────────────────────────────
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        // 嘗試載入既存對話
        const saved = loadSession(sessionId);
        if (saved && saved.messages.length > 0) {
            setMessages(saved.messages);
            return;
        }

        // 新對話：顯示開場白
        const greeting = getInitialGreeting(category);
        setMessages([{ role: 'ai', text: greeting, time: now() }]);
    }, [sessionId, category]);

    // ─── 自動滾動 ─────────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    // ─── 自動儲存 ─────────────────────────────────────────────
    useEffect(() => {
        if (messages.length > 1) {
            saveSession(sessionId, messages, { category, createdAt: messages[0]?.time });
        }
    }, [messages, sessionId, category]);

    // ─── 發送訊息 ─────────────────────────────────────────────
    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isThinking) return;

        const userMsg = { role: 'user', text, time: now() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setIsThinking(true);
        tapFeedback();

        try {
            const aiResponse = await sendMessage(
                updatedMessages.filter(m => m.role), // 過濾掉可能的無效項
                text
            );

            // 新版回傳含情緒的物件 { emotion, spoken_reply, story_content }
            let aiText = '';
            if (aiResponse && typeof aiResponse === 'object' && aiResponse.spoken_reply) {
                aiText = aiResponse.spoken_reply;
                // 觸發情緒 UI 漸變
                setCurrentEmotion(aiResponse.emotion || 'calm');
                // 用 OpenAI TTS 以對應情緒語速朗讀
                const emotionStyle = getEmotionStyle(aiResponse.emotion || 'calm');
                speakWithOpenAI(aiText, emotionStyle.ttsRate);
            } else {
                // 向上相容：舊版純文字回傳
                aiText = typeof aiResponse === 'string' ? aiResponse : '我總會在這裡陪伴你。';
            }

            setMessages(prev => [...prev, { role: 'ai', text: aiText, time: now() }]);
        } catch (error) {
            console.error('AI 回應錯誤:', error);
            setMessages(prev => [...prev, {
                role: 'ai',
                text: '抱歉，我剛才分心了。你可以再說一次嗎？',
                time: now(),
            }]);
        } finally {
            setIsThinking(false);
        }
    }, [input, messages, isThinking]);


    // ─── 完成故事 ─────────────────────────────────────────────
    const handleComplete = useCallback(async () => {
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length < 2) {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: '讓我們再多聊一些吧，這樣我才能幫你織出一個完整的故事。',
                time: now(),
            }]);
            return;
        }

        setIsSummarizing(true);
        setShowMenu(false);

        try {
            const story = await summarizeStory(messages);
            const finalTitle = customTitle.trim() || `${getCategoryName(category)}的回憶`;
            await saveCompletedStory({
                id: sessionId,
                title: finalTitle,
                content: story,
                category,
                status: 'published',
                occurred_at: occurredAt ? `${occurredAt}T00:00:00.000Z` : new Date().toISOString(),
                messageCount: messages.length,
                is_ai_generated: true
            });

            setMessages(prev => [...prev, {
                role: 'system',
                text: '故事已成功織好並儲存了！',
                time: now(),
            }]);
            successFeedback();
            setShowSuccessGlow(true);

            setTimeout(() => navigate('/story-collection'), 1200);
        } catch (error) {
            console.error('故事整理失敗:', error);
        } finally {
            setIsSummarizing(false);
        }
    }, [messages, category, sessionId, navigate]);

    // ─── 儲存為草稿 ─────────────────────────────────────────────
    const handleSaveDraft = useCallback(async () => {
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length === 0) {
            showToast('還沒有任何對話可以儲存喔！', 'info');
            setShowMenu(false);
            return;
        }

        setShowMenu(false);
        try {
            // 將對話組合為暫時文本
            let draftContent = '【目前的對話紀錄】\n' + messages.map(m => `${m.role === 'user' ? '我' : '精靈'}: ${m.text}`).join('\n\n');
            const draftTitle = customTitle.trim() || `${getCategoryName(category)}的未完成聊天`;
            await saveCompletedStory({
                id: sessionId,
                title: draftTitle,
                content: draftContent,
                category,
                status: 'draft',
                occurred_at: occurredAt ? `${occurredAt}T00:00:00.000Z` : new Date().toISOString(),
                messageCount: messages.length,
                is_ai_generated: true
            });
            successFeedback();
            setShowSuccessGlow(true);
            setTimeout(() => navigate('/'), 1200);
        } catch (error) {
            console.error('儲存草稿失敗:', error);
        }
    }, [messages, category, sessionId, navigate]);

    // ─── 鍵盤事件 ─────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ─── 對話輪數提示 ─────────────────────────────────────────
    const userMsgCount = messages.filter(m => m.role === 'user').length;

    // ✅ 免費版封鎖：非 Pro 會員顯示升級提示
    if (!isPro) {
        return (
            <WeavingLayout showNav={false}>
                <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-base font-bold font-display">溫柔採訪者</h1>
                    <div className="w-10" />
                </header>
                <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
                    <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-primary text-4xl">lock</span>
                    </div>
                    <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 text-center">情緒引導對話僅限 VIP</h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mb-2 leading-relaxed px-4">
                        基本版 AI 無法準確辨識情緒，可能無法提供良好的對話體驗。
                    </p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mb-8 leading-relaxed px-4">
                        升級 VIP 即可解鎖完整的情緒引導對話功能，讓 AI 根據你的心情給予更溫暖的回應。
                    </p>
                    <button 
                        onClick={() => navigate('/support-pro')}
                        className="w-full max-w-xs py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all mb-4"
                    >
                        <span className="material-symbols-outlined text-sm">diamond</span>
                        升級 VIP 解鎖
                    </button>
                    <button 
                        onClick={() => navigate('/story-write')}
                        className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        或用「自由書寫」模式記錄故事
                    </button>
                </main>
            </WeavingLayout>
        );
    }

    return (
        <WeavingLayout showNav={false}>
            {/* 🌈 情緒光暈背景層 — 根據 AI 情緒緩慢漸變 */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background: `radial-gradient(ellipse at 50% 30%, ${getEmotionStyle(currentEmotion).glowColor}22 0%, transparent 70%)`,
                    transition: 'background 2.5s ease',
                }}
            />
            {/* Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-base font-bold font-display">溫柔採訪者</h1>
                    <p className="text-xs text-primary font-medium flex items-center justify-center gap-1">
                        {isAIConfigured ? (
                            <><span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />AI 引導中</>
                        ) : (
                            <><span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />離線模式</>
                        )}
                    </p>
                </div>
                <div className="relative">
                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className="absolute right-0 top-12 bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-primary/10 py-1 min-w-[200px] z-50">
                            <div className="px-4 py-2 border-b border-primary/5 mb-1">
                                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1 block">故事標題（選填）</span>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={e => setCustomTitle(e.target.value)}
                                    placeholder={`${getCategoryName(category)}的回憶`}
                                    className="w-full text-sm font-medium bg-black/5 dark:bg-white/5 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary/40"
                                />
                            </div>
                            <div className="px-4 py-2 border-b border-primary/5 mb-1">
                                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1 block">故事發生於</span>
                                <input 
                                    type="date"
                                    value={occurredAt}
                                    onChange={e => setOccurredAt(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full text-sm font-medium bg-black/5 dark:bg-white/5 rounded px-2 py-1 outline-none text-primary cursor-pointer"
                                />
                            </div>
                            <button onClick={handleComplete} className="w-full px-4 py-2.5 text-sm text-left hover:bg-primary/5 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">auto_stories</span>
                                完成並織成故事
                            </button>
                            <button onClick={handleSaveDraft} className="w-full px-4 py-2.5 text-sm text-left hover:bg-primary/5 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-text-secondary-light dark:text-text-secondary-dark">save</span>
                                先儲存為草稿
                            </button>
                            <button onClick={() => { setMessages([{ role: 'ai', text: getInitialGreeting(category), time: now() }]); setShowMenu(false); }} className="w-full px-4 py-2.5 text-sm text-left hover:bg-primary/5 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-text-secondary-light dark:text-text-secondary-dark">refresh</span>
                                重新開始
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Chat Messages */}
            <main className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-40 space-y-4" onClick={() => showMenu && setShowMenu(false)}>
                {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                ))}

                {/* AI 思考中動畫 */}
                {isThinking && <ThinkingIndicator />}

                {/* 摘要產生中 */}
                {isSummarizing && (
                    <div className="flex justify-center py-4">
                        <div className="bg-primary/10 text-primary text-sm px-4 py-2 rounded-full flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            正在織出你的故事...
                        </div>
                    </div>
                )}

                {/* 對話進度提示 */}
                {userMsgCount === 4 && !isThinking && (
                    <div className="flex justify-center py-2">
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-surface-dark px-3 py-1 rounded-full">
                            再聊幾句就可以完成故事了
                        </span>
                    </div>
                )}

                <div ref={chatEndRef} />
            </main>

            {/* Input Bar */}
            <div className="sticky bottom-0 z-50 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-primary/10 p-3 pb-6">
                {/* 完成按鈕 (對話 6 輪以上顯示) */}
                {userMsgCount >= 5 && !isSummarizing && (
                    <button
                        onClick={handleComplete}
                        className="w-full mb-2 py-2 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/15 transition-colors flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">auto_stories</span>
                        織成故事
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors shrink-0">
                        <span className="material-symbols-outlined">mic</span>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isThinking ? '等待回應中...' : '輸入你的回憶...'}
                        disabled={isThinking || isSummarizing}
                        className="flex-1 bg-white dark:bg-surface-dark text-gray-900 dark:text-gray-100 rounded-full px-4 py-2.5 text-sm border border-primary/10 focus:border-primary/30 focus:outline-none transition-colors disabled:opacity-50 placeholder:text-gray-400"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking || isSummarizing}
                        className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:scale-95 shrink-0"
                    >
                        <span className="material-symbols-outlined text-sm">send</span>
                    </button>
                </div>
            </div>

            {/* 保存成功光暈特效 */}
            {showSuccessGlow && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                    <div className="relative w-40 h-40 bg-white dark:bg-surface-dark rounded-full shadow-[0_0_100px_rgba(244,192,37,1)] flex flex-col items-center justify-center animate-in zoom-in spin-in-12 duration-500">
                        <span className="material-symbols-outlined text-5xl text-primary animate-pulse mb-1">auto_awesome</span>
                        <span className="text-primary font-bold text-sm tracking-widest">保存成功</span>
                    </div>
                </div>
            )}
        </WeavingLayout>
    );
};

// ─── 訊息氣泡元件 ──────────────────────────────────────────
const MessageBubble = React.memo(({ message }) => {
    const { role, text, time } = message;

    if (role === 'system') {
        return (
            <div className="flex justify-center py-2">
                <div className="bg-success/10 text-success text-sm px-4 py-2 rounded-full flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {text}
                </div>
            </div>
        );
    }

    const isUser = role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                </div>
            )}
            <div className="max-w-[80%]">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-bl-md shadow-sm'
                    }`}>
                    {text}
                </div>
                {time && (
                    <p className={`text-[10px] mt-1 text-text-secondary-light/50 dark:text-text-secondary-dark/50 ${isUser ? 'text-right' : 'text-left ml-1'}`}>
                        {formatTime(time)}
                    </p>
                )}
            </div>
        </div>
    );
});
MessageBubble.displayName = 'MessageBubble';

// ─── AI 思考動畫 ────────────────────────────────────────────
const ThinkingIndicator = () => (
    <div className="flex justify-start animate-in fade-in duration-300">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-1 shrink-0">
            <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
            <div className="flex gap-1.5 items-center h-5">
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </div>
);

// ─── 工具函數 ───────────────────────────────────────────────
function now() {
    return new Date().toISOString();
}

function formatTime(isoString) {
    try {
        const d = new Date(isoString);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
        return '';
    }
}

function getCategoryName(category) {
    const names = { family: '家人', friends: '朋友', work: '職場', pets: '毛孩', self: '自己' };
    return names[category] || '生活';
}

export default StoryMode;
