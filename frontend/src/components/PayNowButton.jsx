import React from 'react';
import { CreditCard, Loader2, Zap } from 'lucide-react';

const formatCurrency = (val) => {
    if (val === undefined || val === null) return null;
    return Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
};

const PayNowButton = ({
    onClick,
    loading = false,
    amount,
    disabled = false,
    size = 'md',
    fullWidth = false,
    className = ''
}) => {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
        md: 'px-4 py-2 text-sm gap-2 rounded-xl',
        lg: 'px-6 py-3 text-base gap-2.5 rounded-xl'
    };

    const formattedAmount = formatCurrency(amount);

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                relative inline-flex items-center justify-center font-bold text-white
                bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500
                hover:from-blue-500 hover:via-indigo-500 hover:to-sky-400
                active:from-blue-700 active:to-sky-600
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:shadow-xl
                border border-indigo-400/30 hover:border-indigo-300/60
                transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                group overflow-hidden
                ${sizeClasses[size] || sizeClasses.md}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
        >
            {/* Shimmer effect highlight on hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

            {loading ? (
                <>
                    <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin text-white shrink-0" />
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <CreditCard size={size === 'sm' ? 13 : size === 'lg' ? 19 : 15} className="group-hover:scale-110 transition-transform text-sky-200" />
                        <Zap size={size === 'sm' ? 11 : size === 'lg' ? 15 : 13} className="text-yellow-300 animate-pulse hidden sm:inline-block" />
                    </div>
                    <span className="tracking-wide">Pay Now</span>
                    {formattedAmount && (
                        <span className="ml-1 px-2 py-0.5 rounded-md bg-white/20 text-white font-mono text-[11px] sm:text-xs font-semibold backdrop-blur-sm border border-white/20 shadow-inner">
                            {formattedAmount}
                        </span>
                    )}
                </>
            )}
        </button>
    );
};

export default PayNowButton;
