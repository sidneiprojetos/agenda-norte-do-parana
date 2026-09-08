import React from 'react';
import { ShieldX, LogOut } from 'lucide-react';
import { UserProfile } from '../types';
import { logoutUser } from '../firebase';

interface RejectedScreenProps {
  userProfile: UserProfile;
}

export function RejectedScreen({ userProfile }: RejectedScreenProps) {
  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#09090b] px-4 py-8 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-rose-900/60 bg-[#121215]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/40 border border-rose-900/80 p-2 text-rose-400">
          <ShieldX className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Acesso Não Autorizado
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Agenda Norte do Paraná • Insanos Moto Clube
        </p>

        <div className="my-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 text-left text-xs">
          <p className="font-semibold text-zinc-200">{userProfile.displayName}</p>
          <p className="text-zinc-400 font-mono mt-0.5">{userProfile.email}</p>
          <div className="mt-2 text-rose-400 font-medium">
            Seu perfil foi desativado ou recusado pela administração.
          </div>
        </div>

        <p className="mb-6 text-xs text-zinc-400 leading-relaxed">
          Caso considere que isto é um engano, entre em contato diretamente com a diretoria do motoclube pelo e-mail <strong className="text-zinc-200">imc.sidnei@gmail.com</strong>.
        </p>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 py-3 text-xs font-semibold text-white transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
}
