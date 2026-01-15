import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { 
  ArrowLeft, Play, Pause, Heart, Eye, MessageCircle, 
  Send, User, Volume2, ChevronLeft, ChevronRight, Layers,
  Settings, Wand2, BookOpen
} from 'lucide-react';

const Reader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    stories, user, appMode, 
    // 🌟 引入 resumePlayback
    startPlayback, pausePlayback, resumePlayback, stopPlayback,
    isPlaying, currentPlayingStoryId,
    addComment, incrementViewCount,
    voices, selectedVoice, changeVoice,
    currentReadingPage, setCurrentReadingPage
  } = useStory();

  const [story, setStory] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    const found = stories.find(s => s.id === id);
    if (found) {
        setStory(found);
        incrementViewCount(found.id);
    }
  }, [id, stories]);

  if (!story) return <div className="min-h-screen flex items-center justify-center text-white">載入中...</div>;

  const isMultiPage = Array.isArray(story.content);
  const activePage = isMultiPage ? currentReadingPage : 0;
  const pageContent = isMultiPage ? story.content[activePage] : { text: story.content, image: story.image };
  const totalPages = isMultiPage ? story.content.length : 1;

  const handleNext = () => { 
      if (activePage < totalPages - 1) {
          setCurrentReadingPage(activePage + 1);
          if (isPlaying) startPlayback(story, activePage + 1);
      }
  };
  const handlePrev = () => { 
      if (activePage > 0) {
          setCurrentReadingPage(activePage - 1);
          if (isPlaying) startPlayback(story, activePage - 1);
      }
  };

  // 🌟 核心修復：聰明的播放按鈕
  const handlePlayToggle = () => {
      if (isPlaying) {
          // 1. 如果正在播放 -> 暫停
          pausePlayback();
      } else {
          // 2. 如果沒播放，檢查是不是「暫停中」
          // window.speechSynthesis.paused 為真，且目前故事 ID 沒變，代表是暫停狀態
          if (window.speechSynthesis.paused && currentPlayingStoryId === story.id) {
              resumePlayback(); // -> 繼續播放
          } else {
              // 3. 否則 -> 從頭（或當前頁）開始播放
              startPlayback(story, activePage);
          }
      }
  };

  const handleRemix = () => {
      if (!user) return alert("請先登入");
      navigate('/creator', { state: { remixStory: story } });
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    await addComment(story.id, commentInput);
    setCommentInput("");
  };

  const isSenior = appMode === 'senior';
  const isKids = appMode === 'kids';

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-500 ${isSenior ? 'bg-white text-black' : (isKids ? 'bg-[#FFFBF0] text-gray-900' : 'bg-[#050505] text-white')}`}>
        
        <div className="fixed top-4 left-4 z-50 flex items-center gap-4">
            <button onClick={() => { stopPlayback(); navigate('/'); }} className="bg-black/20 backdrop-blur-md p-3 rounded-full hover:bg-black/40 transition text-white">
                <ArrowLeft size={24}/>
            </button>
            {isMultiPage && (
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold flex items-center gap-2">
                    <Layers size={14}/> 第 {activePage + 1} / {totalPages} 頁
                </div>
            )}
        </div>

        {showSettings && (
            <div className="fixed top-20 right-4 z-50 bg-white text-black p-4 rounded-xl shadow-2xl w-64 border border-gray-200 animate-slideUp">
                <h4 className="font-bold mb-2 text-sm">選擇朗讀聲音</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                    {voices.filter(v => v.lang.includes('zh') || v.lang.includes('en')).map(v => (
                        <button 
                            key={v.name} 
                            onClick={() => changeVoice(v.name)}
                            className={`w-full text-left px-2 py-1 text-xs truncate rounded ${selectedVoice?.name === v.name ? 'bg-purple-100 text-purple-700 font-bold' : 'hover:bg-gray-100'}`}
                        >
                            {v.name}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="max-w-6xl mx-auto min-h-[85vh] flex flex-col md:flex-row items-center justify-center gap-8 p-6 pt-24">
            
            <div className="w-full md:w-1/2 aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group bg-black">
                <img 
                    src={pageContent.image || story.image || story.coverImage} 
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                    alt="Story visual"
                />
                
                {isMultiPage && (
                    <>
                        <button onClick={handlePrev} disabled={activePage === 0} className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-black/20 to-transparent opacity-0 hover:opacity-100 flex items-center justify-center transition disabled:hidden">
                            <ChevronLeft size={48} className="text-white drop-shadow-lg"/>
                        </button>
                        <button onClick={handleNext} disabled={activePage === totalPages - 1} className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-black/20 to-transparent opacity-0 hover:opacity-100 flex items-center justify-center transition disabled:hidden">
                            <ChevronRight size={48} className="text-white drop-shadow-lg"/>
                        </button>
                    </>
                )}
            </div>

            <div className="w-full md:w-1/2 space-y-6">
                <div className="flex justify-between items-center border-b pb-4 border-gray-200/10">
                    <h1 className={`text-3xl font-black ${isKids ? 'text-orange-600' : ''}`}>{story.title}</h1>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePlayToggle} 
                            className={`p-3 rounded-full shadow-lg transition hover:scale-110 flex items-center gap-2 ${isPlaying ? 'bg-red-500 text-white animate-pulse' : (isKids ? 'bg-orange-400 text-white' : 'bg-white text-black')}`}
                        >
                            {isPlaying ? <><Pause size={20}/> 暫停</> : <><Play size={20}/> 朗讀</>}
                        </button>
                        
                        <button onClick={() => setShowSettings(!showSettings)} className="p-3 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition">
                            <Settings size={20}/>
                        </button>
                    </div>
                </div>

                <div className={`text-lg leading-loose whitespace-pre-line min-h-[200px] ${isSenior ? 'text-2xl font-medium' : 'opacity-90'}`}>
                    {pageContent.text}
                </div>

                <div className="flex gap-3 pt-4">
                    <button onClick={handleRemix} className="flex items-center gap-2 px-4 py-2 border border-blue-500/30 text-blue-400 rounded-full hover:bg-blue-500/10 transition">
                        <Wand2 size={16}/> 進行二創
                    </button>
                </div>

                {isMultiPage && (
                    <div className="flex justify-center gap-2 pt-4">
                        {story.content.map((_, i) => (
                            <div key={i} className={`h-2 rounded-full transition-all ${i === activePage ? 'bg-purple-500 w-8' : 'bg-gray-500/30 w-2'}`}/>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pb-12">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 opacity-70"><MessageCircle size={20}/> 留言</h3>
            <div className="flex gap-2">
                <input value={commentInput} onChange={e => setCommentInput(e.target.value)} className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="說點什麼..."/>
                <button onClick={handleSendComment} className="bg-purple-600 px-4 rounded-xl text-white"><Send/></button>
            </div>
        </div>
    </div>
  );
};

export default Reader;