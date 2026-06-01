import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saveLineId, getLineId } from '../../services/dbService';
import { successFeedback, tapFeedback } from '../../services/hapticService';

/**
 * 📲 LINE 帳號綁定頁面
 * 讓家屬子女輸入或掃描 LINE ID，綁定後每當長輩完成新故事
 * 即可收到 LINE 推播通知，帶上故事亮點摘要。
 */
const LineBind = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user, isAuthenticated } = useAuth();
    const [lineId, setLineId] = useState('');
    const [savedLineId, setSavedLineId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // 載入已綁定的 LINE ID
    useEffect(() => {
        if (!isAuthenticated) return;
        getLineId().then(id => {
            if (id) {
                setSavedLineId(id);
                setLineId(id);
            }
        }).catch(() => {});
    }, [isAuthenticated]);

    const handleSave = useCallback(async () => {
        const trimmed = lineId.trim();
        if (!trimmed) {
            showToast('請輸入您的 LINE ID', 'warning');
            return;
        }
        if (!isAuthenticated) {
            showToast('請先登入才能綁定 LINE', 'warning');
            navigate('/login');
            return;
        }

        setIsSaving(true);
        tapFeedback();
        try {
            await saveLineId(trimmed);
            setSavedLineId(trimmed);
            successFeedback();
            showToast('LINE 綁定成功！長輩完成故事後您會收到通知 🎉', 'success');
        } catch (err) {
            console.error('LINE ID 儲存失敗:', err);
            showToast('儲存失敗，請稍後重試。', 'error');
        } finally {
            setIsSaving(false);
        }
    }, [lineId, isAuthenticated, navigate, showToast]);

    const handleUnbind = useCallback(async () => {
        setIsSaving(true);
        try {
            await saveLineId('');
            setSavedLineId(null);
            setLineId('');
            showToast('已解除 LINE 綁定', 'info');
        } catch {
            showToast('解除失敗，請稍後重試。', 'error');
        } finally {
            setIsSaving(false);
        }
    }, [showToast]);

    const STEPS = [
        { icon: 'person', title: '取得您的 LINE ID', desc: '打開 LINE App → 個人資料 → 往下找到「LINE ID」欄位（英數字組合）' },
        { icon: 'edit', title: '填入下方輸入框', desc: '將 LINE ID 複製並貼到下方輸入框中，點擊「儲存綁定」' },
        { icon: 'notifications_active', title: '自動收到通知', desc: '當長輩完成一篇新故事，您將透過 LINE 收到溫馨的故事亮點摘要' },
    ];

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-base font-bold font-display">LINE 推播綁定</h1>
                <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-primary">help_outline</span>
                </button>
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24 pt-6 overflow-y-auto">

                {/* Hero 區塊 */}
                <div className="text-center mb-8">
                    <div className="relative mx-auto mb-5 w-24 h-24">
                        {/* 光暈 */}
                        <div className="absolute inset-0 rounded-full bg-green-400/20 blur-xl animate-pulse" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
                            <span className="text-white text-4xl font-black select-none">L</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold mb-2">綁定 LINE，不錯過任何故事</h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed px-4">
                        每當長輩完成一篇新故事，您的 LINE 就會收到溫暖的通知，帶上故事亮點摘要。
                    </p>
                </div>

                {/* 已綁定狀態卡片 */}
                {savedLineId && (
                    <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">已成功綁定 LINE</p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">ID：{savedLineId}</p>
                        </div>
                        <button
                            onClick={handleUnbind}
                            disabled={isSaving}
                            className="text-xs text-text-secondary-light dark:text-text-secondary-dark hover:text-danger transition-colors shrink-0"
                        >
                            解除
                        </button>
                    </div>
                )}

                {/* 步驟說明（可展開） */}
                {showGuide && (
                    <div className="mb-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark px-1">設定步驟</h3>
                        {STEPS.map((step, i) => (
                            <div key={i} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 flex gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary text-base">{step.icon}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold mb-0.5">{i + 1}. {step.title}</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* LINE ID 輸入區 */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark px-1 mb-2">您的 LINE ID</h3>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
                        <div className="px-4 pt-4 pb-2">
                            <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1.5 block">
                                請輸入您的 LINE ID（非手機號碼）
                            </label>
                            <input
                                id="line-id-input"
                                type="text"
                                value={lineId}
                                onChange={e => setLineId(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                placeholder="例：your.lineid"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-text-secondary-light/40 dark:placeholder:text-text-secondary-dark/40"
                            />
                        </div>
                        <div className="px-4 pb-4">
                            <p className="text-[10px] text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                                LINE ID 可在 LINE App → 我的頁面 → 個人資料中找到，格式為英文字母與數字的組合。
                            </p>
                        </div>
                    </div>
                </div>

                {/* 儲存按鈕 */}
                <button
                    id="line-save-btn"
                    onClick={handleSave}
                    disabled={isSaving || !lineId.trim() || lineId.trim() === savedLineId}
                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 mb-4"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                    )}
                    {isSaving ? '儲存中...' : (savedLineId ? '更新綁定' : '儲存綁定')}
                </button>

                {/* 說明卡 */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                    <div className="flex gap-2 items-start">
                        <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">shield</span>
                        <div>
                            <p className="text-xs font-bold text-primary mb-1">隱私說明</p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                                您的 LINE ID 只會用於傳送故事推播通知，不會洩露給第三方，您可隨時解除綁定。
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </WeavingLayout>
    );
};

export default LineBind;
