import React, { useState } from 'react';
import { LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginWithGoogle } from '../firebase';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithGoogle();
      if (user && onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        setErrorMessage('Login cancelado. Tente novamente.');
      } else if (err?.code === 'auth/network-request-failed') {
        setErrorMessage('Falha de conexão com os servidores do Google. Verifique sua internet.');
      } else {
        setErrorMessage(
          err?.message || 'Não foi possível autenticar com o Google. Tente novamente.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#09090b] px-4 py-8 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Background Insanos MC Emblem */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <img
          src="/insanos.png"
          alt="Insanos MC Brasil"
          className="max-h-[85vh] max-w-[90vw] object-contain opacity-25 filter contrast-125 drop-shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#09090b_85%)]" />
      </div>

      {/* Login Card */}
      <div
        id="login-card"
        className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-800/90 bg-[#121215]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center"
      >
        {/* Emblem on top */}
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-900/90 border border-zinc-800 p-2 shadow-inner">
          <img
            src="/insanos.png"
            alt="Insanos MC Brasil"
            className="h-full w-full object-contain filter contrast-125"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
          Agenda Norte do Paraná
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-semibold tracking-wider text-amber-500 uppercase">
          Insanos Moto Clube • Brasil
        </p>

        <div className="my-6 h-px w-full bg-zinc-800/80" />

        {/* Description */}
        <div className="mb-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-4 text-left text-xs text-zinc-300 leading-relaxed">
          <div className="flex items-center gap-2 mb-2 font-semibold text-zinc-200">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Acesso Restrito e Seguro</span>
          </div>
          <p>
            Esta agenda é restrita aos membros e integrantes autorizados do{' '}
            <strong className="text-white">Insanos MC</strong>.
          </p>
          <p className="mt-2 text-zinc-400">
            Para acessar ou solicitar entrada, identifique-se através da sua conta Google/Gmail.
            Novos cadastros passam por aprovação da administração.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-900/80 bg-rose-950/40 p-3 text-left text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Login Button */}
        <button
          id="google-login-main-btn"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-[#1c1c20] hover:bg-[#26262b] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-98 disabled:opacity-60"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          ) : (
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
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
          )}
          <span>{isLoading ? 'Conectando ao Google...' : 'Entrar com Conta Google'}</span>
        </button>

        {/* Footer info */}
        <p className="mt-6 text-[11px] text-zinc-500">
          Administração: <span className="text-zinc-400 font-mono">imc.sidnei@gmail.com</span>
        </p>
      </div>
    </div>
  );
}
