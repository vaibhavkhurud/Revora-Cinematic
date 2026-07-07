import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ICONS = {
    success: <CheckCircle size={20} className="text-green-400 shrink-0" />,
    error: <XCircle size={20} className="text-red-400 shrink-0" />,
    warning: <AlertCircle size={20} className="text-yellow-400 shrink-0" />,
};

const COLORS = {
    success: 'border-green-500/40 bg-green-500/10',
    error: 'border-red-500/40 bg-red-500/10',
    warning: 'border-yellow-500/40 bg-yellow-500/10',
};

const ToastItem = ({ toast, onRemove }) => (
    <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border glass shadow-lg
            ${COLORS[toast.type]} animate-[slideIn_0.3s_ease_forwards]`}
        style={{ minWidth: '280px', maxWidth: '380px' }}
    >
        {ICONS[toast.type]}
        <p className="text-sm text-[var(--text-h)] flex-1">{toast.message}</p>
        <button onClick={() => onRemove(toast.id)} className="text-gray-400 hover:text-white transition-colors">
            <X size={16} />
        </button>
    </div>
);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const remove = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onRemove={remove} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
