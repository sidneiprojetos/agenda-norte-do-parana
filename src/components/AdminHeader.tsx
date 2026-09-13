import { useState } from 'react';
import type { FC } from 'react';
import { ShieldCheck, Plus } from 'lucide-react';
import { AppUser } from '../types';
import { loginWithGoogle } from '../firebase';

interface AdminHeaderProps {
  currentUser: AppUser | null;
  totalNotes: number;
  onOpenCreateForm: () => void;
}

export const AdminHeader: FC<AdminHeaderProps> = ({
  currentUser,
  totalNotes,
  onOpenCreateForm
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch (err) {
      console.error('Erro no login com Google:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-slate-800/80 pb-5">
      {/* Top row: Title and Authentication / Profile status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand and Subtitle */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white truncate">
              Agenda Norte do Paraná
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {currentUser?.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                PAINEL ADM
              </span>
            )}
            {/* Realtime sync badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Firestore Tempo Real
            </span>
          </div>
        </div>

        {/* Google Login for guests */}
        {!currentUser && (
          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="flex items-center gap-2 rounded-2xl border border-zinc-700/80 bg-[#222226] hover:bg-[#2c2c31] px-3.5 py-2 text-xs font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoggingIn ? 'Entrando...' : 'Entrar com Gmail'}</span>
          </button>
        )}
      </div>

      {/* Admin Action Bar (Create + Info) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="admin-create-note-btn"
            onClick={onOpenCreateForm}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-2.5 sm:px-3.5 py-2 text-xs font-semibold shadow-md shadow-amber-900/30 transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Novo Evento</span>
          </button>

          <span className="text-xs text-zinc-400 px-1 whitespace-nowrap">
            Total: <strong className="text-zinc-200">{totalNotes}</strong>
          </span>

          {!currentUser && (
            <span className="text-[11px] text-zinc-400 hidden md:inline">
              (Admin registrado: <strong className="text-amber-400">imc.sidnei@gmail.com</strong> • Conecte com o Gmail para ativar o Painel ADM)
            </span>
          )}
        </div>
      </div>
    </header>
  );
};