import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';

/**
 * 💌 GuestComment.jsx — 訪客便利貼留言頁
 * 親友透過分享連結進入：/#/comment?story=<id>
 * 不需要登入，只要輸入稱謂 + 留言即可送出
 */

function getStoryById(storyId) {
    const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
    return stories.find(s => s.id === storyId) || null;
}

function saveGuestComment(storyId, nickname, content) {
    const all = JSON.parse(localStorage.getItem('weaving_comments') || '[]');
    const newCmt = {
        id: `cmt_${Date.now()}`,
        storyId,
        nickname: nickname.trim(),
        content: content.trim(),
        hidden: false,
        createdAt: new Date().toISOString(),
    };
    all.unshift(newCmt);
    localStorage.setItem('weaving_comments', JSON.stringify(all));
    return newCmt;
}

const GuestComment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const storyId = params.get('story');

    const [story, setStory] = useState(null);
    const [nickname, setNickname] = useState('');
    const [content, setContent] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (storyId) {
            const found = getStoryById(storyId);
            setStory(found);
        }
    }, [storyId]);

    const handleSubmit = () => {
        if (!nickname.trim()) { setError('請填寫你的稱謂'); return; }
        if (!content.trim()) { setError('請寫點什麼再送出吧 ✏️'); return; }
        setError('');
        saveGuestComment(storyId, nickname, content);
        setSubmitted(true);
    };

    // 無效的 story id
    if (!storyId) {
        return (
            <WeavingLayout showNav={false}>
                <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-8 text-center">
                    <span className="text-6xl">🔗</span>
                    <h1 className="text-xl font-bold">連結好像有點問題</h1>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        請確認你的連結是完整的，或請對方重新傳送邀請給你。
                    </p>
                    <button onClick={() => navigate('/')} className="mt-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold">
                        回到首頁
                    </button>
                </div>
            </WeavingLayout>
        );
    }

    // 送出成功畫面
    if (submitted) {
        return (
            <WeavingLayout showNav={false}>
                <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-8 text-center">
                    <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-5xl animate-in zoom-in duration-500">
                        📝
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold mb-2">便利貼貼好了！</h1>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                            謝謝 <strong className="text-primary">{nickname}</strong> 的溫暖補充，<br />
                            這段記憶因為你變得更完整了 🌟
                        </p>
                    </div>

                    {/* 預覽便利貼 */}
                    <div
                        className="w-full max-w-xs rounded-2xl p-5 text-left shadow-lg mx-auto"
                        style={{
                            backgroundColor: '#FFF9C4',
                            border: '1.5px solid #F9D835',
                            transform: 'rotate(-1deg)',
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-sm">🙂</div>
                            <span className="text-[12px] font-bold text-yellow-800">{nickname} 補充</span>
                        </div>
                        <p className="text-[13px] text-yellow-900 leading-relaxed line-clamp-4">{content}</p>
                    </div>

                    <p className="text-[11px] text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                        你的便利貼已經貼在 TA 的故事上了
                    </p>
                </div>
            </WeavingLayout>
        );
    }

    return (
        <WeavingLayout showNav={false}>
            {/* 頂部欄 */}
            <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-primary/5">
                <div className="flex items-center gap-3 px-4 pt-12 pb-3">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-[15px] font-bold leading-tight">留下你的便利貼</h1>
                        <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">補充你的回憶與感受</p>
                    </div>
                </div>
            </header>

            <main className="px-5 pt-28 pb-10">
                {/* 故事預覽卡 */}
                {story && (
                    <div className="bg-white/80 dark:bg-surface-dark/80 rounded-2xl p-4 border border-black/[0.06] dark:border-white/10 shadow-sm mb-6">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">auto_stories</span>
                            <div>
                                <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mb-0.5">你要補充的故事</p>
                                <h2 className="text-[15px] font-bold text-text-primary-light dark:text-text-primary-dark">{story.title}</h2>
                                {story.content && (
                                    <p className="text-[12px] text-text-secondary-light dark:text-text-secondary-dark mt-1 line-clamp-2">
                                        {story.content}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 輸入區 */}
                <div className="space-y-4">
                    <div>
                        <label className="text-[12px] font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1.5 block">
                            你的稱謂 <span className="text-danger">*</span>
                        </label>
                        <input
                            id="guest-nickname"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            placeholder="例如：孫女小美、老二、鄰居阿姨"
                            maxLength={20}
                            className="w-full text-sm px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 outline-none focus:border-primary/60 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1.5 block">
                            你的回憶或感受 <span className="text-danger">*</span>
                        </label>
                        <textarea
                            id="guest-content"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="我記得那天… / 原來背後有這段故事！/ 這讓我想到…"
                            maxLength={300}
                            rows={5}
                            className="w-full text-sm px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 outline-none focus:border-primary/60 transition-colors resize-none"
                        />
                        <p className="text-[10px] text-right text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-1">
                            {content.length}/300
                        </p>
                    </div>

                    {error && (
                        <p className="text-[12px] text-danger flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            {error}
                        </p>
                    )}

                    <button
                        id="guest-submit"
                        onClick={handleSubmit}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-[15px] shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        <span className="material-symbols-outlined">sticky_note_2</span>
                        貼上便利貼
                    </button>

                    <p className="text-[10px] text-center text-text-secondary-light/50 dark:text-text-secondary-dark/50">
                        你的名字（稱謂）會顯示在故事主角的便利貼上，共同記錄這段回憶 🌟
                    </p>
                </div>
            </main>
        </WeavingLayout>
    );
};

export default GuestComment;
