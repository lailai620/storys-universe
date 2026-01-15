import React, { useEffect, useState } from 'react';
import { useStory } from '../context/StoryContext';
import { useNavigate } from 'react-router-dom';
import { Zap, History, ArrowRight, Sparkles } from 'lucide-react';

const Wallet = () => {
  const { user, balance, fetchBalance, transactions, fetchTransactions } = useStory();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    setLoading(true);
    await Promise.all([fetchBalance(), fetchTransactions()]);
    setLoading(false);
  };

  const handleTopUp = (amount, price) => {
      if(window.confirm(`確定要花費 $${price} 購買 ${amount} SEED 嗎？(模擬)`)) {
          alert("✨ 能量已注入！(這是模擬交易)");
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
      <div className="relative pt-24 pb-16 px-6 overflow-hidden">
         <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
         <div className="max-w-4xl mx-auto relative z-10 text-center">
            <h1 className="text-slate-400 font-serif tracking-widest uppercase mb-4 text-sm">Your Energy</h1>
            <div className="flex items-center justify-center gap-4 text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-2xl">
                <Zap size={64} className="text-amber-400 fill-amber-400" />
                <span>{balance}</span>
            </div>
            <p className="mt-4 text-slate-500">當前可用 SEED</p>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4 text-slate-300 font-serif text-lg border-b border-white/10 pb-2"><Sparkles size={18} className="text-amber-400" /> 補充能量</div>
            <div className="grid gap-4">
                <button onClick={() => handleTopUp(100, 30)} className="group relative p-6 bg-slate-900 border border-white/5 rounded-2xl hover:border-amber-500/50 hover:bg-slate-800 transition-all text-left flex justify-between items-center overflow-hidden"><div className="relative z-10"><h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">100 SEEDS</h3><p className="text-slate-500 text-sm mt-1">適合嘗試 2 個短篇故事</p></div><div className="relative z-10 flex items-center gap-3"><span className="text-lg font-bold text-slate-300">$30</span><div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-900 transition-all"><ArrowRight size={16} /></div></div><div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div></button>
                <button onClick={() => handleTopUp(500, 100)} className="group relative p-6 bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl hover:border-amber-400 hover:shadow-lg hover:shadow-amber-900/20 transition-all text-left flex justify-between items-center"><div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div><div className="relative z-10"><h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">500 SEEDS</h3><p className="text-indigo-200/60 text-sm mt-1">盡情創作 10+ 個回憶</p></div><div className="relative z-10 flex items-center gap-3"><span className="text-lg font-bold text-amber-300">$100</span><div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-900 transition-all"><ArrowRight size={16} /></div></div></button>
            </div>
        </div>

        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4 text-slate-300 font-serif text-lg border-b border-white/10 pb-2"><History size={18} className="text-slate-500" /> 能量流動</div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {transactions && transactions.length > 0 ? (
                    transactions.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{tx.amount > 0 ? <Sparkles size={16} /> : <Zap size={16} />}</div>
                                <div><p className="text-sm text-slate-200 font-medium">{tx.description || (tx.amount > 0 ? '儲值' : '生成故事')}</p><p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p></div>
                            </div>
                            <span className={`font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-600 italic">尚未有能量流動紀錄...</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;