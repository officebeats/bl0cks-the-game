"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { User, MapPin, Shield, Zap, Info, Crosshair } from "lucide-react";
import styles from "./Board.module.css";

interface Territory {
  id: string;
  name: string;
  control: 'you' | 'rival' | 'contested' | 'neutral';
  faction?: string;
  occupants?: number;
  landmarks?: string[];
  blockValue?: number;
}

const STATUS_CLASS_MAP: Record<string, string> = {
  you: styles.cardYou,
  rival: styles.cardRival,
  contested: styles.cardContested,
  neutral: styles.cardNeutral,
};

const STATUS_LABEL_MAP: Record<string, string> = {
  you: 'Controlled',
  rival: 'Rival Domain',
  contested: 'Conflict Zone',
  neutral: 'Open Block',
};

export const BlockCard = memo(function BlockCard({
  name,
  control,
  faction,
  occupants = 1,
  landmarks = [],
}: Territory) {
  const statusClass = STATUS_CLASS_MAP[control] ?? styles.cardNeutral;
  const statusLabel = STATUS_LABEL_MAP[control] ?? control;

  const landmarkElements = useMemo(
    () => landmarks.slice(0, 2).map(lm => (
      <span key={lm} className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-black/30 border border-white/5 text-[9px] uppercase tracking-wide text-foreground-muted">
        <MapPin size={10} className="opacity-50" />
        {lm}
      </span>
    )),
    [landmarks]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className={`glass-card flex flex-col p-6 min-h-[180px] group transition-all relative overflow-hidden ${statusClass}`}
    >
      {/* Background Highlight */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 blur-[40px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 ${styles.highlight}`}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
            <span className={`text-[10px] font-bold tracking-widest uppercase ${styles.label}`}>
              {statusLabel}
            </span>
          </div>
          <h3 className="text-xl font-outfit uppercase font-bold tracking-tight group-hover:text-primary transition-colors">
            {name}
          </h3>
          <span className="text-[10px] font-mono text-foreground-muted uppercase">
            {faction || 'Neutral Force'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-2 glass rounded-md bg-white/5 border border-white/10 group-hover:border-primary/30 transition-colors">
          <User size={12} className="text-foreground-muted" />
          <span className="text-xs font-mono font-bold leading-none">{occupants}</span>
        </div>
      </div>

      {/* Stats/Body */}
      <div className="flex flex-col gap-2 mt-auto">
        <div className="flex flex-wrap gap-2">
          {landmarkElements}
        </div>
      </div>

      {/* Action Hover Tooltip */}
      <div className="absolute right-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="w-8 h-8 rounded-full glass hover:bg-primary/20 hover:text-primary transition-colors items-center justify-center flex" title="Inspect">
          <Info size={14} />
        </button>
        <button className="w-8 h-8 rounded-full glass hover:bg-error/20 hover:text-error transition-colors items-center justify-center flex" title="War">
          <Crosshair size={14} />
        </button>
      </div>

      {/* Bottom Bar Indicator */}
      <div className={`absolute inset-x-0 bottom-0 h-[2px] opacity-20 ${styles.bottomBar}`} />
    </motion.div>
  );
});

const Board = memo(function Board({ territories = [] }: { territories: Territory[] }) {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {territories.map(t => (
        <BlockCard key={t.id} {...t} />
      ))}
    </div>
  );
});

export default Board;
