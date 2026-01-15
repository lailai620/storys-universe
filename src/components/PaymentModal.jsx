import React from 'react';
import { Coins, X, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, onConfirm, cost, balance, isProcessing }) => {
  if (!isOpen) return null;

  const remaining = balance - cost;
  const canAfford = remaining >= 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 1. 背景遮罩：深色模糊，讓背後的頁面退後 */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={!isProcessing ? onClose : undefined}
      ></div>

      {/* 2. 支付卡片本體 */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* 頂部裝飾：流沙金漸層 */}
        <div className="h-32 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent"></div>
            
            {/* 中央大圖標 */}
            <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/30">
                <Sparkles className="text-white w-10 h-10 drop-shadow-md animate-pulse" />
            </div>
            
            {/* 關閉按鈕 */}
            {!isProcessing && (
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors">
                    <X size={20}/>
                </button>
            )}
        </div>

        {/* 內容區域 */}
        <div className="p-8 text-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">確認支付</h3>
            <p className="text-slate-500 mb-8">即將啟用 Pro AI 引擎為您生成故事</p>

            {/* 帳單明細 */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
                <div className="flex justify-between items-center mb-3 text-sm text-slate-500">
                    <span>當前餘額</span>
                    <span className="font-mono">{balance} SEED</span>
                </div>
                <div className="flex justify-between items-center mb-3 text-lg font-bold text-slate-800">
                    <span className="flex items-center gap-2"><Sparkles size={16} className="text-indigo-500"/> AI 算力消耗</span>
                    <span className="text-red-500 flex items-center gap-1">- {cost} <Coins size={14}/></span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400">支付後餘額</span>
                    <span className={`font-mono flex items-center gap-1 ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                        {remaining} SEED
                        {!canAfford && <span className="text-xs font-normal bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-1">不足</span>}
                    </span>
                </div>
            </div>

            {/* 確認按鈕 */}
            <button
                onClick={onConfirm}
                disabled={!canAfford || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                    canAfford 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-200' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
                {isProcessing ? (
                    <><Loader2 className="animate-spin" /> 支付處理中...</>
                ) : (
                    <>{canAfford ? '確認支付' : '餘額不足'} <ArrowRight size={20} /></>
                )}
            </button>
            
            {!canAfford && (
                <p className="text-xs text-red-500 mt-3 font-medium">請先前往錢包儲值</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;