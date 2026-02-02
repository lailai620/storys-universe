import React, { useState } from 'react';
import { Sparkles, Star, Send, X, Heart, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import { useStory } from '../context/StoryContext';

/**
 * TipModal - 打賞彈窗元件
 * ========================
 * 讓讀者可以「投遞星塵」給創作者
 */

const tipAmounts = [
    { value: 5, label: '🌟 5', desc: '小小心意' },
    { value: 10, label: '⭐ 10', desc: '真心喜歡' },
    { value: 30, label: '💫 30', desc: '大力支持' },
    { value: 50, label: '✨ 50', desc: '超級粉絲' },
    { value: 100, label: '🌈 100', desc: '宇宙級讚賞' },
];

const TipModal = ({
    isOpen,
    onClose,
    authorId,
    authorName,
    storyId,
    storyTitle,
}) => {
    const [selectedAmount, setSelectedAmount] = useState(10);
    const [customAmount, setCustomAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { playClick, playSuccess } = useAudio();
    const { showToast } = useToast();
    const { user, balance, refreshBalance } = useStory();

    if (!isOpen) return null;

    const finalAmount = customAmount ? parseInt(customAmount) : selectedAmount;

    const handleTip = async () => {
        if (!user) {
            showToast('請先登入才能打賞', 'warning');
            return;
        }

        if (finalAmount <= 0) {
            showToast('請選擇打賞金額', 'warning');
            return;
        }

        if (finalAmount > balance) {
            showToast(`星塵不足！目前餘額: ${balance}`, 'error');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('send-tip', {
                body: {
                    fromUserId: user.id,
                    toUserId: authorId,
                    amount: finalAmount,
                    storyId: storyId,
                },
            });

            if (error) throw error;

            playSuccess();
            showToast(`🎉 ${data.message}`, 'success');
            refreshBalance();
            onClose();
        } catch (err) {
            console.error('打賞失敗:', err);
            showToast(err.message || '打賞失敗，請稍後再試', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal 內容 */}
            <div className="relative bg-gradient-to-br from-[#1a1b26] to-[#0f1016] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                {/* 關閉按鈕 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition"
                >
                    <X size={20} />
                </button>

                {/* 標題 */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4">
                        <Sparkles size={32} className="text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">投遞星塵</h2>
                    <p className="text-slate-400 text-sm">
                        支持 <span className="text-amber-400 font-medium">{authorName}</span> 的創作
                    </p>
                    {storyTitle && (
                        <p className="text-slate-500 text-xs mt-1">《{storyTitle}》</p>
                    )}
                </div>

                {/* 快速選擇金額 */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                    {tipAmounts.map((tip) => (
                        <button
                            key={tip.value}
                            onClick={() => {
                                playClick();
                                setSelectedAmount(tip.value);
                                setCustomAmount('');
                            }}
                            className={`py-3 rounded-xl text-center transition-all ${selectedAmount === tip.value && !customAmount
                                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            <div className="text-lg font-bold">{tip.value}</div>
                        </button>
                    ))}
                </div>

                {/* 自訂金額 */}
                <div className="mb-6">
                    <label className="text-xs text-slate-500 mb-1 block">或輸入自訂金額</label>
                    <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="輸入星塵數量 (1-1000)"
                        min="1"
                        max="1000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                </div>

                {/* 餘額顯示 */}
                <div className="flex items-center justify-between text-sm mb-6 px-2">
                    <span className="text-slate-400">你的星塵餘額</span>
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                        <Star size={14} className="fill-amber-400" />
                        {balance}
                    </span>
                </div>

                {/* 確認按鈕 */}
                <button
                    onClick={handleTip}
                    disabled={isLoading || finalAmount <= 0 || finalAmount > balance}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isLoading || finalAmount <= 0 || finalAmount > balance
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02]'
                        }`}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            處理中...
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            投遞 {finalAmount} 顆星塵
                        </>
                    )}
                </button>

                {/* 底部提示 */}
                <p className="text-center text-slate-500 text-xs mt-4">
                    打賞的星塵會直接轉入創作者帳戶
                </p>
            </div>
        </div>
    );
};

export default TipModal;
