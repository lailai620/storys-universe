import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * 🎯 統一按鈕元件 (Unified Button Component)
 * ==========================================
 * 提供一致的按鈕樣式系統，支援多種變體與狀態
 * 
 * 變體 (variant):
 * - primary: 主要操作 (白底、深色文字)
 * - secondary: 次要操作 (透明底、白色邊框)
 * - ghost: 幽靈按鈕 (無邊框、hover 時顯示背景)
 * - danger: 危險操作 (紅色系)
 * - gradient: 漸層按鈕 (紫藍漸層)
 * 
 * 尺寸 (size):
 * - sm: 小型按鈕
 * - md: 中型按鈕 (預設)
 * - lg: 大型按鈕
 * - icon: 圖示按鈕 (正方形)
 */

const Button = React.forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    onClick,
    onMouseEnter,
    ...props
}, ref) => {

    // 基礎樣式
    const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-bold rounded-full
    transition-all duration-200 ease-out
    cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    active:scale-95
  `;

    // 變體樣式
    const variantStyles = {
        primary: `
      bg-white text-slate-900
      shadow-[0_0_15px_rgba(255,255,255,0.2)]
      hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]
      hover:scale-105
      focus:ring-white/50
    `,
        secondary: `
      bg-transparent text-white
      border border-white/30
      backdrop-blur-md
      hover:bg-white/10 hover:border-white/50
      hover:scale-105
      focus:ring-white/30
    `,
        ghost: `
      bg-transparent text-white
      hover:bg-white/10
      focus:ring-white/20
    `,
        danger: `
      bg-rose-500/20 text-rose-400
      border border-rose-500/30
      hover:bg-rose-500/30 hover:border-rose-500/50
      hover:scale-105
      focus:ring-rose-500/50
    `,
        gradient: `
      bg-gradient-to-r from-indigo-500 to-purple-500 text-white
      shadow-lg shadow-indigo-500/30
      hover:shadow-xl hover:shadow-indigo-500/40
      hover:scale-105
      focus:ring-indigo-500/50
    `,
        'gradient-amber': `
      bg-gradient-to-r from-amber-500 to-orange-500 text-white
      shadow-lg shadow-amber-500/30
      hover:shadow-xl hover:shadow-amber-500/40
      hover:scale-105
      focus:ring-amber-500/50
    `,
    };

    // 尺寸樣式
    const sizeStyles = {
        sm: 'px-4 py-1.5 text-xs',
        md: 'px-5 py-2 text-sm',
        lg: 'px-8 py-3 text-base',
        icon: 'w-10 h-10 p-0',
    };

    // 組合樣式
    const combinedStyles = `
    ${baseStyles}
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.md}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();

    // 處理點擊
    const handleClick = (e) => {
        if (loading || disabled) return;
        onClick?.(e);
    };

    return (
        <button
            ref={ref}
            className={combinedStyles}
            onClick={handleClick}
            onMouseEnter={onMouseEnter}
            disabled={disabled || loading}
            {...props}
        >
            {/* Loading Spinner */}
            {loading && (
                <Loader2
                    size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
                    className="animate-spin"
                />
            )}

            {/* Left Icon */}
            {!loading && Icon && iconPosition === 'left' && (
                <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
            )}

            {/* Children */}
            {size !== 'icon' && children}

            {/* Icon-only button */}
            {size === 'icon' && !loading && Icon && (
                <Icon size={18} />
            )}

            {/* Right Icon */}
            {!loading && Icon && iconPosition === 'right' && size !== 'icon' && (
                <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
            )}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
