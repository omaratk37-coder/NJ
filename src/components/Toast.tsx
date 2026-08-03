import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export interface ToastType {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

let toastListeners: Array<(toasts: ToastType[]) => void> = [];
let toastsList: ToastType[] = [];

export const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  const newToast: ToastType = {
    id: 'toast-' + Date.now() + Math.random().toString(36).substr(2, 4),
    message,
    type
  };
  
  // Max 3 toasts stacked as requested
  toastsList = [newToast, ...toastsList].slice(0, 3);
  toastListeners.forEach(listener => listener(toastsList));

  setTimeout(() => {
    toastsList = toastsList.filter(t => t.id !== newToast.id);
    toastListeners.forEach(listener => listener(toastsList));
  }, 4000); // Auto-dismiss 4 seconds
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    setToasts(toastsList);
    return () => {
      toastListeners = toastListeners.filter(l => l !== setToasts);
    };
  }, []);

  const removeToast = (id: string) => {
    toastsList = toastsList.filter(t => t.id !== id);
    setToasts(toastsList);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none" id="toast-container" style={{ direction: 'rtl' }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-white shadow-lg animate-slide-in-right transform transition-all duration-300`}
          style={{
            borderColor: 
              toast.type === 'success' ? '#10B981' : 
              toast.type === 'error' ? '#EF4444' : '#F59E0B'
          }}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
          </div>
          
          <div className="flex-1 text-sm font-medium text-slate-700 leading-relaxed font-sans">
            {toast.message}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
