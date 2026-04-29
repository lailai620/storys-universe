import React, { useState, useEffect, useRef } from 'react';

// 便利貼顏色 — 依稱謂 hash 自動分配
const STICKY_PALETTES = [
    { bg: '#FFF9C4', border: '#F9D835', text: '#5D4037', shadow: 'rgba(249,216,53,0.25)' },
    { bg: '#FFE0B2', border: '#FFB74D', text: '#4E342E', shadow: 'rgba(255,183,77,0.25)' },
    { bg: '#F8BBD0', border: '#F06292', text: '#880E4F', shadow: 'rgba(240,98,146,0.25)' },
    { bg: '#E1BEE7', border: '#CE93D8', text: '#4A148C', shadow: 'rgba(206,147,216,0.25)' },
    { bg: '#C8E6C9', border: '#81C784', text: '#1B5E20', shadow: 'rgba(129,199,132,0.25)' },
    { bg: '#B3E5FC', border: '#4FC3F7', text: '#01579B', shadow: 'rgba(79,195,247,0.25)' },
];

function hashNickname(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h) % STICKY_PALETTES.length;
}

// 稱謂對應 emoji
function getNicknameEmoji(nickname) {
    const map = [
        ['孫', '💛'], ['媳', '🌸'], ['女兒', '🌺'], ['兒子', '⭐'],
        ['孩子', '🌟'], ['兄', '🎯'], ['弟', '🎮'], ['姐', '💕'],
        ['妹', '🌈'], ['老公', '💑'], ['老婆', '💓'], ['朋友', '🤝'],
        ['同學', '📚'], ['同事', '☕'], ['鄰居', '🏠'],
    ];
    for (const [key, emoji] of map) {
        if (nickname.includes(key)) return emoji;
    }
    return '🙂';
}

import { getComments, saveComment, hideComment } from '../../services/dbService';

// 格式化日期
function formatRelativeDate(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// =========================================================
// 主元件
// =========================================================
const StoryComments = ({ storyId, isOwner = false }) => {
    const [comments, setComments] = useState([]);
    const [showInput, setShowInput] = useState(false);
    const [nickname, setNickname] = useState('');
    const [content, setContent] = useState('');
    const [pressedId, setPressedId] = useState(null);
    const [hideTarget, setHideTarget] = useState(null);
    const [copied, setCopied] = useState(false);
    const longPressTimer = useRef(null);
    const inputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchComments = async () => {
            setIsLoading(true);
            const data = await getComments(storyId);
            setComments(data);
            setIsLoading(false);
        };
        fetchComments();
    }, [storyId]);

    // 長按計時器
    const handlePointerDown = (commentId) => {
        if (!isOwner) return;
        longPressTimer.current = setTimeout(() => {
            setPressedId(commentId);
            setHideTarget(commentId);
        }, 600);
    };

    const handlePointerUp = () => {
        clearTimeout(longPressTimer.current);
    };

    const handleHide = async () => {
        if (!hideTarget) return;
        await hideComment(hideTarget);
        setComments(prev => prev.filter(c => c.id !== hideTarget));
        setHideTarget(null);
        setPressedId(null);
    };

    const handleSubmit = async () => {
        if (!nickname.trim() || !content.trim()) return;
        const newCmt = await saveComment(storyId, nickname, content);
        setComments(prev => [newCmt, ...prev]);
        setContent('');
        setNickname('');
        setShowInput(false);
    };

    // 邀請連結
    const handleCopyInviteLink = async () => {
        const url = `${window.location.origin}${window.location.pathname}#/comment?story=${storyId}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // fallback
            const el = document.createElement('textarea');
            el.value = url;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <section className="mt-8 mb-4">
            {/* 標題列 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">sticky_note_2</span>
                    <h2 className="text-[15px] font-bold text-text-primary-light dark:text-text-primary-dark">
                        親友補充
                    </h2>
                    {comments.length > 0 && (
                        <span className="text-[11px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                            {comments.length}
                        </span>
                    )}
                </div>

                {/* 邀請按鈕 */}
                {isOwner && (
                    <button
                        onClick={handleCopyInviteLink}
                        className="flex items-center gap-1.5 text-[12px] font-medium text-primary bg-primary/10 hover:bg-primary/20 active:scale-95 px-3 py-1.5 rounded-full transition-all"
                    >
                        <span className="material-symbols-outlined text-[14px]">
                            {copied ? 'check_circle' : 'share'}
                        </span>
                        {copied ? '已複製連結！' : '邀請親友補充'}
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-4"><span className="material-symbols-outlined animate-spin text-primary opacity-50">autorenew</span></div>
            ) : comments.length > 0 ? (
                <div className="flex flex-wrap gap-4 items-start">
                    {comments.map((cmt) => {
                        const palette = STICKY_PALETTES[hashNickname(cmt.nickname)];
                        const emoji = getNicknameEmoji(cmt.nickname);
                        const isPressed = pressedId === cmt.id;

                        return (
                            <div
                                key={cmt.id}
                                onPointerDown={() => handlePointerDown(cmt.id)}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerUp}
                                className={`relative rounded-2xl p-4 transition-all select-none w-[calc(50%-0.5rem)] min-w-[140px] shrink-0 ${isPressed ? 'scale-95 opacity-70' : 'hover:scale-[1.02]'}`}
                                style={{
                                    backgroundColor: palette.bg,
                                    border: `1.5px solid ${palette.border}`,
                                    boxShadow: `0 4px 16px ${palette.shadow}, 0 1px 4px rgba(0,0,0,0.06)`,
                                    transform: `rotate(${(hashNickname(cmt.nickname) % 5) - 2}deg)`,
                                    transformOrigin: 'center center',
                                }}
                            >
                                {/* 上方膠帶裝飾 */}
                                <div
                                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-5 rounded-sm opacity-60"
                                    style={{ backgroundColor: palette.border }}
                                />

                                {/* 作者列 */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                        style={{ backgroundColor: palette.border, color: palette.text }}
                                    >
                                        {emoji}
                                    </div>
                                    <span className="text-[12px] font-bold" style={{ color: palette.text }}>
                                        {cmt.nickname} 補充
                                    </span>
                                    <span className="ml-auto text-[10px] opacity-60" style={{ color: palette.text }}>
                                        {formatRelativeDate(cmt.createdAt || cmt.created_at)}
                                    </span>
                                </div>

                                {/* 內容 */}
                                <p className="text-[13px] leading-relaxed" style={{ color: palette.text }}>
                                    {cmt.content}
                                </p>

                                {/* 長按提示（主角限定） */}
                                {isOwner && (
                                    <p className="text-[9px] mt-2 opacity-40" style={{ color: palette.text }}>
                                        長按可隱藏此便利貼
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 opacity-60">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-[13px] text-text-secondary-light dark:text-text-secondary-dark">
                        還沒有親友留下便利貼
                    </p>
                    <p className="text-[11px] text-text-secondary-light/60 dark:text-text-secondary-dark/60 mt-1">
                        點擊上方「邀請親友補充」分享這篇故事
                    </p>
                </div>
            )}

            {/* 自己留便利貼（訪客） */}
            {!isOwner && (
                <div className="mt-6">
                    {!showInput ? (
                        <button
                            onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary/70 text-sm font-medium hover:border-primary/60 hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            貼上我的便利貼
                        </button>
                    ) : (
                        <div className="bg-white/80 dark:bg-surface-dark/80 rounded-2xl p-4 border border-primary/10 shadow-sm">
                            <p className="text-[12px] font-bold text-primary mb-3">✍️ 留下你的便利貼</p>
                            <input
                                ref={inputRef}
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                placeholder="你的稱謂（例如：孫女小美）"
                                maxLength={20}
                                className="w-full text-sm px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 mb-2 outline-none focus:border-primary/50 transition-colors"
                            />
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="你想補充的回憶或感受…"
                                maxLength={200}
                                rows={3}
                                className="w-full text-sm px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 mb-3 outline-none focus:border-primary/50 transition-colors resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowInput(false)}
                                    className="flex-1 py-2 rounded-xl text-sm text-text-secondary-light dark:text-text-secondary-dark bg-black/5 dark:bg-white/5 active:scale-[0.98] transition-all"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!nickname.trim() || !content.trim()}
                                    className="flex-1 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground disabled:opacity-40 active:scale-[0.98] transition-all shadow-sm shadow-primary/30"
                                >
                                    貼上便利貼 📌
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 長按隱藏確認彈窗 */}
            {hideTarget && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center px-4 pb-8 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 w-full max-w-sm shadow-2xl">
                        <p className="font-bold text-center mb-1">隱藏這張便利貼？</p>
                        <p className="text-[13px] text-center text-text-secondary-light dark:text-text-secondary-dark mb-5">
                            只有你看不到，不會通知對方
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setHideTarget(null); setPressedId(null); }}
                                className="flex-1 py-3 rounded-xl bg-black/5 dark:bg-white/10 text-sm font-medium active:scale-[0.98]"
                            >
                                算了保留
                            </button>
                            <button
                                onClick={handleHide}
                                className="flex-1 py-3 rounded-xl bg-danger/90 text-white text-sm font-bold active:scale-[0.98] shadow-sm"
                            >
                                隱藏
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default StoryComments;
