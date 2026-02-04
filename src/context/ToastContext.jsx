import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

// 單個通知組件
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef(null);
  const duration = 4000; // 稍長一點，讓使用者有視覺預留

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300); // 等待淡出動畫
    }, duration);
  }, [toast.id, onRemove]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const icons = {
    success: <CheckCircle className="text-emerald-400 shrink-0" size={20} />,
    error: <AlertCircle className="text-rose-400 shrink-0 animate-shake" size={20} />,
    warning: <AlertTriangle className="text-amber-400 shrink-0" size={20} />,
    info: <Info className="text-indigo-400 shrink-0" size={20} />,
  };

  const statusStyles = {
    success: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-50 shadow-emerald-500/10',
    error: 'bg-rose-950/60 border-rose-500/30 text-rose-50 shadow-rose-500/10',
    warning: 'bg-amber-950/60 border-amber-500/30 text-amber-50 shadow-amber-500/10',
    info: 'bg-indigo-950/60 border-indigo-500/30 text-indigo-50 shadow-indigo-500/10',
  };

  const accentStyles = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-indigo-500',
  };

  return (
    <div
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      className={`
        relative pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-xl border backdrop-blur-xl shadow-2xl
        transition-all duration-300 ease-out min-w-[320px] max-w-md group overflow-hidden
        ${statusStyles[toast.type] || statusStyles.info}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}
        animate-in slide-in-from-right-10 fade-in
      `}
    >
      {/* 左側色條裝飾 */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${accentStyles[toast.type] || accentStyles.info}`} />

      {icons[toast.type] || icons.info}

      <div className="flex-1 flex flex-col gap-0.5">
        <p className="text-sm font-bold tracking-wide">
          {toast.type === 'success' ? '完成' : toast.type === 'error' ? '出錯了' : toast.type === 'warning' ? '提醒' : '訊息'}
        </p>
        <p className="text-sm opacity-90 leading-snug">{toast.message}</p>
      </div>

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="opacity-40 hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded-lg"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* 渲染層 */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};