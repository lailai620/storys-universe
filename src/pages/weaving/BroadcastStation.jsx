import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import {
    getVoiceMessages,
    getVoiceUrl,
    playVoice,
    stopPlayback,
    formatDuration,
} from '../../services/voiceService';

/** 📻 回憶廣播站 — 隨機播放語音悄悄話 */
const BroadcastStation = () => {
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [progress, setProgress] = useState(0);
    const [mode, setMode] = useState('shuffle'); // shuffle | sequential
    const [messages, setMessages] = useState([]);
    const [trackIndex, setTrackIndex] = useState(0);

    useEffect(() => {
        const all = getVoiceMessages();
        setMessages(all);
        return () => stopPlayback();
    }, []);

    const playTrack = useCallback((index) => {
        if (messages.length === 0) return;
        const i = mode === 'shuffle' ? Math.floor(Math.random() * messages.length) : index % messages.length;
        const msg = messages[i];
        const url = getVoiceUrl(msg.id);
        if (!url) return;

        setCurrentTrack(msg);
        setTrackIndex(i);
        setIsPlaying(true);
        setProgress(0);

        playVoice(
            url,
            (prog) => setProgress(prog),
            () => {
                // 自動播放下一首
                setIsPlaying(false);
                setProgress(0);
                if (mode === 'sequential') playTrack(i + 1);
            }
        );
    }, [messages, mode]);

    const handleTogglePlay = () => {
        if (isPlaying) {
            stopPlayback();
            setIsPlaying(false);
        } else {
            playTrack(trackIndex);
        }
    };

    const handleNext = () => {
        stopPlayback();
        playTrack(trackIndex + 1);
    };

    const hasRecordings = messages.length > 0;

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <button onClick={() => { stopPlayback(); navigate(-1); }} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-base font-bold font-display">回憶廣播站</h1>
                <div className="w-10" />
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
                {/* 唱片視覺 */}
                <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/10 flex items-center justify-center mb-8 shadow-xl ${isPlaying ? 'animate-spin' : ''}`} style={isPlaying ? { animationDuration: '8s' } : {}}>
                    <div className="w-20 h-20 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-primary text-3xl">radio</span>
                    </div>
                </div>

                {/* 現在播放 */}
                {currentTrack ? (
                    <div className="text-center mb-6">
                        <h3 className="font-bold text-lg">{currentTrack.from} 的悄悄話</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{formatDuration(currentTrack.duration || 0)}</p>
                    </div>
                ) : (
                    <div className="text-center mb-6">
                        <h3 className="font-bold text-lg">{hasRecordings ? '按下播放' : '尚無錄音'}</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            {hasRecordings ? `${messages.length} 段悄悄話準備播放` : '先去錄一段悄悄話吧'}
                        </p>
                    </div>
                )}

                {/* 進度條 */}
                <div className="w-full max-w-xs mb-8">
                    <div className="h-1.5 bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${progress * 100}%` }} />
                    </div>
                </div>

                {/* 控制按鈕 */}
                <div className="flex items-center gap-6 mb-8">
                    <button
                        onClick={() => setMode(mode === 'shuffle' ? 'sequential' : 'shuffle')}
                        className={`p-3 rounded-full transition-colors ${mode === 'shuffle' ? 'bg-primary/10 text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/5'}`}
                    >
                        <span className="material-symbols-outlined">{mode === 'shuffle' ? 'shuffle' : 'repeat'}</span>
                    </button>

                    <button
                        onClick={handleTogglePlay}
                        disabled={!hasRecordings}
                        className="w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined text-3xl">
                            {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!hasRecordings}
                        className="p-3 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/5 transition-colors disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined">skip_next</span>
                    </button>
                </div>

                {/* 快捷連結 */}
                {!hasRecordings && (
                    <button
                        onClick={() => navigate('/voice-weave')}
                        className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                        <span className="material-symbols-outlined text-sm">mic</span>
                        去錄一段悄悄話
                    </button>
                )}
            </main>
        </WeavingLayout>
    );
};

export default BroadcastStation;
