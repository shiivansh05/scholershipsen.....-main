import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'alert' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-3.5 rounded-lg bg-paper-card border border-steel/20 shadow-floating flex items-start gap-3 animate-slideIn"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-sea shrink-0 mt-0.5" strokeWidth={1.5} />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber shrink-0 mt-0.5" strokeWidth={1.5} />
          )}

          <div className="flex-1">
            <h4 className="font-display font-semibold text-14 text-ink">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="text-12 text-steel mt-0.5 leading-snug">
                {toast.message}
              </p>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-steel hover:text-ink p-1"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  );
};
