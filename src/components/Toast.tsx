import type { FC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}

const STYLES: Record<
  ToastType,
  { Icon: typeof CheckCircle2; iconColor: string; bar: string; border: string; text: string }
> = {
  success: {
    Icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    bar: 'bg-emerald-400',
    border: 'border-emerald-500/50',
    text: 'text-emerald-200'
  },
  error: {
    Icon: XCircle,
    iconColor: 'text-rose-400',
    bar: 'bg-rose-400',
    border: 'border-rose-500/50',
    text: 'text-rose-200'
  },
  info: {
    Icon: Info,
    iconColor: 'text-sky-400',
    bar: 'bg-sky-400',
    border: 'border-sky-500/50',
    text: 'text-sky-200'
  }
};

export const ToastContainer: FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const { Icon, iconColor, bar, border, text } = STYLES[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto relative flex items-center gap-2.5 overflow-hidden rounded-xl border ${border} bg-[#18181b] py-3 pl-3 pr-8 shadow-2xl`}
              role="status"
            >
              <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
              <span className={`max-w-[280px] text-xs font-semibold ${text}`}>
                {toast.message}
              </span>
              <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Dispensar notificação"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-500 transition hover:bg-zinc-700/60 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <motion.span
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 ${bar}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};