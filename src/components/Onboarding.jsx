import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, X, Sparkles, Check } from 'lucide-react';

/**
 * Onboarding 新手導覽系統
 * -------------------------
 * 功能：
 * 1. Spotlight 高亮目標元素
 * 2. Tooltip 步驟指引
 * 3. 進度指示器
 * 4. localStorage 記錄完成狀態
 */

// 預設導覽步驟 (Creator 頁面專用)
const CREATOR_ONBOARDING_STEPS = [
    {
        id: 'welcome',
        target: null, // 全螢幕模式
        title: '🌌 歡迎來到創作工作室！',
        content: '這是您的星際創作基地。讓我帶您快速了解如何開始您的第一個故事。',
        position: 'center',
    },
    {
        id: 'title',
        target: '[data-onboarding="title-input"]',
        title: '📝 故事標題',
        content: '在這裡輸入您故事的標題。一個好的標題能吸引更多讀者！',
        position: 'bottom',
    },
    {
        id: 'mode-switch',
        target: '[data-onboarding="mode-switch"]',
        title: '🎨 創作模式',
        content: '選擇「分頁製作」手動編輯，或「AI 全自動」讓 AI 幫您生成完整故事。',
        position: 'right',
    },
    {
        id: 'canvas',
        target: '[data-onboarding="canvas"]',
        title: '🖼️ 視覺畫布',
        content: '這是您的封面展示區。可以上傳圖片，或點擊右下角讓 AI 幫您生成場景！',
        position: 'bottom',
    },
    {
        id: 'text-editor',
        target: '[data-onboarding="text-editor"]',
        title: '✍️ 內容編輯',
        content: '在這裡撰寫故事內容。支援語音輸入，點擊麥克風圖示即可開始說話。',
        position: 'top',
    },
    {
        id: 'save-button',
        target: '[data-onboarding="save-button"]',
        title: '💾 封存作品',
        content: '完成後點擊這裡封存您的作品。登入用戶可同步到雲端，訪客則儲存在本地。',
        position: 'left',
    },
    {
        id: 'complete',
        target: null,
        title: '🎉 準備就緒！',
        content: '您已經了解基本操作了！現在開始創作您的第一個故事吧。祝您靈感源源不絕！',
        position: 'center',
    },
];

// Onboarding Context
const OnboardingContext = React.createContext(null);

export const useOnboarding = () => {
    const context = React.useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
};

// Onboarding Provider
export const OnboardingProvider = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState(CREATOR_ONBOARDING_STEPS);

    // 檢查是否已完成導覽
    const hasCompletedOnboarding = useCallback((key = 'creator') => {
        return localStorage.getItem(`onboarding_${key}_completed`) === 'true';
    }, []);

    // 標記導覽完成
    const markAsCompleted = useCallback((key = 'creator') => {
        localStorage.setItem(`onboarding_${key}_completed`, 'true');
    }, []);

    // 開始導覽
    const startOnboarding = useCallback((customSteps = null) => {
        if (customSteps) {
            setSteps(customSteps);
        }
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    // 結束導覽
    const endOnboarding = useCallback((markComplete = true) => {
        setIsActive(false);
        if (markComplete) {
            markAsCompleted('creator');
        }
    }, [markAsCompleted]);

    // 下一步
    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            endOnboarding(true);
        }
    }, [currentStep, steps.length, endOnboarding]);

    // 上一步
    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    // 跳到指定步驟
    const goToStep = useCallback((index) => {
        if (index >= 0 && index < steps.length) {
            setCurrentStep(index);
        }
    }, [steps.length]);

    const value = {
        isActive,
        currentStep,
        steps,
        hasCompletedOnboarding,
        startOnboarding,
        endOnboarding,
        nextStep,
        prevStep,
        goToStep,
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
            {isActive && <OnboardingOverlay />}
        </OnboardingContext.Provider>
    );
};

// Spotlight 遮罩層
const OnboardingOverlay = () => {
    const { currentStep, steps, nextStep, prevStep, endOnboarding } = useOnboarding();
    const [targetRect, setTargetRect] = useState(null);
    const step = steps[currentStep];

    // 計算目標元素位置
    useEffect(() => {
        if (!step.target) {
            setTargetRect(null);
            return;
        }

        const element = document.querySelector(step.target);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect({
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16,
            });
        } else {
            setTargetRect(null);
        }
    }, [step.target, currentStep]);

    // 計算 Tooltip 位置
    const getTooltipStyle = () => {
        if (!targetRect || step.position === 'center') {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        }

        const padding = 20;
        const tooltipWidth = 320;

        switch (step.position) {
            case 'bottom':
                return {
                    position: 'fixed',
                    top: targetRect.top + targetRect.height + padding,
                    left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
                };
            case 'top':
                return {
                    position: 'fixed',
                    bottom: window.innerHeight - targetRect.top + padding,
                    left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
                };
            case 'left':
                return {
                    position: 'fixed',
                    top: targetRect.top + targetRect.height / 2 - 80,
                    right: window.innerWidth - targetRect.left + padding,
                };
            case 'right':
                return {
                    position: 'fixed',
                    top: targetRect.top + targetRect.height / 2 - 80,
                    left: targetRect.left + targetRect.width + padding,
                };
            default:
                return {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                };
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999]">
            {/* 背景遮罩 (帶 spotlight 挖空) */}
            <div className="absolute inset-0 bg-black/80 transition-all duration-500">
                {targetRect && (
                    <div
                        className="absolute bg-transparent rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] transition-all duration-300"
                        style={{
                            top: targetRect.top,
                            left: targetRect.left,
                            width: targetRect.width,
                            height: targetRect.height,
                            boxShadow: `0 0 0 9999px rgba(0,0,0,0.8), 0 0 30px 10px rgba(99,102,241,0.4)`,
                        }}
                    />
                )}
            </div>

            {/* Tooltip 卡片 */}
            <div
                className="w-80 bg-[#1a1b26] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl shadow-indigo-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={getTooltipStyle()}
            >
                {/* 關閉按鈕 */}
                <button
                    onClick={() => endOnboarding(false)}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                {/* 標題 */}
                <h3 className="text-xl font-bold text-white mb-3 pr-6">
                    {step.title}
                </h3>

                {/* 內容 */}
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {step.content}
                </p>

                {/* 進度指示器 */}
                <div className="flex items-center gap-1.5 mb-4">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === currentStep
                                    ? 'bg-indigo-500 w-6'
                                    : i < currentStep
                                        ? 'bg-indigo-500/50 w-2'
                                        : 'bg-slate-700 w-2'
                                }`}
                        />
                    ))}
                </div>

                {/* 導航按鈕 */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                        上一步
                    </button>

                    <button
                        onClick={nextStep}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30"
                    >
                        {currentStep === steps.length - 1 ? (
                            <>
                                <Check size={16} />
                                開始創作
                            </>
                        ) : (
                            <>
                                下一步
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// 觸發導覽的按鈕元件
export const OnboardingTrigger = ({ className = '' }) => {
    const { startOnboarding, hasCompletedOnboarding } = useOnboarding();

    return (
        <button
            onClick={() => startOnboarding()}
            className={`flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl hover:bg-indigo-500/30 transition-all ${className}`}
        >
            <Sparkles size={16} />
            {hasCompletedOnboarding() ? '重新檢視導覽' : '開始新手導覽'}
        </button>
    );
};

export default OnboardingProvider;
