import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingSphere from '../../components/weaving/WeavingSphere';

/* ══════════════════════════════════════
   狀態機定義
   ══════════════════════════════════════ */
const STATES = {
    idle:      { label: '我在這裡，隨時準備傾聽你。',     emotion: 'calm' },
    listening: { label: '我正在聽，請告訴我更多你的想法。', emotion: 'calm' },
    thinking:  { label: '讓我想一下…',                   emotion: 'calm' },
    responding:{ label: '織光正在說話…',                  emotion: 'joy'  },
};

/* ══════════════════════════════════════
   聲音波紋 Canvas
   ══════════════════════════════════════ */
function VoiceWave({ active, color = '#e8a84a' }) {
    const cvs = useRef(null);
    const raf = useRef(null);
    const ph  = useRef(0);

    useEffect(() => {
        const canvas = cvs.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            ph.current += active ? 0.08 : 0.02;

            const amp   = active ? 18 : 4;
            const lines = 3;

            for (let l = 0; l < lines; l++) {
                const alpha = (0.55 - l * 0.15) * (active ? 1 : 0.4);
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth   = 2 - l * 0.5;
                ctx.globalAlpha = alpha;

                for (let x = 0; x <= W; x += 2) {
                    const nx  = x / W;
                    const y   = H / 2 +
                        Math.sin(nx * Math.PI * (4 + l) + ph.current + l * 1.2) *
                        amp * Math.sin(nx * Math.PI) * (1 - l * 0.25);
                    l === 0 && x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            raf.current = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf.current);
    }, [active, color]);

    return (
        <canvas
            ref={cvs}
            width={280}
            height={52}
            style={{ display: 'block', width: '100%', maxWidth: 280, height: 52 }}
        />
    );
}

/* ══════════════════════════════════════
   主頁面
   ══════════════════════════════════════ */
export default function SphereScreen() {
    const navigate = useNavigate();
    const [appState, setAppState] = useState('idle');   // idle | listening | thinking | responding
    const [emotion, setEmotion]   = useState('calm');
    const [inputMode, setInputMode] = useState('voice'); // voice | text
    const [textInput, setTextInput] = useState('');
    const [messages, setMessages]   = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const stateInfo = STATES[appState] || STATES.idle;
    const sphereSize = Math.min(window.innerWidth * 0.82, 340);

    /* 模擬對話 Demo */
    const handleSend = useCallback((text) => {
        if (!text.trim()) return;
        setMessages(m => [...m, { role: 'user', text }]);
        setTextInput('');
        setAppState('thinking');

        setTimeout(() => {
            setAppState('responding');
            setMessages(m => [...m, {
                role: 'ai',
                text: '我在這裡。\n想跟我說說是什麼讓你覺得累嗎？',
            }]);
            setTimeout(() => setAppState('idle'), 3500);
        }, 1800);
    }, []);

    const toggleRecord = useCallback(() => {
        if (isRecording) {
            setIsRecording(false);
            setAppState('thinking');
            setTimeout(() => {
                setAppState('responding');
                setTimeout(() => setAppState('idle'), 3000);
            }, 1600);
        } else {
            setIsRecording(true);
            setAppState('listening');
        }
    }, [isRecording]);

    /* 背景色跟隨情緒 */
    const bgColor = {
        calm:    '#130c02',
        joy:     '#141000',
        sadness: '#030610',
        angry:   '#120200',
        anxious: '#070412',
    }[emotion] || '#130c02';

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: bgColor,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            transition: 'background 1.8s ease',
            overflow: 'hidden',
            fontFamily: "'Noto Sans TC', 'PingFang TC', sans-serif",
            zIndex: 0,
        }}>
            {/* ── 環境粒子背景 ── */}
            <AmbientParticles color="#c87820" />

            {/* ── 頂部：返回 + Logo ── */}
            <header style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', position: 'relative',
                padding: '52px 24px 0', zIndex: 10, flexShrink: 0,
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        position: 'absolute', left: 20, top: 52,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 999, width: 38, height: 38,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back_ios</span>
                </button>

                {/* Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        width: 54, height: 54, borderRadius: 14,
                        background: 'linear-gradient(135deg, #c87820 0%, #f0a030 50%, #a05010 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 24px rgba(200,120,32,0.55), 0 0 8px rgba(200,120,32,0.8)',
                        fontSize: 22, fontWeight: 900, color: '#fff',
                        letterSpacing: '-0.5px',
                        border: '1px solid rgba(255,180,60,0.4)',
                    }}>
                        織光
                    </div>
                    <span style={{
                        color: 'rgba(255,255,255,0.55)', fontSize: 12,
                        letterSpacing: '0.18em', fontWeight: 400,
                    }}>Sphere</span>
                </div>

                {/* 情緒選擇器 */}
                <div style={{
                    position: 'absolute', right: 20, top: 52,
                    display: 'flex', gap: 6,
                }}>
                    {[
                        { key: 'calm',    emoji: '😌' },
                        { key: 'joy',     emoji: '😊' },
                        { key: 'sadness', emoji: '😔' },
                        { key: 'anxious', emoji: '😰' },
                    ].map(({ key, emoji }) => (
                        <button
                            key={key}
                            onClick={() => setEmotion(key)}
                            style={{
                                width: 32, height: 32, borderRadius: 999, fontSize: 16,
                                border: emotion === key
                                    ? '2px solid rgba(255,180,60,0.8)'
                                    : '2px solid rgba(255,255,255,0.08)',
                                background: emotion === key
                                    ? 'rgba(200,120,32,0.25)'
                                    : 'rgba(255,255,255,0.06)',
                                cursor: 'pointer', transition: 'all 0.3s',
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </header>

            {/* ── 中央：光球 ── */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', position: 'relative', zIndex: 5,
            }}>
                <WeavingSphere
                    emotion={emotion}
                    mode="voice"
                    isThinking={appState === 'thinking'}
                    isSpeaking={appState === 'responding'}
                    isListening={appState === 'listening'}
                    statusText={stateInfo.label}
                    size={sphereSize}
                />
            </div>

            {/* ── 底部：狀態文字 + 波紋 + 輸入 ── */}
            <footer style={{
                width: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 0, padding: '0 24px',
                paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
                zIndex: 10, flexShrink: 0,
            }}>
                {/* 聲音波紋 */}
                <div style={{ marginBottom: 24, opacity: appState !== 'idle' ? 1 : 0.35, transition: 'opacity 0.5s' }}>
                    <VoiceWave active={appState === 'listening' || appState === 'responding'} />
                </div>

                {/* 輸入切換 + 操作區 */}
                <div style={{ width: '100%', maxWidth: 380 }}>
                    {/* 模式切換 */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16,
                    }}>
                        {[
                            { key: 'voice', icon: 'mic',      label: '語音' },
                            { key: 'text',  icon: 'keyboard', label: '文字' },
                        ].map(({ key, icon, label }) => (
                            <button
                                key={key}
                                onClick={() => setInputMode(key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '7px 18px', borderRadius: 999,
                                    background: inputMode === key
                                        ? 'rgba(200,120,32,0.35)'
                                        : 'rgba(255,255,255,0.06)',
                                    border: inputMode === key
                                        ? '1px solid rgba(255,180,60,0.5)'
                                        : '1px solid rgba(255,255,255,0.10)',
                                    color: inputMode === key ? '#f0c060' : 'rgba(255,255,255,0.45)',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    backdropFilter: 'blur(12px)',
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* 語音模式 */}
                    {inputMode === 'voice' && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={toggleRecord}
                                style={{
                                    width: 72, height: 72, borderRadius: '50%',
                                    background: isRecording
                                        ? 'radial-gradient(circle, rgba(220,60,40,0.9) 0%, rgba(180,20,10,0.9) 100%)'
                                        : 'radial-gradient(circle, rgba(220,140,40,0.9) 0%, rgba(160,80,10,0.8) 100%)',
                                    border: isRecording
                                        ? '2px solid rgba(255,100,80,0.7)'
                                        : '2px solid rgba(255,180,60,0.5)',
                                    boxShadow: isRecording
                                        ? '0 0 32px rgba(220,60,40,0.6), 0 0 8px rgba(220,60,40,0.9)'
                                        : '0 0 28px rgba(200,120,32,0.5), 0 0 8px rgba(200,120,32,0.8)',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                    animation: isRecording ? 'spherePulseBtn 1.2s ease-in-out infinite' : 'none',
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 30, color: '#fff' }}>
                                    {isRecording ? 'stop' : 'mic'}
                                </span>
                            </button>
                            <style>{`
                                @keyframes spherePulseBtn {
                                    0%,100% { box-shadow: 0 0 28px rgba(220,60,40,0.5); }
                                    50%     { box-shadow: 0 0 48px rgba(220,60,40,0.9), 0 0 12px rgba(220,60,40,1); }
                                }
                            `}</style>
                        </div>
                    )}

                    {/* 文字模式 */}
                    {inputMode === 'text' && (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input
                                value={textInput}
                                onChange={e => setTextInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend(textInput)}
                                placeholder="告訴我你的想法…"
                                style={{
                                    flex: 1, background: 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(255,180,60,0.25)',
                                    borderRadius: 999, padding: '12px 20px',
                                    color: 'rgba(255,255,255,0.9)', fontSize: 15,
                                    outline: 'none', backdropFilter: 'blur(12px)',
                                    fontFamily: 'inherit',
                                }}
                            />
                            <button
                                onClick={() => handleSend(textInput)}
                                style={{
                                    width: 50, height: 50, borderRadius: '50%',
                                    background: 'rgba(200,120,32,0.7)',
                                    border: '1px solid rgba(255,180,60,0.4)',
                                    color: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 16px rgba(200,120,32,0.4)',
                                    transition: 'all 0.2s',
                                    flexShrink: 0,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
                            </button>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}

/* ══════════════════════════════════════
   環境粒子背景
   ══════════════════════════════════════ */
function AmbientParticles({ color }) {
    const cvs = useRef(null);
    useEffect(() => {
        const canvas = cvs.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const particles = Array.from({ length: 28 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: 0.5 + Math.random() * 1.8,
            vx: (Math.random() - 0.5) * 0.18,
            vy: -0.05 - Math.random() * 0.14,
            alpha: 0.08 + Math.random() * 0.22,
        }));

        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, [color]);

    return <canvas ref={cvs} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />;
}
