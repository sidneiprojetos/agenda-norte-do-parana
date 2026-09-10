import { useState } from 'react';
import { Clock, RefreshCw, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { logoutUser } from '../firebase';

interface PendingApprovalScreenProps {
  userProfile: UserProfile;
  onRefresh: () => void;
}

export function PendingApprovalScreen({
  userProfile,
  onRefresh
}: PendingApprovalScreenProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#09090b] px-4 py-8 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Background Siluar Core Emblem */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <img
          src="/insanos.png"
          alt="Siluar Core"
          className="max-h-[85vh] max-w-[90vw] object-contain opacity-25 filter contrast-125 drop-shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#09090b_85%)]" />
      </div>

      {/* Card */}
      <div
        id="pending-approval-card"
        className="relative z-10 w-full max-w-lg rounded-3xl border border-amber-500/40 bg-[#121215]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center"
      >
        {/* Siluar Core Mini Badge */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 p-2 shadow-inner">
          <img
            src="/insanos.png"
            alt="Siluar Core"
            className="h-full w-full object-contain filter contrast-125"
          />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 mb-3 animate-pulse">
          <Clock className="h-3.5 w-3.5" />
          <span>Aguardando Aprovação da Administração</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Solicitação Recebida
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Agenda Norte do Paraná • Siluar Core
        </p>

        {/* User Card */}
        <div className="my-5 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5 text-left">
          {userProfile.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.displayName || 'Usuário'}
              className="h-12 w-12 rounded-xl object-cover border border-amber-500/50"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 font-bold text-black text-lg">
              {userProfile.displayName?.[0] || 'U'}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-sm text-zinc-100 truncate">
              {userProfile.displayName}
            </span>
            <span className="text-xs text-zinc-400 font-mono truncate">
              {userProfile.email}
            </span>
            <span className="mt-1 text-[11px] text-amber-400/90">
              Solicitado em: {new Date(userProfile.createdAt).toLocaleDateString('pt-BR')} às {new Date(userProfile.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 text-left text-xs text-zinc-300 leading-relaxed space-y-2">
          <p className="flex items-start gap-2 text-zinc-200">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            <span>Sua conta Google foi autenticada com sucesso no sistema.</span>
          </p>
          <p className="flex items-start gap-2 text-zinc-300">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
            <span>
              O administrador (<strong className="text-amber-300">imc.sidnei@gmail.com</strong>) precisa aprovar seu perfil no painel administrativo antes que você possa visualizar a agenda e os compromissos.
            </span>
          </p>
          <p className="text-[11px] text-zinc-400 pt-1">
            💡 Assim que o administrador liberar seu acesso, esta tela atualizará automaticamente para a agenda.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            id="refresh-status-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 py-3 text-xs font-bold text-amber-300 transition active:scale-98 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Verificando...' : 'Verificar se fui aprovado'}</span>
          </button>

          <button
            id="pending-logout-btn"
            onClick={handleSignOut}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-3 text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <LogOut className="h-4 w-4 text-zinc-400" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
