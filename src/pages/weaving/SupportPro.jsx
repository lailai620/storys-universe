import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { useAuth } from '../../context/AuthContext';
import { PLANS, FEATURE_COMPARISON, purchasePro, getSubscriptionStatus, restorePurchases } from '../../services/subscriptionService';
import { useToast } from '../../context/ToastContext';
import { hapticService } from '../../services/hapticService';

/** ⭐ 織光 Pro — 訂閱頁 */
const SupportPro = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [subStatus, setSubStatus] = useState(null);

    useEffect(() => {
        getSubscriptionStatus().then(setSubStatus);
    }, []);

    const planList = [
        PLANS.monthly,
        PLANS.yearly,
    ];

    const handlePurchase = useCallback(async () => {
        if (!isAuthenticated) {
            hapticService.warningFeedback();
            showToast('請先登入後再進行升級', 'info');
            navigate('/login');
            return;
        }

        setLoading(true);
        hapticService.tapFeedback();

        try {
            const plan = planList.find(p => p.id.includes(selectedPlan));
            if (!plan) return;

            const result = await purchasePro(plan.id);
            if (result.success) {
                hapticService.successFeedback();
                showToast('恭喜！您已成功升級為 織光 Pro ✨', 'success');
                setSubStatus({ isPro: true, plan: selectedPlan, expiresAt: result.expiresAt });
            } else if (result.cancelled) {
                // 用戶取消，不顯示錯誤
            }
        } catch (err) {
            console.error('購買失敗:', err);
            hapticService.errorFeedback();
            showToast(err.message || '購買流程發生錯誤，請稍後再試', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedPlan, isAuthenticated, navigate, planList, showToast]);

    const handleRestore = useCallback(async () => {
        setRestoring(true);
        hapticService.tapFeedback();

        try {
            const status = await restorePurchases();
            setSubStatus(status);
            if (status.isPro) {
                hapticService.successFeedback();
                showToast('已成功恢復您的訂閱權限！', 'success');
            } else {
                hapticService.warningFeedback();
                showToast('找不到可恢復的訂閱紀錄', 'info');
            }
        } catch (err) {
            console.error('恢復失敗:', err);
            hapticService.errorFeedback();
            showToast('恢復購買失敗，請確認您的商店帳號', 'error');
        } finally {
            setRestoring(false);
        }
    }, [showToast]);

    // 已是 Pro 使用者
    if (subStatus?.isPro) {
        return (
            <WeavingLayout showNav={false}>
                <header className="relative z-10 flex items-center justify-between px-4 py-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <h1 className="text-base font-bold font-display text-primary">織光 Pro</h1>
                    <div className="w-10" />
                </header>
                <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-4xl">verified</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-center">您已經是 Pro 會員！ ✨</h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mb-2">
                        {subStatus.plan === 'yearly' ? '年付方案' : '月付方案'}
                    </p>
                    {subStatus.expiresAt && (
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono bg-primary/5 px-2 py-1 rounded">
                            有效期限至：{new Date(subStatus.expiresAt).toLocaleDateString('zh-TW')}
                        </p>
                    )}
                    <button onClick={() => navigate(-1)} className="mt-8 px-10 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                        開始織造故事
                    </button>
                </main>
            </WeavingLayout>
        );
    }

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-base font-bold font-display text-primary">織光 Pro</h1>
                <div className="w-10" />
            </header>

            <main className="relative z-10 flex-1 px-6 pb-32 overflow-y-auto">
                {/* Logo */}
                <div className="text-center my-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">升級織光 Pro</h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">解鎖所有功能，讓回憶永恆</p>
                </div>

                {/* 方案選擇 — 三欄 */}
                <div className="space-y-3 mb-6">
                    {planList.map(plan => (
                        <button
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id.replace('weaving_pro_', ''))}
                            className={`relative w-full py-4 px-4 rounded-2xl border-2 transition-all active:scale-[0.97] flex items-center justify-between ${plan.id.includes(selectedPlan)
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-primary/10 bg-surface-light dark:bg-surface-dark'
                                }`}
                        >
                            <div className="text-left">
                                <p className="font-bold text-sm flex items-center gap-2">
                                    {plan.icon && <span className="material-symbols-outlined text-sm text-primary">{plan.icon}</span>}
                                    {plan.name}
                                    {plan.badge && (
                                        <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                            {plan.badge}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">{plan.period}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-primary">{plan.price}</p>
                            </div>
                            {plan.id.includes(selectedPlan) && (
                                <div className="absolute top-2 right-2">
                                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* 免費 vs Pro 功能比較 */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold mb-3 text-text-secondary-light dark:text-text-secondary-dark">免費版 vs Pro</h3>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden border border-primary/5 shadow-sm">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_70px_90px] px-4 py-2.5 bg-primary/5 text-[10px] uppercase tracking-wider font-bold text-text-secondary-light dark:text-text-secondary-dark">
                            <span>功能</span>
                            <span className="text-center">免費</span>
                            <span className="text-center text-primary">Pro 強大內核</span>
                        </div>
                        {FEATURE_COMPARISON.map((f, i) => (
                            <div key={f.name} className={`grid grid-cols-[1fr_70px_90px] px-4 py-3 items-center ${i < FEATURE_COMPARISON.length - 1 ? 'border-b border-primary/5' : ''}`}>
                                <span className="text-xs flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary/50 text-sm">{f.icon}</span>
                                    {f.name}
                                </span>
                                <span className="text-[10px] text-center text-text-secondary-light dark:text-text-secondary-dark">{f.free}</span>
                                <span className={`text-[10px] text-center font-bold ${f.pro === '限家庭方案' ? 'text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md' : 'text-primary'}`}>
                                    {f.pro}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="space-y-4">
                    <button
                        onClick={handlePurchase}
                        disabled={loading}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                立即升級織光 Pro
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleRestore}
                        disabled={restoring}
                        className="w-full py-2 text-xs text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors flex items-center justify-center gap-1 opacity-60 underline underline-offset-4"
                    >
                        {restoring ? '重啟訂閱查詢中...' : '恢復之前的購買項目'}
                    </button>
                </div>

                <div className="mt-8 space-y-2">
                    <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark text-center leading-relaxed">
                        訂閱將透過您的 App Store / Google Play 帳戶收取費用。<br />
                        您可以隨時在商店設定中管理或取消訂閱。
                    </p>
                    <div className="flex justify-center gap-4 text-[10px] text-primary/60">
                        <button onClick={() => navigate('/terms')} className="underline">服務條款</button>
                        <button onClick={() => navigate('/privacy')} className="underline">隱私權政策</button>
                    </div>
                </div>
            </main>
        </WeavingLayout>
    );
};

export default SupportPro;

