import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    getHumeAccessToken,
    triggerLinePush,
    saveMemoryFromConversation,
} from '../../services/weavingAI';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { HumeVoiceWidget } from '../../components/weaving/HumeVoiceWidget';

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
    const [occurredAt, setOccurredAt] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false); // 預設折疊日期欄
    const [showSuccessGlow, setShowSuccessGlow] = useState(false);
    // 情緒引擎：接收 AI 回傳的 emotion tag
    const [currentEmotion, setCurrentEmotion] = useState('calm');
    // 使用者自訂的故事標題
    const [customTitle, setCustomTitle] = useState('');

    // 語音通話模式
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [humeAuth, setHumeAuth] = useState(null);

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // ─── 計算使用者訊息數量（Freemium 計數用）────────────────
    const userMsgCount = useMemo(() =>
        messages.filter(m => m.role === 'user').length,
        [messages]
    );
    const initializedRef = useRef(false);

    // ─── 初始化對話 ───────────────────────────────────────────
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        // 嘗試載入既存對話（非同步）
        const init = async () => {
            const saved = await loadSession(sessionId);
            if (saved && saved.messages.length > 0) {
                setMessages(saved.messages);
                return;
            }
            // 新對話：顯示開場白
            const greeting = getInitialGreeting(category);
            setMessages([{ role: 'ai', text: greeting, time: now() }]);
        };
        init();
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

    // ─── 啟動語音通話 ─────────────────────────────────────────
    const handleStartVoice = async () => {
        if (!isAIConfigured) {
            showToast('尚未設定 AI，無法使用語音功能。', 'warning');
            return;
        }
        
        try {
            // 獲取臨時 token 與 config ID
            const { accessToken, configId } = await getHumeAccessToken();
            setHumeAuth({ accessToken, configId });
            setIsVoiceMode(true);
        } catch (error) {
            console.error('啟動語音失敗:', error);
            showToast('語音連線失敗，請檢查網路狀態。', 'error');
        }
    };

    // ─── 處理語音通話中的同步訊息 ─────────────────────────────
    const handleVoiceMessage = useCallback((msg) => {
        setMessages(prev => {
            // 透過 id 判斷是新增還是更新（支援串流文字）
            const existingIndex = prev.findIndex(m => m.id === msg.id);
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], text: msg.text };
                return updated;
            } else {
                return [...prev, { id: msg.id, role: msg.role, text: msg.text, time: now() }];
            }
        });
    }, []);

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

            // 觸發 LINE 推播給家族成員
            if (user?.id) {
                triggerLinePush(sessionId, user.id);
            }

            // 將完整對話內容丟給背景處理，萃取長期記憶向量
            const conversationText = messages.map(m => `${m.role === 'user' ? '我' : '精靈'}: ${m.text}`).join('\n');
            saveMemoryFromConversation(conversationText);

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
    const FREE_TRIAL_LIMIT = 3;
    const isTrialExhausted = !isPro && userMsgCount >= FREE_TRIAL_LIMIT;
                        <span className="material-symbols-outlined text-sm">edit</span>

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

            {/* Freemium 底部橫幅（不取代整頁） */}
            {isTrialExhausted && (
                <div className="sticky bottom-0 z-50 bg-surface-light/98 dark:bg-surface-dark/98 backdrop-blur-xl border-t border-primary/20 p-4 pb-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-lg">diamond</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">對話次數已用完</p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">升級 Pro 繼續對話，或改用自由書寫模式</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/support-pro')}
                            className="flex-1 py-2.5 bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-bold text-sm rounded-xl shadow-md shadow-primary/25 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">diamond</span>
                            升級 Pro
                        </button>
                        <button
                            onClick={() => navigate('/story-write')}
                            className="px-4 py-2.5 bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium rounded-xl border border-primary/10 active:scale-[0.98] transition-all"
                        >
                            自由書寫
                        </button>
                    </div>
                </div>
            )}

            {/* Input Bar */}
            {!isTrialExhausted && (
            <div className="sticky bottom-0 z-50 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-primary/10 p-3 pb-6">
                {/* 折疊式日期欄 */}
                {showDatePicker && (
                    <div className="flex items-center gap-2 mb-2 px-1 animate-in slide-in-from-top-2 duration-200">
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark shrink-0">故事發生於</span>
                        <input
                            type="date"
                            value={occurredAt}
                            onChange={e => setOccurredAt(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="flex-1 text-xs font-medium text-primary bg-primary/8 dark:bg-primary/10 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
                        />
                        {occurredAt && (
                            <button onClick={() => { setOccurredAt(''); setShowDatePicker(false); }} className="text-text-secondary-light/60 dark:text-text-secondary-dark/60 shrink-0">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        )}
                    </div>
                )}

                {/* 完成按鈕 (對話 ≥ 5 輪顯示，改為明顯漸層樣式) */}
                {userMsgCount >= 5 && !isSummarizing && (
                    <button
                        onClick={handleComplete}
                        className="w-full mb-2 py-2.5 text-sm font-bold bg-gradient-to-r from-primary to-amber-500 text-primary-foreground rounded-xl shadow-md shadow-primary/30 flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all animate-in fade-in duration-500"
                    >
                        <span className="material-symbols-outlined text-sm">auto_stories</span>
                        把這段對話織成故事
                    </button>
                )}
                <div className="flex items-center gap-2">
                    {/* 日曆折疊按鈕 */}
                    <button
                        onClick={() => setShowDatePicker(v => !v)}
                        className={`p-2 rounded-full transition-colors shrink-0 ${showDatePicker || occurredAt ? 'text-primary bg-primary/10' : 'text-text-secondary-light/50 dark:text-text-secondary-dark/50 hover:bg-primary/5'}`}
                        title={occurredAt ? `故事日期：${occurredAt}` : '設定故事日期（選填）'}
                    >
                        <span className="material-symbols-outlined text-[18px]">{occurredAt ? 'event_available' : 'calendar_today'}</span>
                    </button>
                    <button 
                        onClick={handleStartVoice}
                        className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors shrink-0"
                    >
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
            )}

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

            {/* Hume 語音通話全螢幕覆蓋 */}
            {isVoiceMode && humeAuth && (
                <HumeVoiceWidget 
                    accessToken={humeAuth.accessToken}
                    configId={humeAuth.configId}
                    onMessageReceived={handleVoiceMessage}
                    onClose={() => setIsVoiceMode(false)}
                />
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
