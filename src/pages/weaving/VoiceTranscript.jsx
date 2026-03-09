import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import {
    getVoiceMessages,
    updateTranscript,
    formatDuration,
    formatDate,
} from '../../services/voiceService';

/** 📝 語音轉譯 */
const VoiceTranscript = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [transcribing, setTranscribing] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        const all = getVoiceMessages();
        setMessages(all.length > 0 ? all : [
            { id: 'demo_1', from: '媽媽', duration: 83, date: '2026-01-10T10:00:00Z', transcribed: true, transcript: '豆豆今天特別乖，自己吃完了一整碗飯，還幫忙收拾桌子呢。' },
            { id: 'demo_2', from: '爸爸', duration: 165, date: '2026-01-08T15:30:00Z', transcribed: true, transcript: '想跟你說，那天在公園散步的時候，看到了一隻跟咱們家毛毛很像的狗...' },
            { id: 'demo_3', from: '妹妹', duration: 58, date: '2026-01-05T20:00:00Z', transcribed: false, transcript: '' },
        ]);
    }, []);

    // 模擬轉譯（未來接入 Whisper API）
    const handleTranscribe = async (id) => {
        setTranscribing(id);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const fakeText = '（AI 語音轉譯功能將在連接後端後啟用。這是模擬結果。）';
        updateTranscript(id, fakeText);
        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, transcribed: true, transcript: fakeText } : m)
        );
        setTranscribing(null);
    };

    const handleEdit = (id, text) => {
        setEditingId(id);
        setEditText(text);
    };

    const handleSaveEdit = (id) => {
        updateTranscript(id, editText);
        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, transcript: editText } : m)
        );
        setEditingId(null);
    };

    return (
        <WeavingLayout>
            <header className="relative z-10 px-6 pt-12 pb-4">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-primary/10">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold font-display">語音轉譯</h1>
                </div>
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24 space-y-3">
                {messages.map(msg => (
                    <div key={msg.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-xs">person</span>
                                </div>
                                <span className="font-bold text-sm">{msg.from}</span>
                                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
                                    {formatDuration(msg.duration || 0)}
                                </span>
                            </div>
                            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                {formatDate(msg.date)}
                            </span>
                        </div>

                        {msg.transcribed ? (
                            <div>
                                {editingId === msg.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full p-3 bg-background-light dark:bg-background-dark rounded-xl text-sm border border-primary/20 focus:border-primary focus:outline-none resize-none min-h-[80px]"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingId(null)} className="text-xs text-text-secondary-light dark:text-text-secondary-dark px-3 py-1.5 rounded-lg hover:bg-primary/5">取消</button>
                                            <button onClick={() => handleSaveEdit(msg.id)} className="text-xs text-primary font-bold px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/15">儲存</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2">
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed flex-1">
                                            {msg.transcript}
                                        </p>
                                        <button onClick={() => handleEdit(msg.id, msg.transcript)} className="p-1 rounded-full hover:bg-primary/10 text-primary shrink-0">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => handleTranscribe(msg.id)}
                                disabled={transcribing === msg.id}
                                className="w-full py-2.5 bg-primary/10 text-primary text-sm font-medium rounded-xl hover:bg-primary/15 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {transcribing === msg.id ? (
                                    <><div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />轉譯中...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-sm">subtitles</span>文字轉譯</>
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </main>
        </WeavingLayout>
    );
};

export default VoiceTranscript;
