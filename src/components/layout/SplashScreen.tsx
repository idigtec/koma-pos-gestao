import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, ShieldCheck, Wifi, Sparkles, CheckCircle2 } from 'lucide-react';
import { KomaLogo } from '../common/KomaLogo';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  const STAGES = [
    'Carregando estrutura visual e módulos...',
    'Verificando persistência e cache offline...',
    'Inicializando IndexedDB e Service Worker...',
    'Carregando contas, categorias e lançamentos...',
    'Pronto para operação!'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onFinish?.();
          }, 300);
          return 100;
        }
        const next = prev + 5;
        const currentStage = Math.min(
          Math.floor((next / 100) * STAGES.length),
          STAGES.length - 1
        );
        setStageIndex(currentStage);
        return next;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-slate-950 via-stone-900 to-slate-950 text-white font-sans p-6 select-none animate-in fade-in duration-300">
      {/* Top Bar Branding */}
      <div className="w-full flex items-center justify-between max-w-md pt-4 opacity-80 text-xs text-stone-400">
        <span className="flex items-center gap-1.5 font-semibold text-orange-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>KOMA v2.5 Pro</span>
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px]">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>Offline Ready</span>
        </span>
      </div>

      {/* Center Branding & Mascot/Icon */}
      <div className="flex flex-col items-center justify-center text-center space-y-5 my-auto max-w-md">
        {/* Animated Brand Emblem */}
        <div className="relative">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-orange-500/30 transform hover:scale-105 transition-transform duration-300">
            <UtensilsCrossed className="w-14 h-14 text-white drop-shadow-md" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-950">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Title & Slogan */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>KOMA Fast Food</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
              Takeaway
            </span>
          </h1>
          <p className="text-sm font-medium text-orange-400/90 tracking-wide uppercase text-xs">
            Fresh • Tasty • Happy
          </p>
          <p className="text-xs text-stone-400 max-w-xs mx-auto pt-1 leading-relaxed">
            Plataforma Omnichannel de Gestão Comercial, PDV e Controle Financeiro Integrado.
          </p>
        </div>

        {/* Animated Progress Container */}
        <div className="w-full max-w-xs space-y-2 pt-4">
          <div className="flex justify-between text-[11px] font-semibold text-stone-400">
            <span className="truncate max-w-[200px] text-orange-300 animate-pulse">
              {STAGES[stageIndex]}
            </span>
            <span className="font-mono text-stone-300">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-700/50">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 rounded-full transition-all duration-150 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-md pb-4 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-800/80 pt-4">
        <span>Moçambique • Meticais (MT)</span>
        <button
          onClick={onFinish}
          className="text-stone-400 hover:text-white transition-colors underline cursor-pointer"
        >
          Acessar Agora →
        </button>
      </div>
    </div>
  );
};
