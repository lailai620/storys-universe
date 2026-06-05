import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { useAuth } from '../../context/AuthContext';
import { warningFeedback, errorFeedback } from '../../services/hapticService';
import { getStats } from '../../services/dbService';
import { exportAllData } from '../../services/exportService';
import { getItemSync } from '../../services/storageService';
import GoogleDriveBackupCard from '../../components/weaving/GoogleDriveBackupCard';
import { getNickname, setNickname } from '../../services/weavingAI';
/** ⚙ 織光設定頁面 */
const WeavingSettings = () => {
    const navigate = useNavigate();
    const { user, displayName, isAuthenticated, signOut, signInWithGoogle } = useAuth();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    // 統計資料（非同步載入）
    const [storyCount, setStoryCount] = useState(0);
    const [voiceCount, setVoiceCount] = useState(0);
    const [sessionCount] = useState(0);
    const isPro = getItemSync('weaving_pro_waitlist') === 'true';

    // 暱稱設定
    const [nicknameInput, setNicknameInput] = useState(getNickname());
    const [nicknameSaved, setNicknameSaved] = useState(false);

    const handleSaveNickname = useCallback(() => {
        setNickname(nicknameInput);
        setNicknameSaved(true);
        setTimeout(() => setNicknameSaved(false), 2000);
    }, [nicknameInput]);

    useEffect(() => {
        getStats().then(s => {
            setStoryCount(s.storyCount);
            setVoiceCount(s.voiceCount);
        }).catch(() => {});
    }, []);

    const handleExportData = useCallback(async () => {
        if (isExporting) return;
        setIsExporting(true);
        setExportProgress(0);
        try {
            await exportAllData((p) => setExportProgress(p));
        } catch (err) {
            console.error('匯出失敗:', err);
        } finally {
            setTimeout(() => { setIsExporting(false); setExportProgress(0); }, 1500);
        }
    }, [isExporting]);

    const CONFIRM_PHRASE = '刪除所有故事';

    const handleDeleteAllData = useCallback(() => {
        if (confirmText !== CONFIRM_PHRASE) return;
        warningFeedback();
        // 清除所有織光資料
        const keysToRemove = [
            'weaving_stories', 'weaving_chat_sessions', 'weaving_voice_messages',
            'weaving_light_sources', 'weaving_memories', 'weaving_pro', 'weaving_pro_waitlist',
            'weaving_onboarding_done', 'weave_book_title', 'family_members',
            'weaving_book_customize', 'weaving_photos',
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        setShowDeleteConfirm(false);
        setConfirmText('');
        navigate('/', { replace: true });
        window.location.reload();
    }, [confirmText, navigate]);

    const handleResetOnboarding = useCallback(() => {
        localStorage.removeItem('weaving_onboarding_done');
        navigate('/onboarding', { replace: true });
    }, [navigate]);

    const SECTIONS = [
        {
            title: '帳號',
            items: [
                ...(isAuthenticated ? [
                    { icon: 'person', label: displayName || '織光使用者', desc: user?.email || '已登入', action: () => navigate('/profile') },
                ] : [
                    { icon: 'login', label: '登入帳號', desc: '登入以同步和保護你的資料', action: () => navigate('/login'), badge: '建議' },
                ]),
                { icon: 'diamond', label: '織光 Pro', desc: isPro ? '已加入等候名單' : '解鎖進階功能', action: () => navigate('/support-pro'), badge: isPro ? '等候中' : null },
                { icon: 'chat_bubble', label: 'LINE 推播通知', desc: '綁定 LINE，家人完成新故事時自動通知', action: () => navigate('/line-bind') },
            ],
        },
        {
            title: '內容管理',
            items: [
                { icon: 'auto_stories', label: '我的故事', desc: `${storyCount} 篇故事`, action: () => navigate('/story-collection') },
                { icon: 'mic', label: '語音訊息', desc: `${voiceCount} 段悄悄話`, action: () => navigate('/voice-whisper') },
                { icon: 'group', label: '夥伴管理', desc: '管理協作夥伴', action: () => navigate('/invite-family') },
            ],
        },
        {
            title: '資料與備份',
            items: [
                { icon: 'package_2', label: '📦 匯出所有回憶', desc: isExporting ? `匯出中 ${exportProgress}%...` : '打包 ZIP 時光膠囊下載', action: handleExportData, badge: isExporting ? '處理中' : null },
                { icon: 'replay', label: '重新觀看引導', desc: '重新體驗新手教學', action: handleResetOnboarding },
            ],
        },
        {
            title: '法律與支援',
            items: [
                { icon: 'shield', label: '隱私權政策', desc: '了解我們如何保護你的資料', action: () => navigate('/privacy') },
                { icon: 'gavel', label: '使用條款', desc: '服務使用規範', action: () => navigate('/terms') },
                { icon: 'share', label: '分享織光', desc: '讓更多人看見這道光', action: () => navigate('/share') },
            ],
        },
    ];

    return (
        <WeavingLayout>
            <header className="relative z-10 px-6 pt-12 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">設定</h1>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    管理你的織光體驗
                </p>
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24 overflow-y-auto space-y-6">
                {/* 使用者摘要卡片 */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    {isAuthenticated && user?.user_metadata?.avatar_url ? (
                        <div className="w-14 h-14 rounded-full bg-cover bg-center border-2 border-primary/20 shrink-0" style={{ backgroundImage: `url('${user.user_metadata.avatar_url}')` }} />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-2xl">person</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-lg">{isAuthenticated ? displayName : '織光使用者'}</h2>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {storyCount + sessionCount} 篇故事 · {voiceCount} 段語音
                        </p>
                    </div>
                    {isPro && (
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                            Pro 等候中
                        </span>
                    )}
                </div>

                {/* ✨ 暱稱設定卡片 */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
                        <div>
                            <p className="font-semibold text-sm">AI 叫我的名字</p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                設定後，織光在聊天時會這樣稱呼你
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            id="nickname-input"
                            type="text"
                            value={nicknameInput}
                            onChange={(e) => setNicknameInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                            placeholder="例如：小明、阿姨、Jason..."
                            maxLength={10}
                            className="flex-1 px-4 py-2.5 bg-background-light dark:bg-background-dark border border-primary/15 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-secondary-light/50"
                        />
                        <button
                            id="nickname-save-btn"
                            onClick={handleSaveNickname}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                                nicknameSaved
                                    ? 'bg-green-500 text-white'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                        >
                            {nicknameSaved ? (
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">check</span>
                                    已儲存
                                </span>
                            ) : '儲存'}
                        </button>
                    </div>
                    {getNickname() && (
                        <p className="text-xs text-primary/70 mt-2 pl-1">
                            目前：織光會叫你「{getNickname()}」
                        </p>
                    )}
                </div>

                {/* 設定區塊 */}
                {SECTIONS.map(section => (
                    <div key={section.title}>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark px-1 mb-2">
                            {section.title}
                        </h3>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
                            {section.items.map((item, i) => (
                                <button
                                    key={item.label}
                                    onClick={item.action}
                                    className={`w-full px-4 py-3.5 flex items-center gap-3 hover:bg-primary/5 active:scale-[0.99] transition-all text-left ${i > 0 ? 'border-t border-primary/5' : ''}`}
                                >
                                    <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{item.label}</p>
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{item.desc}</p>
                                    </div>
                                    {item.badge && (
                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                                    )}
                                    <span className="material-symbols-outlined text-sm text-text-secondary-light dark:text-text-secondary-dark">arrow_forward_ios</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* 雲端備份卡片 */}
                {isAuthenticated && (
                    <div className="mb-6">
                        <GoogleDriveBackupCard />
                    </div>
                )}

                {/* 危險區域 */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-danger px-1 mb-2">
                        危險區域
                    </h3>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-danger/5 active:scale-[0.99] transition-all text-left"
                        >
                            <span className="material-symbols-outlined text-danger text-xl">delete_forever</span>
                            <div className="flex-1">
                                <p className="font-medium text-sm text-danger">清除所有資料</p>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">永久刪除所有故事、語音和設定</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* 登出按鈕 */}
                {isAuthenticated && (
                    <div>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
                            <button
                                onClick={async () => { await signOut(); navigate('/', { replace: true }); }}
                                className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-primary/5 active:scale-[0.99] transition-all text-left"
                            >
                                <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-xl">logout</span>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">登出帳號</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">登出後資料仍保留在本裝置</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* 版本資訊 */}
                <div className="text-center pt-4 pb-8">
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        織光 WeavingLight v3.1
                    </p>
                    <p className="text-[10px] text-text-secondary-light/60 dark:text-text-secondary-dark/60 mt-1">
                        用溫暖的方式記錄生命中珍貴的故事
                    </p>
                </div>
            </main>

            {/* 刪除確認對話框（輸入確認文字才能刪除） */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-danger text-3xl">warning</span>
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">確定要刪除所有資料？</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mb-4">
                            這個操作無法復原。你的所有故事、語音和設定都會被永久刪除。
                        </p>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mb-2">
                            請輸入 <strong className="text-danger font-bold">{CONFIRM_PHRASE}</strong> 以確認刪除：
                        </p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={CONFIRM_PHRASE}
                            className="w-full px-4 py-3 border-2 border-danger/20 rounded-xl text-sm text-center focus:border-danger focus:outline-none bg-background-light dark:bg-background-dark transition-colors mb-4"
                            autoFocus
                        />
                        <div className="space-y-2">
                            <button
                                onClick={handleDeleteAllData}
                                disabled={confirmText !== CONFIRM_PHRASE}
                                className={`w-full py-3 font-bold rounded-xl transition-all active:scale-[0.98] ${confirmText === CONFIRM_PHRASE
                                        ? 'bg-danger text-white shadow-lg shadow-danger/30'
                                        : 'bg-danger/10 text-danger/40 cursor-not-allowed'
                                    }`}
                            >
                                永久刪除所有資料
                            </button>
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
                                className="w-full py-3 bg-background-light dark:bg-background-dark font-medium rounded-xl text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/5 transition-all"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </WeavingLayout>
    );
};

export default WeavingSettings;
