"use client";

import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Radio, AlertTriangle } from "lucide-react";
import ChoiceBox from "./ChoiceBox";

interface Event {
  name: string;
  description: string;
}

interface Choice {
  description: string;
  optionA: string;
  optionB: string;
  optionBurn?: string;
  optionGambit?: string;
}

interface NarratorProps {
  event?: Event;
  choice?: Choice;
  scanner?: string;
  history?: string[];
  loading?: boolean;
  onSelect?: (option: string) => void;
}

const Narrator = memo(function Narrator({ event, choice, scanner, history = [], loading, onSelect }: NarratorProps) {
  // Pre-compute history items to avoid re-rendering unchanged entries
  const recentHistory = useMemo(() => history.slice(-3), [history]);

  return (
    <div className="flex flex-col gap-4 h-full p-4 border-l border-border bg-black/40 backdrop-blur-xl">
      {/* Scanner Section */}
      <div className="flex flex-col gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase flex items-center gap-1.5">
            <Radio size={12} className="animate-pulse" /> Scanner Online
          </span>
          <span className="text-[9px] font-mono text-primary/40">RX_SIGNAL_HIGH</span>
        </div>
        <div className="p-2 glass bg-black/30 rounded font-mono text-xs text-primary/80 overflow-hidden text-ellipsis whitespace-nowrap border-primary/10">
          {scanner || "[INTENT: NONE DETECTED]"}
        </div>
      </div>

      {/* Main Narrative Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-6 py-4">
        {/* Choice Box (Priority) */}
        {choice && (
          <ChoiceBox
            choice={choice}
            onSelect={onSelect || (() => {})}
            loading={loading}
          />
        )}

        {/* Active Event */}
        {event && !choice && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 px-2 py-1 bg-error/10 border border-error/30 rounded text-error w-fit">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{event.name}</span>
            </div>
            <p className="text-xl font-outfit leading-snug">
              &quot;{event.description}&quot;
            </p>
          </motion.div>
        )}

        {/* Narrative Flow */}
        <div className="flex flex-col gap-4 mt-4">
          <AnimatePresence>
            {recentHistory.map((text, idx) => (
              <motion.div
                key={`${text.slice(0, 32)}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.6 }}
                className="text-sm text-foreground-muted leading-relaxed"
              >
                {text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Input placeholder */}
      <div className="mt-auto border-t border-border pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 group cursor-pointer text-foreground-muted hover:text-white transition-colors">
          <Terminal size={14} className="group-hover:text-primary transition-colors" />
          <span className="text-xs font-mono uppercase tracking-wider">Awaiting Input...</span>
          <div className="w-1.5 h-3 bg-primary animate-pulse ml-1" />
        </div>

        <div className="flex items-center gap-2">
          <button className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
            History
          </button>
          <button className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
            Assets
          </button>
        </div>
      </div>
    </div>
  );
});

export default Narrator;
