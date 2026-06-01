import React, { useEffect, useState, useRef } from 'react';
import { VoiceProvider, useVoice } from '@humeai/voice-react';

const HumeVoiceWidgetContent = ({ onMessageReceived, onClose }) => {
    const { connect, disconnect, status, messages, isPlayingAudio, isMuted, mute, unmute } = useVoice();
    const [transcript, setTranscript] = useState('');
    const lastMessageRef = useRef(null);

    // 自動連接
    useEffect(() => {
        connect()
            .then(() => console.log('Hume EVI 已連接'))
            .catch(err => console.error('Hume 連接失敗:', err));

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // 監聽訊息
    useEffect(() => {
        if (messages.length === 0) return;
        
        // 為了支援 streaming 更新（同一句話在輸入時 id 相同但 content 增加）
        // 我們直接將最新收到的完整陣列中最後一筆，或是整個對應的增量變更送給外層
        const lastMsg = messages[messages.length - 1];
        
        if (lastMsg.type === 'user_message') {
            const text = lastMsg.message?.content;
            if (text) {
                onMessageReceived({ id: lastMsg.id, role: 'user', text });
            }
        } else if (lastMsg.type === 'assistant_message') {
            const text = lastMsg.message?.content;
            if (text) {
                onMessageReceived({ id: lastMsg.id, role: 'ai', text });
            }
        }
    }, [messages, onMessageReceived]);

    const isConnected = status.value === 'connected';
    const isAssistantSpeaking = isPlayingAudio;
    const isUserSpeaking = isConnected && !isAssistantSpeaking; // 簡化判斷

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
            {/* 關閉按鈕 */}
            <button 
                onClick={onClose}
                className="absolute top-4 left-4 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
                <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="text-xl font-bold font-display mb-2">
                {isConnected ? '溫柔採訪者' : '正在連線中...'}
            </h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-12">
                {isConnected ? (isAssistantSpeaking ? 'AI 正在說話...' : '請說，我在聽...') : '準備中...'}
            </p>

            {/* 聲波動畫區域 */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-12">
                {/* 裝飾性光暈 */}
                <div className={`absolute inset-0 rounded-full transition-all duration-700 blur-2xl opacity-50 ${isAssistantSpeaking ? 'bg-primary scale-125' : (isConnected ? 'bg-success scale-100' : 'bg-warning scale-90')}`} />
                
                {/* 中心圓 */}
                <div className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${isAssistantSpeaking ? 'bg-primary scale-110 shadow-primary/50' : (isConnected ? 'bg-surface-light dark:bg-surface-dark border-4 border-primary scale-100' : 'bg-surface-light dark:bg-surface-dark border border-warning scale-95')}`}>
                    <span className={`material-symbols-outlined text-5xl transition-colors duration-300 ${isAssistantSpeaking ? 'text-white' : (isConnected ? 'text-primary' : 'text-warning')}`}>
                        {isAssistantSpeaking ? 'auto_awesome' : 'mic'}
                    </span>
                </div>

                {/* 擴散波紋 */}
                {isConnected && (
                    <>
                        <div className={`absolute inset-0 rounded-full border-2 border-primary/30 animate-ping`} style={{ animationDuration: isAssistantSpeaking ? '1s' : '2s' }} />
                        <div className={`absolute inset-0 rounded-full border-2 border-primary/20 animate-ping delay-150`} style={{ animationDuration: isAssistantSpeaking ? '1.2s' : '2.5s' }} />
                    </>
                )}
            </div>

            {/* 底部控制區 */}
            <div className="flex gap-6">
                <button 
                    onClick={() => isMuted ? unmute() : mute()}
                    className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-error text-white' : 'bg-black/5 dark:bg-white/5 text-primary'}`}
                >
                    <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
                </button>
                <button 
                    onClick={onClose}
                    className="p-4 rounded-full bg-error text-white hover:bg-error/90 transition-colors shadow-lg shadow-error/30"
                >
                    <span className="material-symbols-outlined">call_end</span>
                </button>
            </div>
        </div>
    );
};

export const HumeVoiceWidget = ({ accessToken, configId, onMessageReceived, onClose }) => {
    if (!accessToken) return null;

    return (
        <VoiceProvider
            auth={{ type: 'accessToken', value: accessToken }}
            configId={configId}
        >
            <HumeVoiceWidgetContent onMessageReceived={onMessageReceived} onClose={onClose} />
        </VoiceProvider>
    );
};
