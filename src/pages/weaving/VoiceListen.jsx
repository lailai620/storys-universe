import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import {
    getVoiceMessages,
    getVoiceUrl,
    playVoice,
    stopPlayback,
    deleteVoiceMessage,
    formatDuration,
    formatDate,
} from '../../services/voiceService';

/** 🎧 傾聽你的聲音 — 語音播放 */
const VoiceListen = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [playingId, setPlayingId] = useState(null);
    const [progress, setProgress] = useState({});
    const audioRef = useRef(null);

    // 載入語音列表
    useEffect(() => {
        setMessages(getVoiceMessages());
    }, []);

    // 清理：離開頁面時停止播放
    useEffect(() => {
        return () => stopPlayback();
    }, []);

    const handlePlay = useCallback((id) => {
        if (playingId === id) {
            // 正在播放這個 → 停止
            stopPlayback();
            setPlayingId(null);
            return;
        }

        const url = getVoiceUrl(id);
        if (!url) return;

        setPlayingId(id);
        playVoice(
            url,
            (prog) => setProgress(prev => ({ ...prev, [id]: prog })),
            () => {
                setPlayingId(null);
                setProgress(prev => ({ ...prev, [id]: 0 }));
            }
        );
    }, [playingId]);

    const handleDelete = useCallback((id) => {
        if (playingId === id) stopPlayback();
        deleteVoiceMessage(id);
        setMessages(prev => prev.filter(m => m.id !== id));
        setPlayingId(null);
    }, [playingId]);

    // Demo 資料（當沒有真實錄音時顯示）
    const demoMessages = [
        { id: 'demo_1', from: '媽媽', duration: 83, date: '2026-01-10T10:00:00Z', transcript: '豆豆今天特別乖呢...', isDemo: true },
        { id: 'demo_2', from: '爸爸', duration: 165, date: '2026-01-08T15:30:00Z', transcript: '想跟你說，那天...', isDemo: true },
        { id: 'demo_3', from: '妹妹', duration: 58, date: '2026-01-05T20:00:00Z', transcript: '哥你什麼時候回來...', isDemo: true },
    ];

    const displayMessages = messages.length > 0 ? messages : demoMessages;

    return (
        <WeavingLayout>
            <header className="relative z-10 px-6 pt-12 pb-4">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-primary/10">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold font-display">傾聽你的聲音</h1>
                </div>
                {messages.length > 0 && (
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        共 {messages.length} 段語音悄悄話
                    </p>
                )}
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24 space-y-3">
                {displayMessages.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-4xl text-primary/30 mb-4 block">mic_off</span>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark">還沒有語音悄悄話</p>
                        <button onClick={() => navigate('/voice-weave')} className="mt-4 text-primary text-sm font-bold">
                            去錄一段
                        </button>
                    </div>
                ) : (
                    displayMessages.map(msg => (
                        <div key={msg.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                {/* 頭像 */}
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* 名稱 & 日期 */}
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm">{msg.from}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                                {formatDate(msg.date)}
                                            </span>
                                            {!msg.isDemo && (
                                                <button
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="p-1 rounded-full hover:bg-danger/10 text-text-secondary-light dark:text-text-secondary-dark hover:text-danger transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 預覽文字 */}
                                    {(msg.transcript || msg.text) && (
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3 truncate">
                                            {msg.transcript || msg.text}
                                        </p>
                                    )}

                                    {/* 播放控制 */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handlePlay(msg.id)}
                                            disabled={msg.isDemo}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${msg.isDemo ? 'bg-primary/30 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 active:scale-95'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {playingId === msg.id ? 'pause' : 'play_arrow'}
                                            </span>
                                        </button>

                                        {/* 進度條 */}
                                        <div className="flex-1 h-1.5 bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-100"
                                                style={{ width: `${(progress[msg.id] || 0) * 100}%` }}
                                            />
                                        </div>

                                        {/* 時長 */}
                                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
                                            {formatDuration(msg.duration || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* 新增錄音 FAB */}
                <button
                    onClick={() => navigate('/voice-weave')}
                    className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
                >
                    <span className="material-symbols-outlined">mic</span>
                </button>
            </main>
        </WeavingLayout>
    );
};

export default VoiceListen;
