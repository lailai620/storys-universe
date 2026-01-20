import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [currentBgmType, setCurrentBgmType] = useState('space');
  const [hasInteracted, setHasInteracted] = useState(false);

  // 🎛️ Web Audio API Context
  const audioCtxRef = useRef(null);
  const bgmOscsRef = useRef([]); 
  const bgmGainRef = useRef(null);

  const soundConfig = useRef({
    // ✅ Space: 將 gain 設為 0，徹底移除低頻噪音，只保留互動音效
    space:  { freq1: 0, freq2: 0,  gain: 0.0, type: 'sine' }, 
    // Memoir: 溫暖的五度音 (C3 + G3)
    memoir: { freq1: 130.81, freq2: 196.00, gain: 0.02, type: 'sine' }, 
    // Novel: 神秘的小三度 (A2 + C3)
    novel:  { freq1: 110.00, freq2: 130.81, gain: 0.025, type: 'triangle' }, 
    // ✅ Kids: 改為高八度的大三度 (C5 + E5)，像清脆的八音盒/風鈴
    kids:   { freq1: 523.25, freq2: 659.25, gain: 0.01, type: 'sine' }, 
  });

  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtxRef.current = new AudioContext();

    return () => {
      stopBgm();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const stopBgm = () => {
    bgmOscsRef.current.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch(e){}
    });
    bgmOscsRef.current = [];
    if (bgmGainRef.current) {
        try {
            bgmGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
            setTimeout(() => {
                if (bgmGainRef.current) bgmGainRef.current.disconnect();
            }, 600);
        } catch(e) { bgmGainRef.current.disconnect(); }
    }
  };

  const synthesizeSound = useCallback((type) => {
    if (isMuted || !audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume().catch(() => {});
    if (audioCtxRef.current.state !== 'running') return;

    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1500;

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1); 
        osc.frequency.setValueAtTime(659.25, now + 0.2); 
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
    } else if (type === 'warp') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 1.5);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
        osc.start(now);
        osc.stop(now + 1.5);
    }
  }, [isMuted]);

  const playSynthesizedBgm = useCallback((type) => {
    if (!audioCtxRef.current || isMuted) return;

    const ctx = audioCtxRef.current;
    const config = soundConfig.current[type] || soundConfig.current['space'];

    stopBgm();

    // 如果 gain 是 0 (Space 模式)，就不啟動振盪器，直接返回
    if (config.gain === 0) {
        console.log(`🎵 Atmosphere Shift: ${type} (Silent)`);
        return;
    }

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0; 
    gainNode.connect(ctx.destination);
    bgmGainRef.current = gainNode;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();

    osc1.type = config.type || 'sine'; 
    osc2.type = config.type || 'sine';

    osc1.frequency.value = config.freq1;
    osc2.frequency.value = config.freq2;

    osc1.connect(gainNode);
    osc2.connect(gainNode);

    osc1.start();
    osc2.start();

    bgmOscsRef.current = [osc1, osc2];

    gainNode.gain.linearRampToValueAtTime(config.gain, ctx.currentTime + 4);

    console.log(`🎵 Atmosphere Shift: ${type}`);

  }, [isMuted]);

  useEffect(() => {
    const unlockAudio = () => {
      if (hasInteracted) return;
      setHasInteracted(true);
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
            if (!isMuted && currentBgmType) playSynthesizedBgm(currentBgmType);
        });
      }
    };
    window.addEventListener('click', unlockAudio);
    return () => window.removeEventListener('click', unlockAudio);
  }, [hasInteracted, currentBgmType, isMuted, playSynthesizedBgm]);

  useEffect(() => {
    if (isMuted) {
      if (bgmGainRef.current) bgmGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended' && hasInteracted) {
         audioCtxRef.current.resume();
      }
      if (bgmOscsRef.current.length === 0 && currentBgmType && hasInteracted) {
         playSynthesizedBgm(currentBgmType);
      }
      if (bgmGainRef.current && currentBgmType) {
         const config = soundConfig.current[currentBgmType];
         if (config.gain > 0) {
             bgmGainRef.current.gain.setTargetAtTime(config.gain, audioCtxRef.current.currentTime, 2);
         }
      }
    }
  }, [isMuted, currentBgmType, hasInteracted, playSynthesizedBgm]);

  const toggleMute = () => setIsMuted(prev => !prev);

  const changeBgm = useCallback((newType) => {
    if (newType === currentBgmType) return;
    setCurrentBgmType(newType);
    if (hasInteracted && !isMuted) {
        playSynthesizedBgm(newType);
    }
  }, [currentBgmType, hasInteracted, isMuted, playSynthesizedBgm]);

  const playHover = () => synthesizeSound('hover');
  const playClick = () => synthesizeSound('click');
  const playSuccess = () => synthesizeSound('success');
  const playWarp = () => synthesizeSound('warp');
  const initAudioEngine = () => { if (!hasInteracted) setHasInteracted(true); };

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, playHover, playClick, playSuccess, playWarp, initAudioEngine, changeBgm, currentBgmType }}>
      {children}
    </AudioContext.Provider>
  );
};