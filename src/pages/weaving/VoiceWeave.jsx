import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import {
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording as checkIsRecording,
    saveVoiceMessage,
    formatDuration,
} from '../../services/voiceService';

/** 🎙️ 悄悄話織入（錄音）*/
const VoiceWeave = () => {
    const navigate = useNavigate();
    const [recording, setRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);

    // 音量視覺化
    const animRef = useRef(null);
    const analyserRef = useRef(null);

    // 清理：離開頁面時取消錄音
    useEffect(() => {
        return () => {
            cancelRecording();
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, []);

    // 音量偵測動畫循環
    const updateLevel = useCallback(() => {
        if (analyserRef.current) {
            const data = new Uint8Array(analyserRef.current.fftSize);
            analyserRef.current.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128;
                sum += v * v;
            }
            setAudioLevel(Math.min(1, Math.sqrt(sum / data.length) * 3));
        }
        animRef.current = requestAnimationFrame(updateLevel);
    }, []);

    const handleToggleRecord = useCallback(async () => {
        if (recording) {
            // 停止錄音
            const result = await stopRecording();
            setRecording(false);
            if (animRef.current) cancelAnimationFrame(animRef.current);
            analyserRef.current = null;

            if (result) {
                try {
                    await saveVoiceMessage({
                        blob: result.blob,
                        duration: seconds,
                        from: '我',
                    });
                    setSaved(true);
                    setTimeout(() => navigate('/voice-listen'), 1500);
                } catch (e) {
                    setError('儲存失敗，請重試');
                }
            }
        } else {
            // 開始錄音
            setError('');
            setSaved(false);
            setSeconds(0);

            const success = await startRecording((s) => setSeconds(s));
            if (success) {
                setRecording(true);
                // 嘗試建立 AnalyserNode 來偵測音量
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const ctx = new AudioContext();
                    const source = ctx.createMediaStreamSource(stream);
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);
                    analyserRef.current = analyser;
                    updateLevel();
                } catch {
                    // 音量偵測非必要，錄音仍繼續
                }
            } else {
                setError('無法存取麥克風，請檢查權限設定');
            }
        }
    }, [recording, seconds, navigate, updateLevel]);

    // 波紋環的大小根據音量
    const ringScale = 1 + audioLevel * 0.5;

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <button onClick={() => { cancelRecording(); navigate(-1); }} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-base font-bold font-display">悄悄話織入</h1>
                <div className="w-10" />
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
                {/* 標題區 */}
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold mb-3">為重要的人留下一段話</h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                        按下麥克風，讓聲音成為最溫暖的禮物
                    </p>
                </div>

                {/* 錄音按鈕 */}
                <div className="relative mb-8">
                    {/* 外圈波紋 */}
                    {recording && (
                        <>
                            <div
                                className="absolute inset-0 -m-6 rounded-full bg-primary/10 transition-transform duration-150"
                                style={{ transform: `scale(${ringScale + 0.2})` }}
                            />
                            <div
                                className="absolute inset-0 -m-3 rounded-full bg-primary/15 transition-transform duration-150"
                                style={{ transform: `scale(${ringScale})` }}
                            />
                        </>
                    )}
                    <button
                        onClick={handleToggleRecord}
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${recording
                            ? 'bg-danger text-white shadow-danger/30 scale-110'
                            : 'bg-primary text-primary-foreground shadow-primary/30 hover:scale-105'
                            }`}
                    >
                        <span className="material-symbols-outlined text-4xl">
                            {recording ? 'stop' : 'mic'}
                        </span>
                    </button>
                </div>

                {/* 計時器 */}
                <p className="text-3xl font-mono font-bold text-primary mb-2">
                    {formatDuration(seconds)}
                </p>

                {/* 狀態文字 */}
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    {saved ? '✅ 已儲存！正在跳轉...' : recording ? '錄音中... 再按一次停止' : '準備就緒'}
                </p>

                {/* 錯誤訊息 */}
                {error && (
                    <div className="bg-danger/10 text-danger text-sm px-4 py-2 rounded-lg">
                        {error}
                    </div>
                )}

                {/* 音量條（錄音時顯示）*/}
                {recording && (
                    <div className="flex gap-1 items-end h-12 mt-4">
                        {[0.3, 0.5, 0.7, 1, 0.8, 0.4, 0.6, 0.9, 0.5, 0.3].map((base, i) => (
                            <div
                                key={i}
                                className="w-1.5 rounded-full bg-primary transition-all duration-150"
                                style={{ height: `${Math.max(8, audioLevel * base * 48)}px`, opacity: 0.4 + audioLevel * 0.6 }}
                            />
                        ))}
                    </div>
                )}
            </main>
        </WeavingLayout>
    );
};

export default VoiceWeave;
