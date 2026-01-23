import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { User, Zap, Check, Shield, Crown, Loader2, Globe, Clock, BookOpen, Sparkles, Stars, Download, Layers, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAudio } from '../context/AudioContext';
import { useStory } from '../context/StoryContext';
import jsPDF from 'jspdf';

const Profile = () => {
    const { user, balance, userStories, appMode, loading: contextLoading } = useStory();
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'


    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'planet'; // 預設顯示 '我的星球'

    const navigate = useNavigate();
    const { showToast } = useToast();
    const { playClick, playSuccess, playHover } = useAudio();

    useEffect(() => {
        if (!contextLoading && !user) navigate('/login');
    }, [user, contextLoading]);

    // 3. 匯出 PDF 紀念冊
    const exportToPDF = () => {
        playClick();
        if (userStories.length === 0) {
            showToast("尚無故事可供匯出", "error");
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("STORYS Universe - Memory Legacy", 20, 20);
        doc.setFontSize(12);
        doc.text(`User: ${user.email}`, 20, 30);
        doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 35);
        doc.line(20, 40, 190, 40);

        let y = 50;
        sortedStories.forEach((story, index) => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(16);
            doc.text(`${index + 1}. ${story.title}`, 20, y);
            y += 10;
            doc.setFontSize(10);
            doc.text(`Date: ${story.memory_date || story.created_at}`, 20, y);
            y += 10;
            doc.setFontSize(12);
            const content = Array.isArray(story.content) ? story.content[0]?.text : story.content;
            const splitText = doc.splitTextToSize(content || "", 170);
            doc.text(splitText, 20, y);
            y += (splitText.length * 7) + 15;
        });

        doc.save(`${user.email.split('@')[0]}_memories.pdf`);
        showToast("紀念冊匯出成功！✨", "success");
        playSuccess();
    };

    // 2. 儲值功能
    const handleTopUp = async (amount, planName) => {
        playClick();
        setIsTopUpLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        const newBalance = tokenBalance + amount;
        const { error } = await supabase
            .from('profiles')
            .update({ token_balance: newBalance })
            .eq('id', user.id);

        if (error) {
            showToast("採集失敗，請稍後再試", "error");
        } else {
            setTokenBalance(newBalance);
            playSuccess();
            showToast(`成功採集 ${planName}！目前星塵：${newBalance} ✨`, "success");
        }
        setIsTopUpLoading(false);
    };

    if (contextLoading) return <div className="min-h-screen bg-[#0f1016] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;

    return (
        <div className="min-h-screen bg-[#0f1016] text-slate-100 font-sans relative overflow-x-hidden selection:bg-indigo-500/30">
            <Navbar />

            <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">

                {/* User Info Header */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl text-3xl font-bold text-white">
                        {user.email[0].toUpperCase()}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-bold mb-2">{user.email.split('@')[0]}</h1>
                        <p className="text-slate-400 text-sm mb-4">{user.email}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/60 border border-indigo-500/30">
                            <Sparkles size={16} className="text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                            <span className="font-bold text-amber-200">星塵庫存：{balance}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-4 border-b border-white/10 mb-8">
                    <button
                        onClick={() => { playClick(); navigate('/profile?tab=planet'); }}
                        className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'planet' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Globe size={18} /> 我的星球
                    </button>
                    <button
                        onClick={() => { playClick(); navigate('/profile?tab=family'); }}
                        className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'family' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Users size={18} /> 家庭星域
                    </button>
                    <button
                        onClick={() => { playClick(); navigate('/profile?tab=vault'); }}
                        onMouseEnter={() => { }}
                        className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'vault' ? 'text-amber-300 border-b-2 border-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Stars size={18} className={activeTab === 'vault' ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' : ''} /> 星塵庫
                    </button>
                </div>

                {/* 1. 我的星球 (作品集) */}
                {activeTab === 'planet' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {userStories.length > 0 ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <Layers className="text-indigo-400" size={20} /> 作品星域
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={exportToPDF}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-sm font-bold text-indigo-300"
                                        >
                                            <Download size={16} /> 匯出紀念冊
                                        </button>
                                        <button
                                            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold"
                                        >
                                            <Clock size={16} /> 依日期：{sortOrder === 'desc' ? '從新到舊' : '從舊到新'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {sortedStories.map((story) => (
                                        <div
                                            key={story.id}
                                            onClick={() => navigate(`/story/${story.id}`)}
                                            className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
                                        >
                                            <div className="aspect-video relative overflow-hidden bg-slate-900">
                                                {story.cover_image ? (
                                                    <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-20">
                                                        <Sparkles size={48} />
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${story.style === 'memory' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'}`}>
                                                        {story.category || 'Story'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{story.title}</h3>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={12} /> {story.memory_date ? story.memory_date.split('T')[0] : 'Unknown'}
                                                    </div>
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5">
                                                        {story.visibility === 'public' ? '公開' : '私人'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl border-dashed border-white/20">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                                    <BookOpen size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">尚未建立任何故事</h3>
                                <p className="text-slate-400 mb-6">您的星球目前一片荒蕪，等待您來開墾。</p>
                                <button onClick={() => navigate('/create')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-all">
                                    開始創作第一篇故事
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 1.5 家庭星域 (Mockup) */}
                {activeTab === 'family' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">家庭共鳴星域</h2>
                                <p className="text-slate-400 text-sm">這裡匯集了家人們共享的記憶碎片，跨越世代的連結。</p>
                            </div>
                            <button className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                                <Plus size={16} /> 邀請家人
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users size={80} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-300 font-bold">E</div>
                                        <div>
                                            <div className="font-bold text-white">Emily (女兒)</div>
                                            <div className="text-xs text-slate-500">2 小時前更新</div>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-indigo-300">「今天的雲朵好像棉花糖」</h3>
                                    <p className="text-slate-400 text-sm line-clamp-2">學校後山的雲朵特別漂亮，AI 幫我畫出的星域效果超棒！爸爸快來看...</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group opacity-60">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold">J</div>
                                        <div>
                                            <div className="font-bold text-white">Grandpa Joe</div>
                                            <div className="text-xs text-slate-500">3 天前更新</div>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-slate-300">「1969 年的那場雨」</h3>
                                    <p className="text-slate-400 text-sm line-clamp-2">那時候我們沒有 AI，只有收音機。我記得那一天的氣味，那是...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'vault' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">

                        {/* 儲值區塊 */}
                        <div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Sparkles className="text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" size={20} /> 採集星塵</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* 方案 1 */}
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/30 transition-all flex flex-col">
                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">新手體驗</div>
                                    <div className="text-3xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-amber-300" />50 <span className="text-sm font-normal text-slate-500">/ NT$30</span></div>
                                    <button onClick={() => handleTopUp(50, "新手體驗包")} onMouseEnter={() => { }} disabled={isTopUpLoading} className="w-full py-3 mt-auto rounded-xl border border-white/20 hover:bg-white/10 font-bold transition-all disabled:opacity-50">
                                        {isTopUpLoading ? <Loader2 className="animate-spin mx-auto" /> : "採集星塵"}
                                    </button>
                                </div>
                                {/* 方案 2 */}
                                <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/50 hover:bg-indigo-600/20 transition-all flex flex-col relative transform scale-105 shadow-xl">
                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">熱門</div>
                                    <div className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">創作者計畫</div>
                                    <div className="text-3xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-amber-300" />200 <span className="text-sm font-normal text-slate-500">/ NT$100</span></div>
                                    <button onClick={() => handleTopUp(220, "創作者計畫")} onMouseEnter={() => { }} disabled={isTopUpLoading} className="w-full py-3 mt-auto rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg disabled:opacity-50">
                                        {isTopUpLoading ? <Loader2 className="animate-spin mx-auto" /> : "採集星塵"}
                                    </button>
                                </div>
                                {/* 方案 3 */}
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/30 transition-all flex flex-col">
                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">宇宙通行證</div>
                                    <div className="text-3xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-amber-300" />1000 <span className="text-sm font-normal text-slate-500">/ NT$450</span></div>
                                    <button onClick={() => handleTopUp(1000, "宇宙通行證")} onMouseEnter={() => { }} disabled={isTopUpLoading} className="w-full py-3 mt-auto rounded-xl border border-white/20 hover:bg-white/10 font-bold transition-all disabled:opacity-50">
                                        {isTopUpLoading ? <Loader2 className="animate-spin mx-auto" /> : "採集星塵"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 交易明細 (模擬) */}
                        <div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="text-slate-400" size={20} /> 交易明細</h2>
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-black/20 text-slate-400 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-4">時間</th>
                                            <th className="px-6 py-4">項目</th>
                                            <th className="px-6 py-4 text-right">變動</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-slate-400">2026-05-20 14:30</td>
                                            <td className="px-6 py-4 text-white">購買 - 創作者計畫</td>
                                            <td className="px-6 py-4 text-right text-green-400 font-bold">+220</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-slate-400">2026-05-19 09:15</td>
                                            <td className="px-6 py-4 text-white">AI 生成 - 封面繪製</td>
                                            <td className="px-6 py-4 text-right text-rose-400 font-bold">-1</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-slate-400">2026-05-18 22:10</td>
                                            <td className="px-6 py-4 text-white">新用戶獎勵</td>
                                            <td className="px-6 py-4 text-right text-green-400 font-bold">+5</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default Profile;