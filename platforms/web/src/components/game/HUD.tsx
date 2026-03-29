"use client";

import { motion } from "framer-motion";
import { Zap, Flame, Clock, ShieldCheck, Hexagon } from "lucide-react";

interface HUDProps {
  influence: number;
  maxInfluence: number;
  heat: number;
  maxHeat: number;
  turn: number;
  maxTurns: number;
  phase: string;
}

export default function HUD({ 
  influence = 3, 
  maxInfluence = 6, 
  heat = 0, 
  maxHeat = 20,
  turn = 1,
  maxTurns = 12,
  phase = "DAWN"
}: Partial<HUDProps>) {
  
  const infPerc = (influence / maxInfluence) * 100;
  const heatPerc = (heat / maxHeat) * 100;
  const clockPerc = (turn / maxTurns) * 100;

  return (
    <div className="w-full glass rounded-xl p-4 flex items-center justify-between gap-8 h-20 border-b border-border shadow-2xl z-20">
      {/* Level / Turn Info */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase">Turn</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-outfit">{turn}</span>
            <span className="text-foreground-muted font-mono leading-none">/ {maxTurns}</span>
          </div>
        </div>
        
        <div className="h-10 w-[1px] bg-border" />
        
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase">Phase</span>
          <motion.span 
            key={phase}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-lg font-bold font-mono text-primary flex items-center gap-2"
          >
            <ShieldCheck size={18} />
            {phase}
          </motion.span>
        </div>
      </div>

      {/* Main Meters */}
      <div className="flex-1 flex items-center gap-12 max-w-2xl">
        {/* Influence Bar */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase flex items-center gap-1">
              <Zap size={10} className="text-primary" /> Influence
            </span>
            <span className="text-sm font-bold font-mono text-primary">{influence} / {maxInfluence}</span>
          </div>
          <div className="hud-bar relative shadow-[0_0_15px_rgba(0,210,255,0.1)]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${infPerc}%` }}
              className="hud-bar-fill bg-gradient-to-r from-primary to-[#0082FF]"
              style={{ boxShadow: '0 0 10px var(--primary-glow)' }}
            />
          </div>
        </div>

        {/* Heat Bar */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase flex items-center gap-1">
              <Flame size={10} className="text-error" /> Heat
            </span>
            <span className="text-sm font-bold font-mono text-error">{heat} / {maxHeat}</span>
          </div>
          <div className="hud-bar">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${heatPerc}%` }}
              className="hud-bar-fill bg-gradient-to-r from-error via-[#FF7E00] to-warning"
              style={{ boxShadow: heat > 10 ? '0 0 10px rgba(244, 63, 94, 0.3)' : 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats / Icons */}
      <div className="flex items-center gap-4">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-10 h-10 rounded-lg glass flex items-center justify-center text-foreground-muted hover:text-primary transition-colors cursor-help"
          title="Stash Assets: 0"
        >
          <div className="relative">
            <Hexagon size={20} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-10 h-10 rounded-lg glass flex items-center justify-center text-foreground-muted hover:text-error transition-colors cursor-help"
          title="Ledger Grudges: 0"
        >
          <Clock size={20} />
        </motion.div>
      </div>
    </div>
  );
}
