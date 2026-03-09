import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ✨ 織光 Onboarding — 首次使用引導流程
 * 3 步驟：品牌介紹 → 核心功能 → 開始使用
 */

const ONBOARDING_KEY = 'weaving_onboarding_done';

const STEPS = [
    {
        icon: 'auto_awesome',
        title: '歡迎來到織光',
        subtitle: '用溫暖的方式記錄生命中珍貴的故事',
        description: '織光是你的故事編織工具。透過 AI 引導式訪談，幫助你記錄家人、朋友、同事、寵物的珍貴回憶。',
        bgGradient: 'from-primary/20 via-primary/5 to-transparent',
    },
    {
        icon: 'record_voice_over',
        title: '用聲音與文字交織回憶',
        subtitle: 'AI 引導你一步步織出故事',
        description: '選擇一個想記錄的人，AI 會像溫柔的好朋友一樣，引導你回憶那些美好的瞬間。還可以用語音留下最真實的情感。',
        bgGradient: 'from-info/15 via-primary/5 to-transparent',
    },
    {
        icon: 'menu_book',
        title: '讓回憶成為永恆',
        subtitle: '從數位故事到精裝實體書',
        description: '你的故事會被整理成一本精美的數位書。未來還能印製成精裝實體書，成為最珍貴的禮物。',
        bgGradient: 'from-success/15 via-primary/5 to-transparent',
    },
];

export const isOnboardingDone = () => localStorage.getItem(ONBOARDING_KEY) === 'true';

const Onboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;

    const handleNext = useCallback(() => {
        if (isLast) {
            // 完成 Onboarding
            setIsExiting(true);
            localStorage.setItem(ONBOARDING_KEY, 'true');
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 400);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    }, [isLast, navigate]);

    const handleSkip = useCallback(() => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        navigate('/', { replace: true });
    }, [navigate]);

    return (
        <div className={`fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col transition-opacity duration-400 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            {/* 背景裝飾 */}
            <div className={`absolute inset-0 bg-gradient-to-b ${step.bgGradient} transition-all duration-700`} />
            <div className="absolute top-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-40 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />

            {/* 跳過按鈕 */}
            {!isLast && (
                <div className="relative z-10 flex justify-end px-6 pt-12">
                    <button
                        onClick={handleSkip}
                        className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors px-3 py-1.5 rounded-full"
                    >
                        跳過
                    </button>
                </div>
            )}

            {/* 主內容 */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 max-w-md mx-auto w-full">
                {/* 圖示 */}
                <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-8 animate-float">
                    <span className="material-symbols-outlined text-primary text-6xl">
                        {step.icon}
                    </span>
                </div>

                {/* 文字 */}
                <div className="text-center mb-12" key={currentStep}>
                    <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 tracking-tight">
                        {step.title}
                    </h1>
                    <p className="text-base font-medium text-primary mb-4">
                        {step.subtitle}
                    </p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed max-w-xs mx-auto">
                        {step.description}
                    </p>
                </div>
            </main>

            {/* 底部控制 */}
            <div className="relative z-10 px-8 pb-12 max-w-md mx-auto w-full">
                {/* 進度指示器 */}
                <div className="flex justify-center gap-2 mb-8">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep
                                    ? 'w-8 bg-primary'
                                    : i < currentStep
                                        ? 'w-4 bg-primary/40'
                                        : 'w-4 bg-primary/15'
                                }`}
                        />
                    ))}
                </div>

                {/* 主按鈕 */}
                <button
                    onClick={handleNext}
                    className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <span>{isLast ? '開始使用織光' : '下一步'}</span>
                    <span className="material-symbols-outlined text-sm">
                        {isLast ? 'arrow_forward' : 'arrow_forward'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
