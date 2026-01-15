import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { useTranslation } from 'react-i18next'; 
import { 
  Baby, Coins, PenTool, Pause, X, Crown, Zap, Glasses, Layers, Lock,
  Globe, ShieldAlert // 移除 Sprout, Info
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const { 
    user, login, logout, 
    isAdmin, 
    tokens, isSubscribed, purchaseTokens, transactions, refreshTransactions,
    appMode, setAppMode, 
    isPlaying, pausePlayback 
  } = useStory();

  const [showWallet, setShowWallet] = useState(false);
  const [walletTab, setWalletTab] = useState('topup'); 
  const [showModeMenu, setShowModeMenu] = useState(false); 
  const [showMathGate, setShowMathGate] = useState(false);
  const [mathProblem, setMathProblem] = useState({ q: '', a: 0 });
  const [mathInput, setMathInput] = useState('');
  const [pendingMode, setPendingMode] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => { if (showWallet && user) refreshTransactions(); }, [showWallet, user]);

  const toggleLanguage = () => {
      const newLang = i18n.language === 'en' ? 'zh-TW' : 'en';
      i18n.changeLanguage(newLang);
  };

  const handlePurchase = async (plan) => {
    setIsProcessingPayment(true);
    setTimeout(async () => {
        const success = await purchaseTokens(plan);
        setIsProcessingPayment(false);
        if (success) { alert("✅ 支付成功！"); setWalletTab('history'); } 
        else { alert("❌ 支付失敗"); }
    }, 1500);
  };

  const getThemeClass = () => {
    switch (appMode) {
      case 'kids': return 'bg-[#FFFBF0] text-gray-900 font-rounded'; 
      case 'senior': return 'bg-white text-black text-xl font-sans contrast-125';
      default: return 'bg-[#050505] text-gray-100 font-sans'; 
    }
  };

  const requestModeChange = (targetMode) => {
    if (appMode === 'kids' && targetMode !== 'kids') {
        const a = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        setMathProblem({ q: `${a} + ${b} = ?`, a: a + b });
        setMathInput('');
        setPendingMode(targetMode);
        setShowMathGate(true);
        setShowModeMenu(false);
    } else {
        setAppMode(targetMode);
        setShowModeMenu(false);
    }
  };

  const verifyMath = () => {
      if (parseInt(mathInput) === mathProblem.a) { setAppMode(pendingMode); setShowMathGate(false); } 
      else { alert("Error"); setShowMathGate(false); }
  };

  const MathModal = () => { if (!showMathGate) return null; return <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"><div className="bg-white text-black p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl border-4 border-orange-400"><h3 className="text-2xl font-black mb-2">Math Gate</h3><div className="text-4xl font-black mb-6 bg-orange-100 py-4 rounded-xl">{mathProblem.q}</div><input type="number" value={mathInput} onChange={(e) => setMathInput(e.target.value)} className="w-full text-center text-3xl font-bold border-b-4 border-gray-300 focus:border-orange-500 outline-none py-2 mb-6" autoFocus /><div className="flex gap-2"><button onClick={() => setShowMathGate(false)} className="flex-1 py-3 rounded-xl font-bold bg-gray-200">Cancel</button><button onClick={verifyMath} className="flex-1 py-3 rounded-xl font-bold bg-orange-500 text-white">OK</button></div></div></div>; };
  
  const WalletModal = () => { 
      if(!showWallet) return null; 
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade">
            <div className="w-full max-w-md bg-[#18181b] border border-gray-700 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">
                <div className="p-6 pb-0 relative">
                    <button onClick={() => setShowWallet(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X size={24}/></button>
                    <h2 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2 text-white"><Coins className="text-yellow-500" /> {t('wallet.title')}</h2>
                    <div className="text-center">
                        <div className="text-4xl font-black text-yellow-500 my-4">{tokens} <span className="text-lg text-gray-400 font-medium">{t('wallet.balance')}</span></div>
                        {/* 🌟 已移除公益文字 */}
                    </div>
                    <div className="flex mt-6 border-b border-gray-700">
                        <button onClick={() => setWalletTab('topup')} className={`flex-1 pb-3 text-sm font-bold transition ${walletTab === 'topup' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}>{t('wallet.tab_topup')}</button>
                        <button onClick={() => setWalletTab('history')} className={`flex-1 pb-3 text-sm font-bold transition ${walletTab === 'history' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}>{t('wallet.tab_history')}</button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {walletTab === 'topup' ? (
                        <div className="space-y-3">
                            <button onClick={() => handlePurchase('monthly_sub')} disabled={isProcessingPayment} className="w-full p-4 rounded-xl border border-purple-500/50 bg-purple-900/20 hover:bg-purple-900/40 transition flex items-center justify-between group disabled:opacity-50">
                                <div className="text-left"><div className="font-bold text-purple-300 group-hover:text-purple-200">Creator PRO</div><div className="text-xs text-purple-400/60">1000 Tokens / Month</div></div><div className="text-xl font-bold text-white">$9.99</div>
                            </button>
                            <button onClick={() => handlePurchase('basic_topup')} disabled={isProcessingPayment} className="w-full p-4 rounded-xl border border-gray-700 bg-white/5 hover:bg-white/10 transition flex items-center justify-between disabled:opacity-50">
                                <div className="text-left font-bold text-gray-200">Basic Pack (100)</div><div className="text-xl font-bold text-white">$0.99</div>
                            </button>
                            {isProcessingPayment && <div className="text-center text-yellow-500 text-sm animate-pulse mt-2">Processing...</div>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((tx, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-gray-800 pb-3 last:border-0 animate-slideUp">
                                    <div><div className="text-white font-bold text-sm">{tx.description}</div><div className="text-gray-500 text-xs">{new Date(tx.timestamp).toLocaleString()}</div></div>
                                    <div className={`font-mono font-bold ${tx.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'earn' ? '+' : ''}{tx.amount}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  };

  const CapsulePlayer = () => { if (!isPlaying) return null; return <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-6 py-3 rounded-full border border-white/20 flex items-center gap-4 shadow-xl"><div className="text-xs font-bold">Playing...</div><button onClick={pausePlayback}><Pause size={20}/></button></div>; };

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-32 ${getThemeClass()}`}>
      <nav className={`p-4 md:p-6 flex justify-between items-center border-b sticky top-0 z-40 backdrop-blur-xl ${appMode === 'standard' ? 'bg-black/80 border-white/5' : 'bg-white/95 border-gray-300 shadow-sm'}`}>
        <div className="flex items-center">
            <div className="flex flex-col cursor-pointer" onClick={() => navigate('/')}>
                <span className={`text-2xl md:text-3xl font-black tracking-widest flex items-center gap-2 ${appMode === 'standard' ? 'text-white' : 'text-black'}`}>
                    {t('app_name')}
                </span>
            </div>
            {/* 🌟 已移除「願景」按鈕 */}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={toggleLanguage} className={`p-2 rounded-full border transition hover:scale-105 ${appMode === 'standard' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-black'}`}>
              <Globe size={20} />
          </button>
          
          {user && isAdmin && (
              <button 
                  onClick={() => navigate('/admin')} 
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl font-bold border border-red-500/30 bg-red-900/20 text-red-400 hover:bg-red-900/40 transition"
              >
                  <ShieldAlert size={14}/> 系統管理
              </button>
          )}

          <button onClick={() => user ? navigate('/creator') : login()} className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition ${appMode === 'standard' ? 'bg-purple-900/40 text-purple-300 border-purple-500/30' : 'bg-gray-100 text-gray-700 border-gray-300'}`}><PenTool size={14}/> {t('nav.creator')}</button>
          
          <div className="relative"><button onClick={() => setShowModeMenu(!showModeMenu)} className={`p-2 rounded-full border transition hover:scale-105 ${appMode === 'kids' ? 'bg-orange-100 border-orange-300 text-orange-600' : appMode === 'senior' ? 'bg-gray-200 border-gray-400 text-black' : 'bg-white/5 border-white/10 text-white'}`}>{appMode === 'kids' ? <Baby size={20}/> : appMode === 'senior' ? <Glasses size={20}/> : <Layers size={20}/>}</button>{showModeMenu && (<div className="absolute top-12 right-0 w-56 bg-[#18181b] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-slideUp z-50"><button onClick={() => requestModeChange('standard')} className="w-full text-left px-4 py-3 text-white hover:bg-white/10 flex items-center gap-3 border-b border-gray-700/50"><Layers size={16} className="text-purple-400"/> <div><div className="font-bold text-sm">{t('modes.standard')}</div><div className="text-[10px] text-gray-400">{t('modes.standard_desc')}</div></div></button><button onClick={() => requestModeChange('kids')} className="w-full text-left px-4 py-3 text-white hover:bg-white/10 flex items-center gap-3 border-b border-gray-700/50"><Baby size={16} className="text-orange-400"/> <div><div className="font-bold text-sm">{t('modes.kids')}</div><div className="text-[10px] text-gray-400">{t('modes.kids_desc')}</div></div></button><button onClick={() => requestModeChange('senior')} className="w-full text-left px-4 py-3 text-white hover:bg-white/10 flex items-center gap-3"><Glasses size={16} className="text-green-400"/> <div><div className="font-bold text-sm">{t('modes.senior')}</div><div className="text-[10px] text-gray-400">{t('modes.senior_desc')}</div></div></button></div>)}</div>
          
          {user ? (<div className="flex items-center gap-3"><button onClick={() => setShowWallet(true)} className="flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-900/20 hover:bg-yellow-900/40 transition cursor-pointer"><Coins size={14} className="text-yellow-500" /><span className="font-mono font-bold text-sm text-yellow-200">{tokens}</span></button><div onClick={() => navigate('/profile')} className="relative group cursor-pointer hover:opacity-80 transition"><img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full border-2 border-white/20"/></div></div>) : (<button onClick={login} className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition">{t('nav.login')}</button>)}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto py-6 px-4 min-h-[80vh]"><Outlet /></main>
      <CapsulePlayer />
      <WalletModal />
      <MathModal />
    </div>
  );
};

export default Layout;