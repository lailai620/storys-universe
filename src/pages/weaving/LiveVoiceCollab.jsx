import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { startRecording, stopRecording, cancelRecording, formatDuration } from '../../services/voiceService';
import { useToast } from '../../context/ToastContext';

/** 🎙️ 邊聊邊織 — 即時語音協作空間 */
const MEMBERS = [
    { name: '媽媽', speaking: false },
    { name: '爸爸', speaking: false },
    { name: '妹妹', speaking: false },
    { name: '你', speaking: false, isMe: true },
];

const LiveVoiceCollab = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [recording, setRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [muted, setMuted] = useState(false);
    const [members, setMembers] = useState(MEMBERS);
    const [storyText, setStoryText] = useState('');
    const [contributions, setContributions] = useState([]);

    useEffect(() => {
        return () => cancelRecording();
    }, []);

    // 模擬其他成員的說話狀態
    useEffect(() => {
        if (!recording) return;
        const interval = setInterval(() => {
            setMembers(prev => prev.map(m => {
                if (m.isMe) return { ...m, speaking: recording && !muted };
                return { ...m, speaking: Math.random() > 0.6 };
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, [recording, muted]);

    const handleToggleRecord = useCallback(async () => {
        if (recording) {
            await stopRecording();
            setRecording(false);
            setMembers(prev => prev.map(m => ({ ...m, speaking: false })));
        } else {
            const ok = await startRecording((s) => setSeconds(s));
            if (ok) {
                setRecording(true);
            } else {
                showToast('無法存取麥克風，請檢查權限設定', 'error');
            }
        }
    }, [recording]);

    const handleAddContribution = useCallback(() => {
        if (!storyText.trim()) return;
        setContributions(prev => [...prev, {
            id: Date.now(),
            from: '你',
            text: storyText,
            time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        }]);
        setStoryText('');
    }, [storyText]);

    const handleEndSession = useCallback(() => {
        cancelRecording();
        // 儲存協作紀錄
        if (contributions.length > 0) {
            const sessions = JSON.parse(localStorage.getItem('collab_sessions') || '[]');
            sessions.unshift({
                id: `collab_${Date.now()}`,
                members: members.map(m => m.name),
                contributions,
                duration: seconds,
                date: new Date().toISOString(),
            });
            localStorage.setItem('collab_sessions', JSON.stringify(sessions));
        }
        navigate(-1);
    }, [contributions, members, seconds, navigate]);

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-base font-bold font-display">邊聊邊織</h1>
                    {recording && (
                        <p className="text-xs text-primary font-mono animate-pulse">{formatDuration(seconds)}</p>
                    )}
                </div>
                <button onClick={handleEndSession} className="p-2 rounded-full hover:bg-danger/10 text-danger">
                    <span className="material-symbols-outlined">call_end</span>
                </button>
            </header>

            <main className="relative z-10 flex-1 px-4 pb-20 pt-6 flex flex-col overflow-y-auto">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6 text-center">
                    即時語音協作空間
                </p>

                {/* 成員頭像 */}
                <div className="grid grid-cols-2 gap-6 mb-6 w-full max-w-xs mx-auto">
                    {members.map((m) => (
                        <div key={m.name} className="flex flex-col items-center gap-2">
                            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white transition-all ${m.isMe ? 'bg-primary' : 'bg-surface-dark'
                                } ${m.speaking ? 'ring-4 ring-success/40 scale-105' : ''}`}>
                                <span className="material-symbols-outlined text-2xl">person</span>
                                {m.speaking && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-xs">mic</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-medium">{m.name}</span>
                            {m.speaking && (
                                <span className="text-xs text-success flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-success inline-block animate-pulse" />
                                    說話中
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* 故事協作區 */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 w-full mb-4 flex-1">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">edit_note</span>
                        正在編織的故事
                    </h3>

                    {/* 貢獻列表 */}
                    <div className="space-y-2 mb-3 max-h-[200px] overflow-y-auto">
                        {contributions.length === 0 ? (
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark italic">
                                「記得那年過年，全家人一起...」
                            </p>
                        ) : (
                            contributions.map(c => (
                                <div key={c.id} className="flex gap-2">
                                    <span className="text-xs font-bold text-primary shrink-0">{c.from}：</span>
                                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{c.text}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 文字輸入 */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={storyText}
                            onChange={(e) => setStoryText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddContribution()}
                            placeholder="加一段回憶..."
                            className="flex-1 bg-background-light dark:bg-background-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <button
                            onClick={handleAddContribution}
                            disabled={!storyText.trim()}
                            className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all"
                        >
                            加入
                        </button>
                    </div>
                </div>

                {/* 控制按鈕 */}
                <div className="flex gap-4 justify-center pt-2">
                    <button
                        onClick={handleToggleRecord}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${recording ? 'bg-danger text-white shadow-danger/30' : 'bg-primary text-primary-foreground shadow-primary/30'
                            }`}
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {recording ? 'stop' : 'mic'}
                        </span>
                    </button>
                    <button
                        onClick={() => setMuted(!muted)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all active:scale-95 ${muted ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-surface-light dark:bg-surface-dark border-primary/20 text-primary'
                            }`}
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {muted ? 'mic_off' : 'volume_up'}
                        </span>
                    </button>
                </div>
            </main>
        </WeavingLayout>
    );
};

export default LiveVoiceCollab;
