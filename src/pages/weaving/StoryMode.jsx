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
} from '../../services/weavingAI';

/**
 * 🌟 故事模式：溫柔採訪者
 * AI 引導使用者回憶並記錄珍貴的生命故事
 */
const StoryMode = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category') || 'default';
    const sessionId = searchParams.get('session') || `session_${Date.now()}`;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

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
            setMessages(prev => [...prev, { role: 'ai', text: aiResponse, time: now() }]);
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
            saveCompletedStory({
                title: `${getCategoryName(category)}的回憶`,
                content: story,
                category,
                messageCount: messages.length,
            });

            setMessages(prev => [...prev, {
                role: 'system',
                text: '故事已成功織好並儲存了！',
                time: now(),
            }]);
            successFeedback();

            // 2 秒後導航到故事集
            setTimeout(() => navigate('/story-collection'), 2000);
        } catch (error) {
            console.error('故事整理失敗:', error);
        } finally {
            setIsSummarizing(false);
        }
    }, [messages, category, navigate]);

    // ─── 鍵盤事件 ─────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ─── 對話輪數提示 ─────────────────────────────────────────
    const userMsgCount = messages.filter(m => m.role === 'user').length;

    return (
        <WeavingLayout showNav={false}>
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
                        <div className="absolute right-0 top-12 bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-primary/10 py-1 min-w-[160px] z-50">
                            <button onClick={handleComplete} className="w-full px-4 py-2.5 text-sm text-left hover:bg-primary/5 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">auto_stories</span>
                                完成並織成故事
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
