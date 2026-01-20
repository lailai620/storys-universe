import React, { useMemo } from 'react';
import { useAudio } from '../context/AudioContext';

const ScreenEffects = () => {
  const { currentBgmType } = useAudio();

  // 定義強烈的實體背景色
  const theme = useMemo(() => {
    switch (currentBgmType) {
      case 'memoir': 
        return {
          bgGradient: 'from-[#3f2e25] via-[#2a1b15] to-[#1f1510]',
          orb1: 'bg-orange-400/30',
          orb2: 'bg-amber-600/30',
          orb3: 'bg-rose-900/20',
          topLight: 'from-amber-400/20'
        };
      case 'novel': 
        return {
          bgGradient: 'from-[#022c22] via-[#0f3930] to-[#011a14]',
          orb1: 'bg-emerald-400/30',
          orb2: 'bg-teal-600/30',
          orb3: 'bg-cyan-900/20',
          topLight: 'from-emerald-400/20'
        };
      case 'kids': 
        return {
          // ✅ 童話 (修改)：溫潤奶茶/暖杏色 (Soft Apricot)
          // 降低亮度與飽和度，避免刺眼。從柔和的橙黃過渡到溫暖的淺棕。
          bgGradient: 'from-[#fdf6e3] via-[#ffedd5] to-[#fed7aa]', 
          orb1: 'bg-orange-300/40',   
          orb2: 'bg-yellow-200/50',   
          orb3: 'bg-rose-200/30',      
          topLight: 'from-orange-100/40' 
        };
      case 'space': 
      default:
        return {
          bgGradient: 'from-[#020617] via-[#0f172a] to-[#020617]',
          orb1: 'bg-blue-600/20',
          orb2: 'bg-indigo-500/20',
          orb3: 'bg-slate-700/30',
          topLight: 'from-blue-400/10'
        };
    }
  }, [currentBgmType]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden w-full h-full">
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient} transition-all duration-[3000ms] ease-in-out`}></div>
      <div className={`absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] ${theme.orb1} rounded-full mix-blend-screen filter blur-[100px] animate-pulse transition-colors duration-[3000ms]`} style={{ animationDuration: '8s' }}></div>
      <div className={`absolute bottom-[-20%] right-[-10%] w-[90vw] h-[90vw] ${theme.orb2} rounded-full mix-blend-screen filter blur-[120px] animate-pulse transition-colors duration-[3000ms]`} style={{ animationDuration: '12s', animationDelay: '1s' }}></div>
      <div className={`absolute top-[30%] left-[30%] w-[60vw] h-[60vw] ${theme.orb3} rounded-full mix-blend-screen filter blur-[90px] animate-pulse transition-colors duration-[3000ms]`} style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      <div className={`absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b ${theme.topLight} to-transparent transition-colors duration-[3000ms]`}></div>
    </div>
  );
};

export default ScreenEffects;