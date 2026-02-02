// 三大模式配置檔
// 定義各模式的顏色、類別、圖示與文案

export const MODE_CONFIG = {
    // 🌌 宇宙模式 (Universe) - 預設模式
    universe: {
        id: 'universe',
        name: '宇宙模式',
        nameEn: 'Universe',
        icon: '🌌',
        description: '探索無限創意宇宙',

        // 視覺主題
        theme: {
            background: '#0f1016',
            backgroundGradient: 'linear-gradient(135deg, #0f1016 0%, #1a1b26 100%)',
            accent: '#6366f1',
            accentHover: '#818cf8',
            secondary: '#8b5cf6',
            text: '#e2e8f0',
            textMuted: '#94a3b8',
            cardBg: 'rgba(255,255,255,0.05)',
            border: 'rgba(255,255,255,0.1)',
            radius: '1rem',
            glow: '0 0 30px rgba(99,102,241,0.3)',
        },

        // 故事類別
        categories: [
            { id: 'scifi', name: '科幻', icon: '🚀', color: '#06b6d4' },
            { id: 'fantasy', name: '奇幻', icon: '🧙', color: '#8b5cf6' },
            { id: 'horror', name: '恐怖', icon: '👻', color: '#ef4444' },
            { id: 'comedy', name: '搞笑', icon: '😂', color: '#fbbf24' },
            { id: 'novel', name: '小說', icon: '📖', color: '#10b981' },
            { id: 'romance', name: '浪漫', icon: '💕', color: '#ec4899' },
            { id: 'mystery', name: '懸疑', icon: '🔍', color: '#6366f1' },
        ],
    },

    // 🍭 兒童模式 (Kids)
    kids: {
        id: 'kids',
        name: '兒童模式',
        nameEn: 'Kids',
        icon: '🍭',
        description: '溫暖安全的創作樂園',

        theme: {
            background: '#fef7cd',
            backgroundGradient: 'linear-gradient(135deg, #fef7cd 0%, #fce7f3 50%, #dbeafe 100%)',
            accent: '#f472b6',
            accentHover: '#f9a8d4',
            secondary: '#34d399',
            text: '#4a3728',
            textMuted: '#78716c',
            cardBg: 'rgba(255,255,255,0.8)',
            border: 'rgba(244,114,182,0.3)',
            radius: '9999px',
            glow: '0 8px 30px rgba(244,114,182,0.2)',
        },

        categories: [
            { id: 'picturebook', name: '繪本', icon: '🎨', color: '#f472b6' },
            { id: 'fairytale', name: '童話', icon: '🏰', color: '#a78bfa' },
            { id: 'adventure', name: '冒險', icon: '🗺️', color: '#34d399' },
            { id: 'animals', name: '動物', icon: '🐻', color: '#fbbf24' },
            { id: 'educational', name: '教育', icon: '📚', color: '#60a5fa' },
            { id: 'bedtime', name: '睡前故事', icon: '🌙', color: '#818cf8' },
        ],
    },

    // 🕰️ 拾光模式 (Memoir)
    memoir: {
        id: 'memoir',
        name: '拾光模式',
        nameEn: 'Memoir',
        icon: '🕰️',
        description: '珍藏生命中的美好時光',

        theme: {
            background: '#1c1917',
            backgroundGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #3f3f46 100%)',
            accent: '#d97706',
            accentHover: '#f59e0b',
            secondary: '#b45309',
            text: '#fef3c7',
            textMuted: '#d6d3d1',
            cardBg: 'rgba(254,243,199,0.05)',
            border: 'rgba(217,119,6,0.3)',
            radius: '0.5rem',
            glow: '0 4px 20px rgba(217,119,6,0.15)',
        },

        categories: [
            { id: 'memory', name: '回憶', icon: '📷', color: '#d97706' },
            { id: 'diary', name: '日記', icon: '📝', color: '#f59e0b' },
            { id: 'mood', name: '心情', icon: '💭', color: '#a3e635' },
            { id: 'travel', name: '旅行', icon: '✈️', color: '#38bdf8' },
            { id: 'family', name: '家庭', icon: '👨‍👩‍👧', color: '#fb7185' },
            { id: 'gratitude', name: '感恩', icon: '🙏', color: '#c084fc' },
        ],
    },
};

// 取得當前模式配置
export const getModeConfig = (modeId) => {
    return MODE_CONFIG[modeId] || MODE_CONFIG.universe;
};

// 取得所有模式列表
export const getAllModes = () => {
    return Object.values(MODE_CONFIG);
};

// 預設模式
export const DEFAULT_MODE = 'universe';
