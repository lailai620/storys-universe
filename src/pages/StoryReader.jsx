import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { ArrowLeft, ArrowRight, Home, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti'; 

const StoryReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // 🌟 從 Context 取得 appMode
  const { allStories, loading, appMode } = useStory(); 
  
  const [story, setStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 判斷是否為長輩模式
  const isSenior = appMode === 'senior';

  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!loading && allStories.length > 0) {
      const foundStory = allStories.find(s => s.id === id || s.id == id);
      if (foundStory) {
        setStory(foundStory);
      } else {
        setTimeout(() => navigate('/'), 3000);
      }
    }
  }, [id, allStories, loading, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, story]);

  useEffect(() => {
    if (story && isAutoPlay) speakCurrentPage();
    else stopSpeaking();
  }, [currentPage, isAutoPlay, story]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const speakCurrentPage = () => {
    stopSpeaking();
    if (!story) return;
    const text = story.content[currentPage]?.text || "";
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    // 🌟 長輩模式語速放慢
    utterance.rate = isSenior ? 0.8 : 1.0; 
    utterance.lang = 'zh-TW';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synth.speaking) synth.cancel();
    setIsSpeaking(false);
  };

  const toggleAutoPlay = () => {
    if (isAutoPlay) {
      setIsAutoPlay(false);
      stopSpeaking();
    } else {
      setIsAutoPlay(true);
      speakCurrentPage();
    }
  };

  const handleNext = () => {
    if (!story) return;
    if (currentPage < story.content.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      triggerConfetti();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  };

  if (loading || !story) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">載入中...</div>;

  const currentContent = story.content[currentPage];

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 ${
        isSenior ? 'bg-orange-50 text-gray-900' : 'bg-slate-900 text-white' 
    }`}>
      
      {/* 頂部導航 */}
      <div className={`absolute top-0 w-full p-4 flex justify-between items-center z-20 ${isSenior ? 'bg-orange-100 shadow-sm' : 'bg-black/50 backdrop-blur-md'}`}>
        <button onClick={() => navigate('/')} className={`p-3 rounded-full flex items-center gap-2 ${isSenior ? 'bg-white shadow-md text-orange-900' : 'bg-white/10 hover:bg-white/20'}`}>
          <Home className="w-6 h-6" />
          {isSenior && <span className="font-bold">回首頁</span>}
        </button>
        
        {/* 語音開關 (長輩模式按鈕變大) */}
        <button 
          onClick={toggleAutoPlay} 
          className={`flex items-center gap-2 rounded-full transition-all ${
            isSenior 
              ? `px-8 py-3 text-xl font-bold shadow-md ${isAutoPlay ? 'bg-orange-500 text-white' : 'bg-white text-orange-900'}`
              : `px-4 py-2 ${isAutoPlay ? 'bg-yellow-500 text-black' : 'bg-white/10'}`
          }`}
        >
          {isAutoPlay ? <Volume2 className={isSenior ? "w-8 h-8" : "w-5 h-5"} /> : <VolumeX className={isSenior ? "w-8 h-8" : "w-5 h-5"} />}
          <span>{isAutoPlay ? '朗讀中' : '唸給我聽'}</span>
        </button>
      </div>

      {/* 內容區 */}
      <div className="w-full max-w-6xl px-4 flex flex-col md:flex-row items-center gap-8 z-10 mt-16 md:mt-0">
        
        {/* 圖片區 */}
        <div className={`w-full md:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl relative ${isSenior ? 'border-4 border-orange-200' : 'bg-black border border-white/10'}`}>
          {currentContent?.image ? (
            <img src={currentContent.image} className="w-full h-full object-contain" alt="Page" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">無插圖</div>
          )}
        </div>

        {/* 文字區 (長輩模式字體特大) */}
        <div className="w-full md:w-1/2 flex flex-col items-start space-y-6">
          <h2 className={`font-bold leading-relaxed ${
              isSenior 
                ? 'text-4xl md:text-5xl text-gray-800 tracking-wider font-serif' // 👴 長輩：超大字、襯線體
                : 'text-3xl md:text-4xl text-gray-100' // 👨‍🦰 一般：標準大字
          }`}>
            {currentContent?.text || "..."}
          </h2>
          
          {/* 翻頁按鈕 */}
          <div className="flex gap-4 mt-8 w-full">
            <button 
              onClick={handlePrev}
              disabled={currentPage === 0}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl font-bold transition-all disabled:opacity-30 ${
                  isSenior 
                    ? 'py-6 text-2xl bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'py-3 bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <ArrowLeft className={isSenior ? "w-8 h-8" : "w-5 h-5"} /> 上一頁
            </button>

            {currentPage === story.content.length - 1 ? (
              <button 
                onClick={() => { triggerConfetti(); setTimeout(() => navigate('/'), 2000); }}
                className={`flex-[2] flex items-center justify-center gap-2 rounded-xl font-bold shadow-lg ${
                    isSenior 
                      ? 'py-6 text-2xl bg-orange-500 text-white hover:bg-orange-600'
                      : 'py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
                }`}
              >
                🎉 讀完了
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className={`flex-[2] flex items-center justify-center gap-2 rounded-xl font-bold shadow-lg transition-all ${
                    isSenior 
                      ? 'py-6 text-2xl bg-orange-600 text-white hover:bg-orange-700'
                      : 'py-3 bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                下一頁 <ArrowRight className={isSenior ? "w-8 h-8" : "w-5 h-5"} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryReader;