import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import {
    getVoiceMessages,
    updateTranscript,
    formatDuration,
    formatDate,
} from '../../services/voiceService';
import { transcribeAndPolishVoice } from '../../services/weavingAI';
import { saveStory } from '../../services/dbService';
import { useToast } from '../../context/ToastContext';
import { hapticService } from '../../services/hapticService';

/** 📝 語音轉譯與潤飾 */
const VoiceTranscript = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [messages, setMessages] = useState([]);
    const [transcribing, setTranscribing] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editPolished, setEditPolished] = useState('');
    const [viewMode, setViewMode] = useState({}); // { msgId: 'transcript' | 'polished' }
    const [showSuccessGlow, setShowSuccessGlow] = useState(false);

    useEffect(() => {
        const load = async () => {
            const all = await getVoiceMessages();
            setMessages(all);
        };
        load();
    }, []);

    // 真實呼叫 AI 進行語音轉譯與散文精練
    const handleTranscribe = async (id) => {
        const msg = messages.find(m => m.id === id);
        if (!msg || !msg.base64) return;

        setTranscribing(id);
        try {
            const parts = msg.base64.split(',');
            const dataPrefix = parts[0];
            const base64Audio = parts[1];
            const mimeType = dataPrefix.split(':')[1].split(';')[0];

            // 呼叫 Gemini Audio-to-text
            const result = await transcribeAndPolishVoice(base64Audio, mimeType);
            
            updateTranscript(id, result.transcript, result.polished);
            setMessages(prev =>
                prev.map(m => m.id === id ? { ...m, transcribed: true, transcript: result.transcript, polished: result.polished } : m)
            );
            
            // 預設切換到散文模式
            setViewMode(prev => ({ ...prev, [id]: 'polished' }));
            showToast('語音轉譯完成！', 'success');
        } catch (error) {
            console.error('轉譯失敗:', error);
            showToast('抱歉，轉譯過程中發生錯誤。請確認是否已設定 AI 授權。', 'error');
        } finally {
            setTranscribing(null);
        }
    };

    const handleEdit = (id, polishedText) => {
        setEditingId(id);
        setEditPolished(polishedText || '');
    };

    const handleSaveEdit = (id) => {
        const msg = messages.find(m => m.id === id);
        updateTranscript(id, msg.transcript, editPolished);
        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, polished: editPolished } : m)
        );
        setEditingId(null);
    };

    const handlePublishStory = async (msg) => {
        hapticService.tap();
        try {
            const storyData = {
                title: `${msg.from} 的語音散文`,
                content: msg.polished || msg.transcript,
                category: msg.category || 'default',
                photos: [],
                status: 'published',
                is_ai_generated: true,
                occurred_at: msg.date,
                // 特殊標示：這是由語音產生的故事
                hasAudio: true, 
                audioId: msg.id
            };
            await saveStory(storyData);
            hapticService.success();
            setShowSuccessGlow(true);
            setTimeout(() => {
                navigate('/timeline');
            }, 1200);
        } catch (e) {
            console.error(e);
            showToast('發布失敗', 'error');
        }
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
                            <div className="mt-4">
                                {/* 切換分頁 UI */}
                                <div className="flex gap-2 mb-3 bg-black/5 dark:bg-white/5 p-1 rounded-lg w-max">
                                    <button 
                                        onClick={() => setViewMode(prev => ({ ...prev, [msg.id]: 'transcript' }))}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${viewMode[msg.id] !== 'polished' ? 'bg-white dark:bg-surface-light text-primary shadow-sm' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
                                    >
                                        原音逐字
                                    </button>
                                    <button 
                                        onClick={() => setViewMode(prev => ({ ...prev, [msg.id]: 'polished' }))}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${viewMode[msg.id] === 'polished' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
                                    >
                                        ✨ 優美散文
                                    </button>
                                </div>

                                {viewMode[msg.id] === 'polished' && editingId === msg.id ? (
                                    <div className="space-y-2 relative animate-in fade-in zoom-in-95 duration-200">
                                        <textarea
                                            value={editPolished}
                                            onChange={(e) => setEditPolished(e.target.value)}
                                            className="w-full p-3 bg-background-light dark:bg-background-dark rounded-xl text-sm border-2 border-primary focus:outline-none resize-none min-h-[120px] shadow-sm leading-relaxed"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingId(null)} className="text-xs text-text-secondary-light dark:text-text-secondary-dark px-4 py-2 rounded-lg hover:bg-black/5">取消</button>
                                            <button onClick={() => handleSaveEdit(msg.id)} className="text-xs text-white bg-primary font-bold px-4 py-2 rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">儲存修改</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="flex items-start gap-2 bg-background-light dark:bg-background-dark p-3 rounded-xl border border-primary/10">
                                            <p className="text-sm text-text-primary-light dark:text-text-primary-dark leading-relaxed flex-1 whitespace-pre-wrap">
                                                {viewMode[msg.id] === 'polished' ? (msg.polished || msg.transcript) : msg.transcript}
                                            </p>
                                            
                                            {viewMode[msg.id] === 'polished' && (
                                                <button onClick={() => handleEdit(msg.id, msg.polished || msg.transcript)} className="px-2 py-1 rounded-md hover:bg-primary/10 text-primary shrink-0 transition-colors" title="編輯散文">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                            )}
                                        </div>
                                        
                                        {/* 發布按鈕 */}
                                        {viewMode[msg.id] === 'polished' && (
                                            <div className="flex justify-end mt-3">
                                                <button 
                                                    onClick={() => handlePublishStory(msg)}
                                                    className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                                                    發布至時光軸
                                                </button>
                                            </div>
                                        )}
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

            {/* 保存成功光暈特效 */}
            {showSuccessGlow && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                    <div className="relative w-40 h-40 bg-white dark:bg-surface-dark rounded-full shadow-[0_0_100px_rgba(244,192,37,1)] flex flex-col items-center justify-center animate-in zoom-in spin-in-12 duration-500">
                        <span className="material-symbols-outlined text-5xl text-primary animate-pulse mb-1">auto_awesome</span>
                        <span className="text-primary font-bold text-sm tracking-widest">發布成功</span>
                    </div>
                </div>
            )}
        </WeavingLayout>
    );
};

export default VoiceTranscript;
