import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';

/** 🔗 分享這道光 — 真實分享功能 */
const ShareLight = () => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [shared, setShared] = useState(null);

    const shareUrl = window.location.origin;
    const shareText = '用「織光」記錄我們最珍貴的回憶。每一道光都是一段故事。';

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const input = document.createElement('input');
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [shareUrl]);

    const handleNativeShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: '織光 — 家庭故事編織', text: shareText, url: shareUrl });
                setShared('native');
            } catch {
                // 使用者取消
            }
        }
    }, [shareUrl, shareText]);

    const handleEmail = useCallback(() => {
        const subject = encodeURIComponent('邀請你一起用織光記錄家庭故事');
        const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        setShared('email');
    }, [shareUrl, shareText]);

    const handleLine = useCallback(() => {
        const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
        setShared('line');
    }, [shareUrl, shareText]);

    const shareOptions = [
        { icon: 'link', name: copied ? '✓ 已複製！' : '複製連結', action: handleCopy, highlight: copied },
        { icon: 'qr_code_2', name: 'QR Code', action: () => setShowQR(!showQR) },
        { icon: 'mail', name: '電子郵件', action: handleEmail },
        { icon: 'chat', name: 'LINE / 訊息', action: handleLine },
    ];

    // 如果支援 Web Share API，在最前面加原生分享
    if (navigator.share) {
        shareOptions.unshift({ icon: 'share', name: '分享...', action: handleNativeShare, primary: true });
    }

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-base font-bold font-display">分享這道光</h1>
                <div className="w-10" />
            </header>

            <main className="relative z-10 flex-1 px-6 pb-24 pt-8 flex flex-col items-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-8">
                    <span className="material-symbols-outlined text-primary text-6xl">share</span>
                </div>
                <h2 className="text-xl font-bold mb-2">分享你的故事</h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center mb-8">
                    讓更多人看見這道溫暖的光
                </p>

                {/* QR Code 區域 */}
                {showQR && (
                    <div className="w-full bg-white rounded-2xl p-6 mb-4 flex flex-col items-center shadow-sm">
                        {/* 使用 QR Code API 生成 */}
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}&bgcolor=FFFFFF&color=1a1a2e`}
                            alt="QR Code"
                            className="w-44 h-44 mb-3"
                        />
                        <p className="text-xs text-gray-500">掃描加入織光</p>
                    </div>
                )}

                {/* 分享選項 */}
                <div className="w-full space-y-3">
                    {shareOptions.map(item => (
                        <button
                            key={item.name}
                            onClick={item.action}
                            className={`w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-all active:scale-[0.98] ${item.primary
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90'
                                : item.highlight
                                    ? 'bg-success/10 text-success'
                                    : 'bg-surface-light dark:bg-surface-dark hover:bg-primary/5'
                                }`}
                        >
                            <span className={`material-symbols-outlined ${item.primary ? 'text-primary-foreground' : 'text-primary'}`}>{item.icon}</span>
                            <span>{item.name}</span>
                            {!item.primary && (
                                <span className="material-symbols-outlined text-sm text-text-secondary-light dark:text-text-secondary-dark ml-auto">
                                    arrow_forward_ios
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </main>
        </WeavingLayout>
    );
};

export default ShareLight;
