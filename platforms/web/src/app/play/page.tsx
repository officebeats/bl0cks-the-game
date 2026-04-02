"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HUD from "@/components/game/HUD";
import Board from "@/components/game/Board";
import Hand from "@/components/game/Hand";
import Narrator from "@/components/game/Narrator";
import useEngine from "@/hooks/useEngine";
import { Loader2, Terminal, AlertCircle } from "lucide-react";

export default function PlayPage() {
  const { state, engineStats, loading, error, startLevel, sendAction } = useEngine();
  const [booting, setBooting] = useState(true);

  // Initialize Level on mount — no artificial delay
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      await startLevel('01', 'chicago');
      if (!cancelled) setBooting(false);
    };
    init();
    return () => { cancelled = true; };
  }, [startLevel]);

  // Handle Gameplay Audio changes based on Level
  useEffect(() => {
    if (state && typeof state === 'object' && 'levelNumber' in state) {
      const levelNumber = (state as { levelNumber: number }).levelNumber;
      const padded = String(levelNumber).padStart(2, '0');
      window.dispatchEvent(new CustomEvent('bl0cks-audio-change', {
        detail: { src: `/audio/level-${padded}.mp3` }
      }));
    }
  }, [state]);

  const handleSelect = useCallback((option: string) => {
    sendAction(option);
  }, [sendAction]);

  const handlePlayCard = useCallback((cardId: string) => {
    sendAction(`PLAY ${cardId}`);
  }, [sendAction]);

  const typedState = state as Record<string, unknown> | null;

  // Show "Booting / Loading" screen
  if (booting || !state) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black bg-pattern gap-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative w-24 h-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 border-t-2 border-primary rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center text-primary">
              <Terminal size={32} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold font-outfit uppercase tracking-widest gradient-text">Initializing Engine</h2>
            <p className="text-xs font-mono text-foreground-muted">Loading ROM — Connecting to AI Instance...</p>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card border-error/30 p-4 max-w-sm flex items-start gap-3 bg-error/5"
          >
            <AlertCircle className="text-error shrink-0" size={20} />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-error uppercase">Connection Error</span>
              <p className="text-xs text-foreground-muted">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-[10px] uppercase font-bold text-error hover:underline"
              >
                Retry Initialization
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // Active Game UI
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-pattern selection:bg-primary selection:text-black">

      {/* Top HUD */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="w-full z-50"
      >
        <HUD
          influence={(engineStats as Record<string, number>)?.influence}
          maxInfluence={(engineStats as Record<string, number>)?.maxInfluence}
          heat={(engineStats as Record<string, number>)?.heat}
          maxHeat={20}
          turn={(engineStats as Record<string, number>)?.turn}
          maxTurns={(typedState?.clock as Record<string, number>)?.total || 12}
          phase={(engineStats as Record<string, string>)?.phase || "SCHEME"}
        />
      </motion.div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left/Center: Main Game Board Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-black/20">
          <div className="max-w-6xl mx-auto py-12 px-8">
            <header className="mb-12 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase">
                <span className="w-8 h-[1px] bg-primary" /> Level 0{typedState?.levelNumber || '1'}
              </div>
              <h1 className="text-5xl font-outfit font-black uppercase tracking-tight">
                {(typedState?.levelName as string)?.split(':')?.[0] || 'Chicago'}:
                <span className="gradient-text">{(typedState?.levelName as string)?.split(':')?.[1] || 'South Side'}</span>
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="h-4 w-[2px] bg-border" />
                <p className="text-foreground-muted text-sm max-w-lg">
                  {(typedState?.event as Record<string, string>)?.name || 'Awaiting orders.'}
                </p>
              </div>
            </header>

            <Board territories={(typedState?.territories as Array<Record<string, unknown>>) || []} />

            {/* Added spacer for Hand Area */}
            <div className="h-[280px]" />
          </div>
        </div>

        {/* Right: Narrator Panel (Sidebar) */}
        <motion.aside
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          className="w-[400px] hidden lg:block z-30"
        >
          <Narrator
            event={typedState?.event as { name: string; description: string } | undefined}
            choice={typedState?.choice as { description: string; optionA: string; optionB: string; optionBurn?: string; optionGambit?: string } | undefined}
            scanner={typedState?.scanner as string | undefined}
            history={(typedState?.history as string[]) || []}
            loading={loading}
            onSelect={handleSelect}
          />
        </motion.aside>
      </div>

      {/* Bottom: Hand Area */}
      <Hand cards={(typedState?.hand as Array<Record<string, unknown>>) || []} onPlay={handlePlayCard} />

      {/* Loading Overlay for mid-turn actions */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="flex items-center gap-3 p-4 glass rounded-xl shadow-2xl">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="text-sm font-bold uppercase tracking-widest text-primary animate-pulse">Syncing Engine...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decorations */}
      <div className="absolute top-[20%] right-[30%] w-[100px] h-[100px] bg-primary-glow rounded-full blur-[80px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[150px] h-[150px] bg-secondary-glow rounded-full blur-[100px] opacity-10 pointer-events-none" />
    </div>
  );
}
