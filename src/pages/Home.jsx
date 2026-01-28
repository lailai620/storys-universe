import React, { useEffect, useState } from 'react';
import { useStory } from '../context/StoryContext';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { Sparkles, Gift, CheckCircle, ChevronRight, Layout, Zap, Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Home = () => {
    const { user, balance, refreshBalance } = useStory();
    const [loading, setLoading] = useState(true);

    // 狀態偵測
    const [hasBirthDate, setHasBirthDate] = useState(false);
    const [hasStories, setHasStories] = useState(false);

    // 獎勵領取狀態
    const [claimedQuests, setClaimedQuests] = useState({
        birthday: false,
        firstStory: false
    });

    // 任務定義 (ID 保持駝峰式 firstStory)
    const QUESTS = [
        {
            id: 'birthday',
            title: '確立時間座標',
            desc: '前往個人檔案設定生日，開啟時光機功能。',
            reward: 100,
            isCompleted: hasBirthDate,
            isClaimed: claimedQuests.birthday,
            icon: <Calendar className="text-amber-500" />,
            link: '/profile',
            actionText: '去設定'
        },
        {
            id: 'firstStory',
            title: '創造創世紀',
            desc: '使用 AI 或手動發布您的第一個故事。',
            reward: 500,
            isCompleted: hasStories,
            isClaimed: claimedQuests.firstStory,
            icon: <BookOpen className="text-indigo-500" />,
            link: '/create',
            actionText: '去創作'
        }
    ];

    useEffect(() => {
        if (user) checkQuestStatus();
    }, [user]);

    const checkQuestStatus = async () => {
        try {
            // 1. 檢查生日
            const { data: profile } = await supabase.from('profiles').select('birth_date').eq('id', user.id).single();
            if (profile?.birth_date) setHasBirthDate(true);

            // 2. 檢查故事
            const { count } = await supabase.from('stories').select('*', { count: 'exact', head: true }).eq('author_id', user.id);
            if (count > 0) setHasStories(true);

            // 3. 檢查是否領過獎勵
            const { data: txs } = await supabase.from('transactions').select('action_type').eq('user_id', user.id);

            // 🐛 BUG 修復區：
            // 之前是寫死 'quest_first_story_reward' (多了底線)
            // 現在改為直接檢查 'quest_firstStory_reward' (正確對應 ID)
            const claimed = {
                birthday: txs.some(t => t.action_type === 'quest_birthday_reward'),
                // 👇 這裡修正了！現在會正確抓到資料庫裡的紀錄
                firstStory: txs.some(t => t.action_type === 'quest_firstStory_reward')
            };
            setClaimedQuests(claimed);

        } catch (e) {
            console.error("檢查任務狀態失敗", e);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimReward = async (quest) => {
        if (quest.isClaimed) return;

        try {
            const { data: success, error } = await supabase.rpc('claim_quest_reward', {
                quest_id: quest.id,
                reward_amount: quest.reward,
                quest_title: quest.title
            });

            if (error) throw error;

            if (success) {
                await refreshBalance();
                setClaimedQuests(prev => ({ ...prev, [quest.id]: true }));
                alert(`🎉 恭喜！成功領取 ${quest.reward} SEED！`);
            } else {
                setClaimedQuests(prev => ({ ...prev, [quest.id]: true }));
                alert("您已經領取過這個獎勵囉！(系統自動同步狀態)");
            }

        } catch (e) {
            console.error("領取失敗", e);
            alert("領取失敗，請稍後再試：" + e.message);
        }
    };

    const completedCount = QUESTS.filter(q => q.isClaimed).length;
    const progress = (completedCount / QUESTS.length) * 100;

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin text-indigo-600">●</div></div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>聖所 | Storys Universe - 您的數位時光膠囊</title>
                <meta name="description" content="歡迎回到 Storys Universe 聖所。在這裡管理您的回憶任務，探索無限的創作可能。" />
                <meta property="og:title" content="Storys Universe 聖所" />
                <meta property="og:description" content="紀錄回憶，創造夢話，傳承永恆的故事。" />
                <meta property="og:type" content="website" />
            </Helmet>
            <div className="bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        早安，{user?.user_metadata?.full_name || '探索者'}。
                    </h1>
                    <p className="text-indigo-200 text-lg max-w-2xl">
                        歡迎來到 STORYS Universe。這裡是您存放回憶、創造夢想的私人宇宙。
                        準備好開始這趟旅程了嗎？
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-10 animate-in slide-in-from-bottom-5 duration-700">
                    <div className="bg-indigo-50/50 p-6 border-b border-indigo-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Gift className="text-indigo-500" /> 新手引導任務
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">完成任務，賺取 SEED 獎勵</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-indigo-600">{Math.round(progress)}%</span>
                            <div className="w-24 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {QUESTS.map((quest) => (
                            <div key={quest.id} className={`p-6 flex flex-col md:flex-row items-center gap-6 transition-colors ${quest.isClaimed ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${quest.isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {quest.isCompleted ? <CheckCircle size={28} /> : quest.icon}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className={`font-bold text-lg ${quest.isClaimed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{quest.title}</h3>
                                    <p className="text-slate-500 text-sm">{quest.desc}</p>
                                    {!quest.isClaimed && (
                                        <div className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                                            <Sparkles size={10} /> +{quest.reward} SEED
                                        </div>
                                    )}
                                </div>
                                <div className="shrink-0">
                                    {quest.isClaimed ? (
                                        <span className="px-6 py-2 text-slate-400 font-bold text-sm bg-slate-100 rounded-full cursor-default select-none">
                                            已領取
                                        </span>
                                    ) : quest.isCompleted ? (
                                        <button
                                            onClick={() => handleClaimReward(quest)}
                                            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg shadow-amber-200 hover:shadow-amber-400 hover:-translate-y-0.5 transition-all flex items-center gap-2 animate-bounce"
                                        >
                                            <Gift size={18} /> 領取獎勵
                                        </button>
                                    ) : (
                                        <Link to={quest.link} className="px-6 py-2 bg-white text-indigo-600 border border-indigo-200 font-bold rounded-full hover:bg-indigo-50 transition-all flex items-center gap-2">
                                            {quest.actionText} <ChevronRight size={16} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Link to="/create" className="group p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Layout size={100} /></div>
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><Layout size={24} /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">開始創作</h3>
                        <p className="text-slate-500 text-sm mb-4">使用 AI 或手動模式，將您的靈感轉化為故事。</p>
                        <span className="text-indigo-600 font-bold flex items-center gap-2 text-sm group-hover:translate-x-1 transition-transform">前往工作室 <ArrowRight size={16} /></span>
                    </Link>
                    <Link to="/profile" className="group p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-amber-200 hover:shadow-lg transition-all relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><BookOpen size={100} /></div>
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4"><BookOpen size={24} /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">回憶圖書館</h3>
                        <p className="text-slate-500 text-sm mb-4">瀏覽您的生命軸，重溫那些珍貴的時刻。</p>
                        <span className="text-amber-600 font-bold flex items-center gap-2 text-sm group-hover:translate-x-1 transition-transform">查看檔案 <ArrowRight size={16} /></span>
                    </Link>
                    <Link to="/wallet" className="group p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-lg transition-all relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Zap size={100} /></div>
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><Zap size={24} /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">我的資產</h3>
                        <p className="text-slate-500 text-sm mb-4">管理您的 SEED 餘額，查看交易紀錄與儲值。</p>
                        <span className="text-emerald-600 font-bold flex items-center gap-2 text-sm group-hover:translate-x-1 transition-transform">查看錢包 <ArrowRight size={16} /></span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;