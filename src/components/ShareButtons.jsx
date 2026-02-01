import React from 'react';
import { Share2, MessageCircle, Facebook, Twitter } from 'lucide-react';

/**
 * 社群分享按鈕元件
 * -----------------
 * 支援 LINE, Facebook, Twitter 分享
 * 可用於 Reader 頁面或 Gallery 頁面
 */

// 分享平台配置
const SHARE_PLATFORMS = {
    line: {
        name: 'LINE',
        icon: MessageCircle,
        color: 'bg-[#00B900] hover:bg-[#00a000]',
        getUrl: (url, text) => `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    facebook: {
        name: 'Facebook',
        icon: Facebook,
        color: 'bg-[#1877F2] hover:bg-[#1666d8]',
        getUrl: (url, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    },
    twitter: {
        name: 'Twitter',
        icon: Twitter,
        color: 'bg-[#1DA1F2] hover:bg-[#1a91da]',
        getUrl: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
};

// 分享按鈕 (單個平台)
export const ShareButton = ({
    platform,
    url,
    text = '來看看這個精彩的故事！',
    className = '',
    size = 'md',
}) => {
    const config = SHARE_PLATFORMS[platform];
    if (!config) return null;

    const Icon = config.icon;
    const sizeClasses = {
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4',
    };
    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24,
    };

    const handleShare = () => {
        const shareUrl = config.getUrl(url, text);
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    return (
        <button
            onClick={handleShare}
            title={`分享到 ${config.name}`}
            className={`${config.color} ${sizeClasses[size]} rounded-full text-white transition-all shadow-lg hover:scale-110 ${className}`}
        >
            <Icon size={iconSizes[size]} />
        </button>
    );
};

// 分享按鈕群組
export const ShareButtonGroup = ({
    url,
    text,
    platforms = ['line', 'facebook', 'twitter'],
    size = 'md',
    className = '',
    showLabel = false,
}) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {showLabel && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Share2 size={16} />
                    <span>分享</span>
                </div>
            )}
            {platforms.map((platform) => (
                <ShareButton
                    key={platform}
                    platform={platform}
                    url={url}
                    text={text}
                    size={size}
                />
            ))}
        </div>
    );
};

// 分享下拉選單 (更緊湊的版本)
export const ShareDropdown = ({
    url,
    text = '來看看這個精彩的故事！',
    triggerClassName = '',
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all ${triggerClassName}`}
            >
                <Share2 size={18} />
                <span className="text-sm font-medium">分享</span>
            </button>

            {isOpen && (
                <>
                    {/* 點擊外部關閉 */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* 下拉選單 */}
                    <div className="absolute right-0 top-full mt-2 bg-[#1a1b26] border border-white/10 rounded-xl p-2 shadow-2xl z-50 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
                        {Object.entries(SHARE_PLATFORMS).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => {
                                        const shareUrl = config.getUrl(url, text);
                                        window.open(shareUrl, '_blank', 'width=600,height=400');
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-sm"
                                >
                                    <Icon size={18} />
                                    <span>{config.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default ShareButtonGroup;
