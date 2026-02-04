import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

/**
 * 📝 FormInput - 高品質表單輸入組件
 * =====================================
 * 支援多種狀態、動畫回饋與驗證顯示。
 * 
 * Props:
 * - label: 輸入框標籤
 * - error: 錯誤訊息 (字串)
 * - success: 是否顯示成功狀態 (布林)
 * - icon: 左側圖示
 * - type: 輸入框類型 (支援 password 切換)
 * - helperText: 輔助說明文字
 */

const FormInput = React.forwardRef(({
    label,
    error,
    success,
    icon: Icon,
    type = 'text',
    helperText,
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const baseInputStyles = `
    w-full px-4 py-3 bg-white/5 border rounded-xl 
    text-white placeholder:text-white/20 outline-none
    transition-all duration-300 ease-out
    backdrop-blur-md
  `;

    const stateStyles = error
        ? 'border-rose-500/50 focus:border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
        : success
            ? 'border-emerald-500/50 focus:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            : isFocused
                ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] bg-white/10'
                : 'border-white/10 hover:border-white/20';

    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && (
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                {Icon && (
                    <div className={`
            absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300
            ${error ? 'text-rose-400' : success ? 'text-emerald-400' : isFocused ? 'text-indigo-400' : 'text-white/30'}
          `}>
                        <Icon size={18} />
                    </div>
                )}

                <input
                    ref={ref}
                    type={inputType}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
            ${baseInputStyles}
            ${stateStyles}
            ${Icon ? 'pl-11' : ''}
            ${isPassword ? 'pr-11' : ''}
            ${className}
          `}
                    {...props}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-1"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}

                {error && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none animate-in fade-in zoom-in duration-300 mr-8">
                        <AlertCircle size={18} className="text-rose-500" />
                    </div>
                )}

                {success && !error && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                )}
            </div>

            {/* 底部提示訊息 */}
            {(error || helperText) && (
                <div className={`text-[11px] font-medium ml-1 animate-in slide-in-from-top-1 duration-300 ${error ? 'text-rose-400' : 'text-white/40'}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

FormInput.displayName = 'FormInput';

export default FormInput;
