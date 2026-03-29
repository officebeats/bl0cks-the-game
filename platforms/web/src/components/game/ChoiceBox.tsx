"use client";

import { motion } from "framer-motion";
import { Zap, Skull, ShieldOff } from "lucide-react";

interface Choice {
  description: string;
  optionA: string;
  optionB: string;
  optionBurn?: string;
  optionGambit?: string;
}

interface ChoiceBoxProps {
  choice: Choice;
  onSelect: (option: string) => void;
  loading?: boolean;
}

export default function ChoiceBox({ choice, onSelect, loading }: ChoiceBoxProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 glass rounded-xl border-primary/40 bg-primary/5 flex flex-col gap-6 shadow-[0_0_40px_rgba(0,210,255,0.15)]"
    >
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Decision Required</span>
        <p className="text-lg font-outfit text-white leading-snug">
          {choice.description}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Option A */}
        <button 
          onClick={() => onSelect('A')}
          disabled={loading}
          className="w-full p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all text-left group flex items-center justify-between"
        >
          <span className="text-sm font-medium group-hover:text-primary transition-colors">{choice.optionA}</span>
          <span className="text-[10px] font-bold text-foreground-muted opacity-50 group-hover:opacity-100 uppercase">Option A</span>
        </button>

        {/* Option B */}
        <button 
          onClick={() => onSelect('B')}
          disabled={loading}
          className="w-full p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-secondary/20 hover:border-secondary/50 transition-all text-left group flex items-center justify-between"
        >
          <span className="text-sm font-medium group-hover:text-secondary transition-colors">{choice.optionB}</span>
          <span className="text-[10px] font-bold text-foreground-muted opacity-50 group-hover:opacity-100 uppercase">Option B</span>
        </button>

        {/* Option Gambit (Optional) */}
        {choice.optionGambit && (
          <button 
            onClick={() => onSelect('G')}
            disabled={loading}
            className="w-full p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 hover:from-primary/20 hover:to-secondary/20 hover:border-primary transition-all text-left group flex items-center justify-between relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/5 animate-pulse" />
            <div className="flex flex-col relative z-10">
              <span className="text-xs font-bold uppercase tracking-tighter text-primary flex items-center gap-1">
                <Skull size={10} /> Gambit Available
              </span>
              <span className="text-sm font-medium text-white">{choice.optionGambit}</span>
            </div>
            <span className="text-[10px] font-bold text-primary group-hover:animate-bounce uppercase relative z-10">High Risk</span>
          </button>
        )}

        {/* Option Burn (Optional) */}
        {choice.optionBurn && (
          <button 
            onClick={() => onSelect('Burn')}
            disabled={loading}
            className="w-full mt-2 py-2 text-[10px] font-bold text-error/60 uppercase tracking-widest hover:text-error transition-colors flex items-center justify-center gap-2"
          >
            <ShieldOff size={12} />
            {choice.optionBurn}
          </button>
        )}
      </div>
    </motion.div>
  );
}
