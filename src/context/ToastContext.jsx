import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // 新增通知
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // 3秒後自動移除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // 手動移除
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* 這是通知的渲染層 (Portal) */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300 min-w-[300px]
              ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : ''}
              ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-100' : ''}
              ${toast.type === 'info' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle size={20} className="text-rose-400" />}
            {toast.type === 'info' && <Info size={20} className="text-indigo-400" />}
            
            <p className="flex-1 text-sm font-medium tracking-wide">{toast.message}</p>
            
            <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};