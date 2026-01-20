import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const AudioContext = createContext(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const bgmRef = useRef(null);

  const playHover = useCallback(() => {
    // 預留音效接口
  }, []);

  const playClick = useCallback(() => {
    // 預留音效接口
  }, []);

  const playWarp = useCallback(() => {
    // 預留音效接口
  }, []);
  
  const playSuccess = useCallback(() => {
    // 預留音效接口
  }, []);

  const initAudioEngine = useCallback(() => {
    // 初始化
  }, []);

  const changeBgm = useCallback((type) => {
    // 切換背景音樂
  }, []);

  const value = {
    isMuted,
    setIsMuted,
    playHover,
    playClick,
    playWarp,
    playSuccess,
    initAudioEngine,
    changeBgm
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export default AudioContext;
