import React, { useState, useRef, useEffect } from 'react';
import { useStory } from '../context/StoryContext';
import { getAllModes, getModeConfig } from '../config/modeConfig';
import { useAudio } from '../context/AudioContext';

const ModeSwitcher = () => {
    const { appMode, setAppMode } = useStory();
    const { playClick, playHover, playSuccess } = useAudio();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentMode = getModeConfig(appMode);
    const allModes = getAllModes();

    // 點擊外部關閉
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleModeChange = (modeId) => {
        if (modeId !== appMode) {
            playSuccess?.();
            setAppMode(modeId);
        }
        setIsOpen(false);
    };

    // 🎹 鍵盤導航
    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        const currentIndex = allModes.findIndex(m => m.id === appMode);

        switch (e.key) {
            case 'Escape':
                setIsOpen(false);
                break;
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % allModes.length;
                handleModeChange(allModes[nextIndex].id);
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + allModes.length) % allModes.length;
                handleModeChange(allModes[prevIndex].id);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 切換按鈕 */}
            <button
                onClick={() => { playClick?.(); setIsOpen(!isOpen); }}
                onMouseEnter={playHover}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`模式切換，當前：${currentMode.name}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                title={`當前模式：${currentMode.name}`}
            >
                <span className="text-lg">{currentMode.icon}</span>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white hidden sm:inline">
                    {currentMode.nameEn}
                </span>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* 下拉選單 */}
            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-64 bg-[#1a1b26]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    role="listbox"
                    aria-label="選擇創作模式"
                >
                    <div className="p-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider px-3 py-2" aria-hidden="true">選擇創作模式</p>

                        {allModes.map((mode) => {
                            const isActive = mode.id === appMode;
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => handleModeChange(mode.id)}
                                    onMouseEnter={playHover}
                                    role="option"
                                    aria-selected={isActive}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset ${isActive
                                        ? 'bg-indigo-500/20 border border-indigo-500/40'
                                        : 'hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-2xl" aria-hidden="true">{mode.icon}</span>
                                    <div className="text-left flex-1">
                                        <p className={`font-bold ${isActive ? 'text-indigo-300' : 'text-white'}`}>
                                            {mode.name}
                                        </p>
                                        <p className="text-xs text-slate-400">{mode.description}</p>
                                    </div>
                                    {isActive && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" aria-hidden="true" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* 小提示 */}
                    <div className="px-4 py-3 bg-white/5 border-t border-white/5">
                        <p className="text-xs text-slate-500 text-center">
                            💡 切換模式會改變整體視覺風格與類別選項
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModeSwitcher;
