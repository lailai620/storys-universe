import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, ArrowRight, X, BookOpen, Calendar, Clock, Share2, Quote, Download } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import OptimizedImage from '../components/OptimizedImage';
import { useStory } from '../context/StoryContext';
import { useToast } from '../context/ToastContext';
import { useAudio } from '../context/AudioContext';
import jsPDF from 'jspdf';

const StoryViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useStory();
    const { showToast } = useToast();
    const { playClick, playSuccess } = useAudio();

    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);

    // 閱讀狀態控制
    const [currentPage, setCurrentPage] = useState(-1); // -1 代表封面
    const [isDarkMode, setIsDarkMode] = useState(true); // 閱讀器預設深色模式，更有氛圍

    // 🎙️ TTS 語音朗讀狀態
    const { isSpeaking, startSpeaking, stopSpeaking } = useAudio();
    const [isLoadingVoice, setIsLoadingVoice] = useState(false);

    useEffect(() => {
        fetchStory();
    }, [id]);

    const fetchStory = async () => {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setStory(data);
        } catch (error) {
            console.error('Error fetching story:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🌟 匯出單篇 PDF (僅限作者)
    const handleExportPDF = () => {
        playClick();
        if (!story) return;

        // 權限檢查：只有作者本人可以匯出
        if (user?.id !== story.author_id) {
            showToast("抱歉，只有原創作者可以匯出這篇故事的 PDF。", "error");
            return;
        }

        const doc = new jsPDF();

        // 設定 PDF 標題
        doc.setFontSize(22);
        doc.text(story.title, 20, 20);

        doc.setFontSize(10);
        doc.text(`Author: ${story.author_name || 'STORYS Voyager'}`, 20, 30);
        doc.text(`Date: ${story.memory_date || new Date(story.created_at).toLocaleDateString()}`, 20, 35);
        doc.line(20, 40, 190, 40);

        let y = 50;
        const storyContent = Array.isArray(story.content) ? story.content : [];

        storyContent.forEach((page, index) => {
            if (index > 0) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(14);
            doc.text(`Page ${index + 1}`, 20, y);
            y += 10;

            doc.setFontSize(11);
            const splitText = doc.splitTextToSize(page.text || "", 170);
            doc.text(splitText, 20, y);
            y += (splitText.length * 7) + 15;

            // 提示：目前版本 jsPDF 繪製遠端圖片需要處理 CORS，暫時僅匯出文字
            if (y > 250 && index < storyContent.length - 1) {
                // 避免文字溢出到下一頁
                y = 280;
            }
        });

        doc.save(`${story.title}_STORYS.pdf`);
        showToast("PDF 紀念冊已產生 ✨", "success");
        playSuccess();
    };

    // 🎙️ AI 朗讀處理
    const handleSpeak = async () => {
        if (!story || currentPage === -1) return;
        playClick();

        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        const text = story.content[currentPage]?.text;
        if (!text) return;

        setIsLoadingVoice(true);
        try {
            await startSpeaking(text);
        } catch (e) {
            showToast("朗讀失敗，請檢查 API 設定", "error");
        } finally {
            setIsLoadingVoice(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-300">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <BookOpen size={48} />
                <span className="text-sm tracking-widest uppercase">Opening Story...</span>
            </div>
        </div>
    );

    if (!story) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">故事已佚失在時光中...</div>;

    // 計算總頁數
    const totalPages = story.content?.length || 0;
    const progress = ((currentPage + 1) / (totalPages + 1)) * 100;

    // 樣式變數
    const bgClass = isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800';
    const cardBgClass = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

    return (
        <div className={`min-h-screen flex flex-col relative transition-colors duration-700 ${bgClass}`}>
            <Helmet>
                <title>{story?.title ? `${story.title} | Storys Universe` : '讀取故事中...'}</title>
                <meta name="description" content={story?.content?.[0]?.text?.slice(0, 160) || "正在讀取這段珍貴的回憶..."} />
                <meta property="og:title" content={story?.title} />
                <meta property="og:description" content={story?.content?.[0]?.text?.slice(0, 100)} />
                <meta property="og:image" content={story?.cover_image} />
                <meta property="og:type" content="article" />
                {story && (
                    <script type="application/ld+json">
                        {JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Article",
                            "headline": story.title,
                            "image": story.cover_image,
                            "author": {
                                "@type": "Person",
                                "name": story.author_name
                            },
                            "datePublished": story.created_at
                        })}
                    </script>
                )}
            </Helmet>

            {/* 頂部導覽 (閱讀模式下盡量隱藏干擾) */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50">
                <button
                    onClick={() => navigate(-1)}
                    className={`p-2 rounded-full backdrop-blur-md transition-all ${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700 text-slate-300' : 'bg-white/50 hover:bg-white text-slate-700 shadow-sm'}`}
                >
                    <X size={20} />
                </button>

                <div className="flex gap-3 items-center">
                    {/* 🎙️ AI 朗讀 */}
                    {currentPage !== -1 && (
                        <button
                            onClick={handleSpeak}
                            disabled={isLoadingVoice}
                            className={`p-2 rounded-full backdrop-blur-md transition-all ${isSpeaking ? 'bg-indigo-500 text-white animate-pulse' : isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700 text-slate-300' : 'bg-white/50 hover:bg-white text-slate-700 shadow-sm'}`}
                        >
                            {isLoadingVoice ? <span className="animate-spin text-[10px]">🌀</span> : <BookOpen size={20} />}
                        </button>
                    )}

                    {/* 🌟 只有作者可以看到匯出按鈕 */}
                    {user?.id === story?.author_id && (
                        <button
                            onClick={handleExportPDF}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest backdrop-blur-md transition-all ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm'}`}
                        >
                            <Download size={14} /> PDF
                        </button>
                    )}

                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest backdrop-blur-md transition-all ${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-white/50 text-slate-600 shadow-sm'}`}
                    >
                        {isDarkMode ? 'LIGHT' : 'DARK'}
                    </button>
                </div>
            </div>

            {/* 進度條 */}
            <div className="fixed bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300 z-50" style={{ width: `${progress}%` }}></div>

            {/* 主要內容區 */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">

                {/* 背景裝飾光 (深色模式才有) */}
                {isDarkMode && (
                    <>
                        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
                        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-amber-900/5 rounded-full blur-[100px] pointer-events-none"></div>
                    </>
                )}

                {/* 📖 封面模式 (CurrentPage === -1) */}
                {currentPage === -1 && (
                    <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 md:gap-16 items-center animate-in fade-in zoom-in-95 duration-700">
                        {/* 封面圖 */}
                        <div className="w-full md:w-1/2 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl relative group cursor-pointer" onClick={() => setCurrentPage(0)}>
                            <OptimizedImage
                                src={story.cover_image || story.coverImage}
                                alt="Cover"
                                width={800} // 封面展現高品質大圖
                                className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                            <div className="absolute bottom-6 right-6 flex items-center gap-2 text-white/80 animate-pulse">
                                <span className="text-sm tracking-widest uppercase">開始閱讀</span>
                                <ArrowRight size={16} />
                            </div>
                        </div>

                        {/* 書籍資訊 */}
                        <div className="w-full md:w-1/2 space-y-8 text-center md:text-left">
                            <div className="space-y-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs tracking-widest uppercase border ${isDarkMode ? 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 bg-indigo-50'}`}>
                                    {story.category || 'Memory'}
                                </span>
                                <h1 className="text-3xl md:text-5xl font-serif leading-tight">{story.title}</h1>
                                <div className={`flex items-center justify-center md:justify-start gap-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <div className="flex items-center gap-2"><Calendar size={14} /> {story.memory_date || 'Unknown Date'}</div>
                                    <div className="flex items-center gap-2"><Clock size={14} /> {new Date(story.created_at).toLocaleDateString()} 封存</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setCurrentPage(0)}
                                className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold tracking-widest shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3"
                            >
                                翻開故事 <BookOpen size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 📖 內頁模式 (CurrentPage >= 0) */}
                {currentPage >= 0 && story.content && story.content[currentPage] && (
                    <div className="w-full max-w-6xl flex flex-col md:flex-row h-full md:h-[80vh] gap-6 md:gap-12 animate-in fade-in slide-in-from-right-8 duration-500 key={currentPage}">

                        {/* 圖像區 */}
                        <div className="w-full md:w-1/2 h-[40vh] md:h-full rounded-2xl overflow-hidden shadow-2xl relative">
                            <OptimizedImage
                                src={story.content[currentPage].image}
                                alt={`Page ${currentPage + 1}`}
                                width={1000} // 內頁插圖使用高品質
                                className="w-full h-full"
                            />
                        </div>

                        {/* 文字區 */}
                        <div className="w-full md:w-1/2 flex flex-col justify-center">
                            <div className="mb-8 opacity-50 text-xs tracking-[0.2em] font-serif uppercase">
                                Page {currentPage + 1} / {totalPages}
                            </div>

                            <div className="relative">
                                <Quote size={48} className={`absolute -top-8 -left-6 opacity-10 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                <p className="text-xl md:text-2xl leading-relaxed font-serif whitespace-pre-wrap">
                                    {story.content[currentPage].text}
                                </p>
                            </div>

                            {/* 翻頁控制器 */}
                            <div className="mt-12 flex gap-4">
                                <button
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className={`flex-1 py-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${cardBgClass} hover:bg-indigo-500 hover:border-indigo-500 hover:text-white group`}
                                >
                                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 上一頁
                                </button>

                                <button
                                    onClick={() => {
                                        if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
                                        else navigate('/profile'); // 最後一頁看完回列表
                                    }}
                                    className={`flex-[2] py-4 rounded-xl bg-indigo-600 text-white font-bold tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 group`}
                                >
                                    {currentPage < totalPages - 1 ? (
                                        <>下一頁 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                                    ) : (
                                        <>闔上回憶 <BookOpen size={18} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StoryViewer;