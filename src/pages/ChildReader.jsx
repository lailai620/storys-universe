import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChildModeLayout from '../layouts/ChildModeLayout';
import MagicGlassesButton from '../components/childmode/MagicGlassesButton';
import RubyCharacter from '../components/childmode/RubyCharacter';
import ParentGateModal from '../components/childmode/ParentGateModal';
import { useChildMode } from '../context/ChildModeContext';
import { Helmet } from 'react-helmet-async';

/**
 * 📖 ChildReader - 兒童閱讀頁面
 * ============================
 * 這是一個完整的兒童模式閱讀頁面範例
 * 展示所有兒童模式元件的整合使用方式
 */

// 範例故事內容
const SAMPLE_STORY = {
    title: '小兔子找朋友',
    author: '故事媽媽',
    pages: [
        {
            image: '🐰',
            text: '從前從前，在一片翠綠的大森林裡，住著一隻可愛的小兔子。',
        },
        {
            image: '🌳',
            text: '小兔子很想交朋友。有一天，他決定出門去找朋友玩。',
        },
        {
            image: '🦊',
            text: '他在路上遇到了小狐狸。小兔子說：「你好，我們可以做朋友嗎？」',
        },
        {
            image: '🤝',
            text: '小狐狸開心地說：「好啊！我們一起去玩吧！」',
        },
        {
            image: '🌈',
            text: '從此以後，小兔子和小狐狸成為了最好的朋友。他們每天都快樂地在森林裡玩耍。',
        },
    ],
};

// 內容元件（需要在 ChildModeLayout 內部）
const ChildReaderContent = () => {
    const navigate = useNavigate();
    const { fontSize } = useChildMode();

    const [currentPage, setCurrentPage] = useState(0);
    const [showParentGate, setShowParentGate] = useState(false);

    const story = SAMPLE_STORY;
    const page = story.pages[currentPage];
    const totalPages = story.pages.length;

    // 翻頁
    const goToPage = (index) => {
        if (index >= 0 && index < totalPages) {
            setCurrentPage(index);
        }
    };

    // 嘗試離開（觸發家長閘門）
    const handleExit = () => {
        setShowParentGate(true);
    };

    // 確認離開
    const handleConfirmExit = () => {
        setShowParentGate(false);
        navigate('/gallery');
    };

    // 字體大小對應
    const fontSizeClass = {
        medium: 'text-xl',
        large: 'text-2xl',
        xlarge: 'text-3xl',
    }[fontSize] || 'text-xl';

    return (
        <div className={`min-h-screen flex flex-col cm-font-${fontSize}`}>
            {/* 魔法眼鏡按鈕（固定在右上角） */}
            <MagicGlassesButton />

            {/* 頂部導航 */}
            <header className="flex items-center justify-between p-4 sm:p-6">
                {/* 返回按鈕（觸發家長閘門） */}
                <button
                    onClick={handleExit}
                    className="cm-btn cm-btn-violet flex items-center gap-2 !px-4 !py-2 !text-base"
                >
                    <span className="text-xl">←</span>
                    <span className="hidden sm:inline">回到畫廊</span>
                </button>

                {/* 故事標題 */}
                <h1
                    className="text-xl sm:text-2xl font-bold text-center flex-1 mx-4"
                    style={{ color: '#4A403A' }}
                >
                    {story.title}
                </h1>

                {/* 佔位 */}
                <div className="w-24" />
            </header>

            {/* 主要內容區 */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
                {/* 故事卡片 */}
                <div className="cm-card max-w-2xl w-full">
                    {/* 插圖區 */}
                    <div
                        className="text-center text-8xl sm:text-9xl mb-8 py-8"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)',
                            borderRadius: '1.5rem',
                        }}
                    >
                        {page.image}
                    </div>

                    {/* 文字內容（帶注音） */}
                    <div
                        className={`${fontSizeClass} leading-loose text-center`}
                        style={{ color: '#4A403A' }}
                    >
                        <RubyCharacter text={page.text} />
                    </div>
                </div>

                {/* 頁碼指示器 */}
                <div className="flex items-center gap-3 mt-8">
                    {story.pages.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToPage(i)}
                            className={`
                w-4 h-4 rounded-full transition-all duration-300
                ${i === currentPage
                                    ? 'bg-[#FFB7B2] w-8 shadow-lg'
                                    : 'bg-[#4A403A]/20 hover:bg-[#4A403A]/40'
                                }
              `}
                            aria-label={`第 ${i + 1} 頁`}
                        />
                    ))}
                </div>
            </main>

            {/* 底部導航 */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center gap-4 bg-gradient-to-t from-[#FEF9E7] to-transparent">
                {/* 上一頁 */}
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className={`
            cm-btn cm-btn-mint !text-xl
            ${currentPage === 0 ? 'opacity-40 cursor-not-allowed' : ''}
          `}
                >
                    ← 上一頁
                </button>

                {/* 下一頁 */}
                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className={`
            cm-btn cm-btn-peach !text-xl
            ${currentPage === totalPages - 1 ? 'opacity-40 cursor-not-allowed' : ''}
          `}
                >
                    下一頁 →
                </button>
            </footer>

            {/* 家長閘門 Modal */}
            <ParentGateModal
                isOpen={showParentGate}
                onClose={() => setShowParentGate(false)}
                onUnlock={handleConfirmExit}
            />
        </div>
    );
};

// 主頁面元件（包裝在 ChildModeLayout 中）
const ChildReader = () => {
    return (
        <ChildModeLayout>
            <Helmet>
                <title>兒童閱讀 | Storys Universe</title>
                <meta name="description" content="適合兒童的互動式繪本閱讀體驗，支援注音標示。" />
            </Helmet>
            <ChildReaderContent />
        </ChildModeLayout>
    );
};

export default ChildReader;
