import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════
   情緒配置表 — 每種情緒對應獨立的色彩、速度、光度
   ═══════════════════════════════════════════════════════════════ */
const ECFG = {
    calm:    { r:1.00, g:0.62, b:0.14, spd:0.55, ity:0.72, bg:'#130c02', label:'我在這裡，請告訴我更多你的想法。' },
    joy:     { r:1.00, g:0.72, b:0.16, spd:1.40, ity:0.90, bg:'#150f00', label:'感受到你的喜悅！真的很棒。' },
    sadness: { r:0.42, g:0.62, b:1.00, spd:0.22, ity:0.42, bg:'#030610', label:'我陪在你身邊，不用一個人面對。' },
    angry:   { r:1.00, g:0.32, b:0.06, spd:2.40, ity:0.92, bg:'#120200', label:'我完全理解你的感受。' },
    anxious: { r:0.72, g:0.58, b:1.00, spd:1.05, ity:0.58, bg:'#070412', label:'深呼吸，慢慢來，我在這裡。' },
};

/* ═══════════════════════════════════════════════════════════════
   粒子臉部系統 — 球面投影座標
   ═══════════════════════════════════════════════════════════════ */
function proj(x, y) {
    const z2 = 1 - x * x - y * y;
    return [x, y, z2 > 0.001 ? Math.sqrt(z2) * 0.975 : -5];
}
function arc(cx, cy, rx, ry, a0, a1, n, arr) {
    for (let k = 0; k < n; k++) {
        const a = a0 + (k / Math.max(n - 1, 1)) * (a1 - a0);
        const [x, y, z] = proj(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
        arr.push(x, y, z);
    }
}
function hide(n, arr) { for (let k = 0; k < n; k++) arr.push(0, 0, -5); }

const FACE_STATES = {};
['calm','joy','sadness','angry','anxious'].forEach(em => {
    const p = [];
    switch (em) {
        case 'calm': case 'joy':
            // 左眼 — 弓形（閉眼微笑）
            arc(-0.255, 0.12, 0.115, 0.048, 0.1, Math.PI - 0.1, 12, p);
            // 右眼 — 弓形
            arc( 0.255, 0.12, 0.115, 0.048, 0.1, Math.PI - 0.1, 12, p);
            // 嘴 — 大弧微笑
            arc(0, -0.08, 0.195, 0.095, 0.12, Math.PI - 0.12, 20, p);
            // 左腮紅
            arc(-0.375, 0.01, 0.048, 0.024, 0, Math.PI * 2, 6, p);
            // 右腮紅
            arc( 0.375, 0.01, 0.048, 0.024, 0, Math.PI * 2, 6, p);
            break;
        case 'sadness':
            arc(-0.255, 0.14, 0.095, 0.095, 0, Math.PI * 2, 12, p);
            arc( 0.255, 0.14, 0.095, 0.095, 0, Math.PI * 2, 12, p);
            arc(0, -0.05, 0.165, 0.075, Math.PI + 0.25, Math.PI * 2 - 0.25, 20, p);
            hide(12, p);
            break;
        case 'angry':
            arc(-0.255, 0.15, 0.115, 0.025, 0.1, Math.PI - 0.1, 12, p);
            arc( 0.255, 0.15, 0.115, 0.025, 0.1, Math.PI - 0.1, 12, p);
            arc(0, -0.10, 0.145, 0.035, 0.2, Math.PI - 0.2, 20, p);
            hide(12, p);
            break;
        case 'anxious':
            arc(-0.255, 0.14, 0.095, 0.095, 0, Math.PI * 2, 12, p);
            arc( 0.255, 0.14, 0.095, 0.095, 0, Math.PI * 2, 12, p);
            arc(0, -0.09, 0.085, 0.085, 0, Math.PI * 2, 20, p);
            hide(12, p);
            break;
        default:
            hide(56, p);
    }
    while (p.length < 168) p.push(0, 0, -5);
    FACE_STATES[em] = new Float32Array(p.slice(0, 168));
});

/* ═══════════════════════════════════════════════════════════════
   大圓弧流光帶路徑生成
   ═══════════════════════════════════════════════════════════════ */
function greatArcPts(R, n, arcLen) {
    const ax = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    const pe = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    pe.sub(ax.clone().multiplyScalar(pe.dot(ax))).normalize();
    const cr = ax.clone().cross(pe).normalize();
    const s0 = Math.random() * Math.PI * 2;
    return Array.from({ length: n + 1 }, (_, i) => {
        const a = s0 + (i / n) * arcLen;
        return pe.clone().multiplyScalar(Math.cos(a)).add(cr.clone().multiplyScalar(Math.sin(a))).multiplyScalar(R);
    });
}

/* ═══════════════════════════════════════════════════════════════
   圓形粒子貼圖
   ═══════════════════════════════════════════════════════════════ */
function makeSpriteTex() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const cx = c.getContext('2d');
    const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,    'rgba(255,255,255,1.0)');
    g.addColorStop(0.30, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.65, 'rgba(255,255,255,0.3)');
    g.addColorStop(1.0,  'rgba(255,255,255,0.0)');
    cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}

/* ═══════════════════════════════════════════════════════════════
   核心 GLSL Shader — 球體邊緣光（Fresnel Rim）
   ═══════════════════════════════════════════════════════════════ */
const RIM_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
}`;
const RIM_FRAG = `
uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    float f = 1.0 - clamp(dot(normalize(vViewDir), vNormal), 0.0, 1.0);
    float rim = pow(f, 2.8) * 0.72;
    float glow = pow(f, 1.4) * 0.28;
    float total = rim + glow;
    gl_FragColor = vec4(uColor * total, total * uIntensity * 0.65);
}`;

/* ═══════════════════════════════════════════════════════════════
   核心 GLSL Shader — 球體內部體積光（Core Volume）
   ═══════════════════════════════════════════════════════════════ */
const CORE_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
}`;
const CORE_FRAG = `
uniform vec3 uColor;
uniform float uTime;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    float ndv = clamp(dot(normalize(vViewDir), vNormal), 0.0, 1.0);
    // 中心核心輝光
    float core = pow(ndv, 3.5) * 0.55;
    // 邊緣輕薄光
    float edge = pow(1.0 - ndv, 2.2) * 0.18;
    // 呼吸波動
    float breath = 0.92 + 0.08 * sin(uTime * 1.2);
    float total = (core + edge) * breath * uIntensity;
    gl_FragColor = vec4(uColor * total, total * 0.72);
}`;

/* ═══════════════════════════════════════════════════════════════
   THREE.js 場景建立
   ═══════════════════════════════════════════════════════════════ */
function buildScene(canvas) {
    const renderer = new THREE.WebGLRenderer({
        canvas, alpha: true, antialias: true,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 5.2;

    /* ── 1. 核心內發光球體（Core Volume Light）── */
    const coreMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        uniforms: {
            uColor: { value: new THREE.Color(1, 0.62, 0.14) },
            uTime:  { value: 0 },
            uIntensity: { value: 0.72 },
        },
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
    });
    const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.98, 64, 64), coreMat);
    scene.add(coreMesh);

    /* ── 2. 邊緣 Fresnel Rim 光（BackSide — 更大半徑）── */
    const rimMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        uniforms: {
            uColor: { value: new THREE.Color(1, 0.62, 0.14) },
            uIntensity: { value: 0.72 },
        },
        vertexShader: RIM_VERT,
        fragmentShader: RIM_FRAG,
    });
    const rimMesh = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 64), rimMat);
    scene.add(rimMesh);

    /* ── 3. 流光帶（TubeGeometry × 11條）── */
    const tubes = [];
    const tubeCount = 11;
    for (let i = 0; i < tubeCount; i++) {
        const arcLen = (0.65 + Math.random() * 1.35) * Math.PI;
        const pts = greatArcPts(1.015, 80, arcLen);
        const curve = new THREE.CatmullRomCurve3(pts);
        const radius = 0.009 + Math.random() * 0.013;
        const geo = new THREE.TubeGeometry(curve, 100, radius, 7, false);
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 0.65, 0.20),
            transparent: true,
            opacity: 0.10 + Math.random() * 0.28,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = {
            axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
            speed: (0.025 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1),
            baseOpacity: 0.10 + Math.random() * 0.28,
            phaseOffset: Math.random() * Math.PI * 2,
        };
        scene.add(mesh);
        tubes.push(mesh);
    }

    /* ── 4. 粒子臉部系統 ── */
    const spriteTex = makeSpriteTex();
    const facePts = FACE_STATES.calm.slice();
    const faceGeo = new THREE.BufferGeometry();
    faceGeo.setAttribute('position', new THREE.Float32BufferAttribute(facePts, 3));
    const faceMat = new THREE.PointsMaterial({
        map: spriteTex, size: 0.096, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        color: new THREE.Color(1, 0.85, 0.45),
    });
    const facePoints = new THREE.Points(faceGeo, faceMat);
    scene.add(facePoints);

    /* ── 5. 背景環境波浪光線 ── */
    const bgWaves = [];
    for (let i = 0; i < 8; i++) {
        const wPts = [];
        const yBase = -3.5 + i * 0.95;
        const freq = 0.48 + i * 0.06;
        const amp = 0.28 + i * 0.045;
        for (let x = -8; x <= 8; x += 0.08)
            wPts.push(new THREE.Vector3(x, yBase + Math.sin(x * freq + i) * amp, -3.2));
        const wGeo = new THREE.BufferGeometry().setFromPoints(wPts);
        const wMat = new THREE.LineBasicMaterial({
            color: new THREE.Color(1, 0.62, 0.18),
            transparent: true,
            opacity: 0.014 + i * 0.005,
            blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const line = new THREE.Line(wGeo, wMat);
        line.userData = {
            speed: 0.028 + i * 0.010,
            phase: i * Math.PI / 4,
            baseOpacity: 0.014 + i * 0.005,
        };
        scene.add(line);
        bgWaves.push(line);
    }

    return { renderer, scene, camera, coreMat, rimMat, tubes, facePoints, faceGeo, faceMat, bgWaves };
}

const lerp = (a, b, t) => a + (b - a) * t;

/* ═══════════════════════════════════════════════════════════════
   主組件 WeavingSphere
   ═══════════════════════════════════════════════════════════════ */
export default function WeavingSphere({
    emotion = 'calm',
    mode = 'text',
    isThinking = false,
    isSpeaking = false,
    isListening = false,
    onToggleMode,
    statusText = '',
    size,             // 覆寫尺寸（px）
}) {
    const isFS = mode === 'voice';
    const cfg = ECFG[emotion] || ECFG.calm;
    const canvasRef = useRef(null);
    const sceneRef  = useRef(null);
    const emoRef    = useRef(cfg);
    const faceRef   = useRef({ cur: FACE_STATES.calm.slice(), tgt: FACE_STATES.calm });
    const stateRef  = useRef({ isThinking, isSpeaking, isListening });

    useEffect(() => {
        emoRef.current = ECFG[emotion] || ECFG.calm;
        faceRef.current.tgt = FACE_STATES[emotion] || FACE_STATES.calm;
    }, [emotion]);

    useEffect(() => {
        stateRef.current = { isThinking, isSpeaking, isListening };
    }, [isThinking, isSpeaking, isListening]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const {
            renderer, scene, camera,
            coreMat, rimMat, tubes,
            facePoints, faceGeo, faceMat, bgWaves,
        } = buildScene(canvasRef.current);
        sceneRef.current = { renderer, scene, camera };

        /* 尺寸響應 */
        const resize = () => {
            const p = canvasRef.current?.parentElement;
            if (!p) return;
            const s = Math.min(p.clientWidth, p.clientHeight);
            renderer.setSize(s, s, false);
        };
        resize();
        const ro = new ResizeObserver(resize);
        if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);

        let rafId;
        const clock = new THREE.Clock();
        const currentColor = new THREE.Color();
        const currentIntensity = { v: 0.72 };
        let talkPhase = 0;

        const tick = () => {
            rafId = requestAnimationFrame(tick);
            const t = clock.getElapsedTime();
            const ec = emoRef.current;
            const st = stateRef.current;
            const spd = ec.spd;

            /* 顏色 & 強度插值 */
            currentColor.lerp(new THREE.Color(ec.r, ec.g, ec.b), 0.022);
            currentIntensity.v = lerp(currentIntensity.v, ec.ity, 0.022);

            const ci = currentIntensity.v;

            /* 核心球體 */
            coreMat.uniforms.uColor.value.copy(currentColor);
            coreMat.uniforms.uTime.value = t;
            coreMat.uniforms.uIntensity.value = ci;

            /* 邊緣 Rim */
            rimMat.uniforms.uColor.value.copy(currentColor);
            rimMat.uniforms.uIntensity.value = ci;

            /* 流光帶 */
            const tubeColor = currentColor.clone().multiplyScalar(2.4);
            tubes.forEach((mesh, i) => {
                mesh.rotateOnAxis(mesh.userData.axis, mesh.userData.speed * spd * 0.016);
                mesh.material.color.copy(tubeColor);
                const pulse = 0.55 + 0.30 * Math.sin(t * 0.65 + mesh.userData.phaseOffset);
                mesh.material.opacity = mesh.userData.baseOpacity * ci * pulse;
                // 思考時收縮、傾聽時微放大
                if (st.isThinking) {
                    const s = 1 + 0.025 * Math.sin(t * 3.8 + i * 0.5);
                    mesh.scale.setScalar(s);
                } else if (st.isListening) {
                    const s = 1 + 0.012 * Math.sin(t * 2.2 + i * 0.8);
                    mesh.scale.setScalar(s);
                } else {
                    mesh.scale.setScalar(1);
                }
            });

            /* 背景波浪 */
            bgWaves.forEach(w => {
                w.position.x = Math.sin(t * w.userData.speed + w.userData.phase) * 0.9;
                w.material.color.copy(currentColor);
                w.material.opacity = w.userData.baseOpacity * ci * 0.85;
            });

            /* 粒子臉部插值 */
            const fc = faceRef.current;
            let dirty = false;
            for (let i = 0; i < 168; i++) {
                const nv = lerp(fc.cur[i], fc.tgt[i], 0.06);
                if (Math.abs(nv - fc.cur[i]) > 0.0005) { fc.cur[i] = nv; dirty = true; }
            }
            if (dirty) {
                faceGeo.attributes.position.array.set(fc.cur);
                faceGeo.attributes.position.needsUpdate = true;
            }

            /* 說話時嘴巴微抖 */
            if (st.isSpeaking) {
                talkPhase += 0.22;
                const pos = faceGeo.attributes.position;
                // 嘴巴是第25~44個點（y偏移）
                for (let i = 24; i < 44; i++) {
                    const base = fc.cur[i * 3 + 1];
                    pos.setY(i, base + Math.sin(talkPhase + i * 0.7) * 0.012);
                }
                pos.needsUpdate = true;
            }

            /* 臉部粒子顏色 */
            faceMat.color.copy(currentColor.clone().multiplyScalar(2.2));
            faceMat.opacity = 0.94 * ci + 0.06;

            renderer.render(scene, camera);
        };
        tick();

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            renderer.dispose();
        };
    }, []);

    /* ── 外部 CSS drop-shadow 模擬 Bloom ── */
    const sz = size || (isFS
        ? Math.min(window.innerWidth * 0.82, 420)
        : Math.min(window.innerWidth * 0.62, 260));
    const rr = Math.round(cfg.r * 255), rg = Math.round(cfg.g * 255), rb = Math.round(cfg.b * 255);
    const rgb = `${rr},${rg},${rb}`;
    const bloom = [
        `drop-shadow(0 0 ${sz * 0.022}px rgba(${rgb},0.95))`,
        `drop-shadow(0 0 ${sz * 0.070}px rgba(${rgb},0.60))`,
        `drop-shadow(0 0 ${sz * 0.180}px rgba(${rgb},0.28))`,
        `drop-shadow(0 0 ${sz * 0.400}px rgba(${rgb},0.10))`,
    ].join(' ');

    return (
        <div style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', width: '100%',
            flex: isFS ? 1 : undefined,
            padding: isFS ? 0 : '18px 0 12px',
            overflow: 'hidden',
            transition: 'background 1.8s ease',
            ...(isFS ? { background: cfg.bg, minHeight: '100%' } : {}),
        }}>
            {/* 模式切換按鈕 */}
            {onToggleMode && (
                <button
                    onClick={onToggleMode}
                    style={{
                        position: 'absolute', top: 14, right: 14, zIndex: 30,
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,255,255,0.10)',
                        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                        border: '1px solid rgba(255,255,255,0.20)',
                        color: isFS ? '#fff' : 'inherit',
                        borderRadius: 999, padding: '7px 16px',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        letterSpacing: '.04em',
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        {isFS ? 'fullscreen_exit' : 'fullscreen'}
                    </span>
                    {isFS ? '切換文字模式' : '切換全螢幕'}
                </button>
            )}

            {/* 光球容器 — 加大範圍以容納 Bloom 光暈 */}
            <div style={{
                position: 'relative', width: sz, height: sz, flexShrink: 0,
                animation: 'wsSphereFloat 5.2s ease-in-out infinite',
            }}>
                <style>{`
                    @keyframes wsSphereFloat {
                        0%,100% { transform: translateY(0px); }
                        48%     { transform: translateY(-13px); }
                    }
                    @keyframes wsSphereShake {
                        0%,100% { transform: translateX(0); }
                        25%     { transform: translateX(-2px); }
                        75%     { transform: translateX(2px); }
                    }
                `}</style>
                <div style={{
                    position: 'absolute', inset: '-30%',
                    filter: bloom, pointerEvents: 'none',
                }}>
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
            </div>

            {/* 全螢幕狀態文字 */}
            {isFS && (
                <div style={{ marginTop: 52, textAlign: 'center', padding: '0 32px', zIndex: 2 }}>
                    <p style={{
                        color: 'rgba(255,255,255,0.90)', fontSize: 17,
                        fontWeight: 400, letterSpacing: '.08em',
                        lineHeight: 1.65,
                        textShadow: `0 0 32px rgba(${rgb},0.85), 0 0 8px rgba(${rgb},0.5)`,
                        transition: 'all 0.6s ease',
                    }}>
                        {isThinking ? '讓我想一下...' : isSpeaking ? '織光正在說話...' : isListening ? '我正在聽，請繼續說...' : statusText || cfg.label}
                    </p>
                </div>
            )}

            {/* 文字模式狀態標籤 */}
            {!isFS && (
                <p style={{
                    marginTop: 10, fontSize: 13, opacity: 0.52,
                    fontWeight: 500, letterSpacing: '.04em',
                    transition: 'all 0.5s ease',
                }}>
                    {isThinking ? '思考中...' : isSpeaking ? '說話中...' : isListening ? '我在聽...' : cfg.label.slice(0, 14) + '…'}
                </p>
            )}
        </div>
    );
}
