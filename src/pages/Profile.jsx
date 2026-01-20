import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { User, Coins, Zap, Check, Shield, Crown, Loader2, Globe, Wallet, Clock, BookOpen } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAudio } from '../context/AudioContext';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'planet'; // 預設顯示 '我的星球'

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { playClick, playSuccess } = useAudio();

  // 1. 初始化讀取
  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        navigate('/login');
        return;
    }
    setUser(user);
    const { data } = await supabase.from('profiles').select('token_balance').eq('id', user.id).single();
    if (data) setTokenBalance(data.token_balance);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
        showToast("儲值失敗，請稍後再試", "error");
    } else {
        setTokenBalance(newBalance);
        playSuccess();
        showToast(`成功購買 ${planName}！目前餘額：${newBalance}`, "success");
    }
    setIsTopUpLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0f1016] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500"/></div>;

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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-amber-500/30 text-amber-400">
                    <Coins size={16} />
                    <span className="font-bold">錢包餘額：{tokenBalance} 代幣</span>
                </div>
            </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-4 border-b border-white/10 mb-8">
            <button 
                onClick={() => navigate('/profile?tab=planet')}
                className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'planet' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
            >
                <Globe size={18}/> 我的星球
            </button>
            <button 
                onClick={() => navigate('/profile?tab=vault')}
                className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'vault' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}
            >
                <Wallet size={18}/> 我的金庫
            </button>
        </div>

        {/* 1. 我的星球 (作品集) */}
        {activeTab === 'planet' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl border-dashed border-white/20">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <BookOpen size={32}/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">尚未建立任何故事</h3>
                    <p className="text-slate-400 mb-6">您的星球目前一片荒蕪，等待您來開墾。</p>
                    <button onClick={() => navigate('/create')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-all">
                        開始創作第一篇故事
                    </button>
                </div>
            </div>
        )}

        {/* 2. 我的金庫 (儲值與明細) */}
        {activeTab === 'vault' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                
                {/* 儲值區塊 */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Zap className="text-amber-400" size={20}/> 補充能量</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 方案 1 */}
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/30 transition-all flex flex-col">
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">新手體驗</div>
                            <div className="text-3xl font-bold mb-4">50 代幣 <span className="text-sm font-normal text-slate-500">/ NT$30</span></div>
                            <button onClick={() => handleTopUp(50, "新手體驗包")} disabled={isTopUpLoading} className="w-full py-3 mt-auto rounded-xl border border-white/20 hover:bg-white/10 font-bold transition-all disabled:opacity-50">
                                {isTopUpLoading ? <Loader2 className="animate-spin mx-auto"/> : "立即儲值"}
                            </button>
                        </div>
                        {/* 方案 2 */}
                        <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/50 hover:bg-indigo-600/20 transition-all flex flex-col relative transform scale-105 shadow-xl">
                            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">熱門</div>
                            <div className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">創作者計畫</div>
                            <div className="text-3xl font-bold mb-4">200 代幣 <span className="text-sm font-normal text-slate-500">/ NT$100</span></div>
                            <button onClick={() => handleTopUp(220, "創作者計畫")} disabled={isTopUpLoading} className="w-full py-3 mt-auto rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg disabled:opacity-50">
                                {isTopUpLoading ? <Loader2 className="animate-spin mx-auto"/> : "立即儲值"}
                            </button>
                        </div>
                        {/* 方案 3 */}
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/30 transition-all flex flex-col">
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">宇宙通行證</div>
                            <div className="text-3xl font-bold mb-4">1000 代幣 <span className="text-sm font-normal text-slate-500">/ NT$450</span></div>
                            <button onClick={() => handleTopUp(1000, "宇宙通行證")} disabled={isTopUpLoading} className="w-full py-3 mt-auto rounded-xl border border-white/20 hover:bg-white/10 font-bold transition-all disabled:opacity-50">
                                {isTopUpLoading ? <Loader2 className="animate-spin mx-auto"/> : "立即儲值"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 交易明細 (模擬) */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="text-slate-400" size={20}/> 交易明細</h2>
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