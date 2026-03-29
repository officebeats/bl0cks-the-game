"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Zap, Info, Shield, Brain, Skull, Radio, MapPin } from "lucide-react";

interface CardProps {
  id: string;
  type: 'people' | 'move' | 'status';
  name: string;
  role?: string;
  loyaltyVisible?: number;
  loyaltyHidden?: number;
  keywords?: string[];
  cost?: number;
  description?: string;
  faction?: string;
  index: number;
  onPlay?: (id: string) => void;
}

const getRoleIcon = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'enforcer': return <Shield size={14} />;
    case 'broker': return <Zap size={14} />;
    case 'informant': return <Brain size={14} />;
    case 'runner': return <Radio size={14} />;
    default: return <User size={14} />;
  }
};

const getKeywordIcon = (keyword: string) => {
  switch (keyword?.toLowerCase()) {
    case 'block': return <Shield size={12} />;
    case 'connect': return <Zap size={12} />;
    case 'flip': return <Skull size={12} />;
    case 'shadow': return <MapPin size={12} />;
    default: return <Info size={12} />;
  }
};

export function Card({ 
  id,
  type, 
  name, 
  role, 
  loyaltyVisible, 
  keywords = [], 
  cost = 1,
  description,
  index,
  onPlay
}: CardProps) {
  
  const rotation = (index - 2) * 5; // Fan effect
  const yOffset = Math.abs(index - 2) * 10;

  return (
    <motion.div
      layout
      initial={{ y: 200, opacity: 0, rotate: rotation }}
      animate={{ 
        y: yOffset, 
        opacity: 1, 
        rotate: rotation,
        transition: { delay: index * 0.1, duration: 0.5, ease: "backOut" }
      }}
      whileHover={{ 
        y: -140, 
        rotate: 0, 
        scale: 1.15,
        zIndex: 50,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      onClick={() => onPlay?.(id)}
      className={`card-face glass-card relative bg-[#1c1c24] cursor-pointer group w-[220px] shadow-2xl overflow-hidden`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold tracking-widest text-[#00d2ff] uppercase flex items-center gap-1">
            {type === 'people' ? getRoleIcon(role) : <Zap size={14} />}
            {type.toUpperCase()}
          </span>
          <h3 className="card-title font-outfit text-xl leading-tight text-white group-hover:text-primary transition-colors">
            {name}
          </h3>
        </div>
        <div className="w-8 h-8 rounded-full border border-primary/30 items-center justify-center flex font-mono text-sm text-primary font-bold">
          {cost}
        </div>
      </div>

      {/* Stats/Badge */}
      {type === 'people' && (
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between text-xs font-medium text-foreground-muted">
            <span className="flex items-center gap-1.5 uppercase tracking-wide">
              Loyalty 
              <span className="text-white font-bold">{loyaltyVisible}/10</span>
            </span>
            <div className="flex items-center gap-1">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-3 rounded-[1px] ${i < (loyaltyVisible || 0) ? 'bg-primary' : 'bg-white/10'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Body / Description */}
      <div className="text-xs text-foreground-muted leading-relaxed line-clamp-4 min-h-[4.5em]">
        {description || (type === 'people' ? `A skilled ${role} affiliated with your current operations.` : 'Standard tactical move.')}
      </div>

      {/* Keywords / Tags */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-auto">
          {keywords.map(kw => (
            <span key={kw} className="px-2 py-0.5 rounded-sm bg-primary/5 border border-primary/20 text-[9px] font-bold text-primary uppercase flex items-center gap-1">
              {getKeywordIcon(kw)}
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="absolute left-0 bottom-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
    </motion.div>
  );
}

export default function Hand({ cards = [], onPlay }: { cards: any[], onPlay?: (id: string) => void }) {
  return (
    <div className="fixed bottom-[-60px] left-1/2 -translate-x-1/2 flex items-end justify-center h-[300px] z-40 w-full max-w-4xl px-20">
      <AnimatePresence>
        {cards.map((card, idx) => (
          <Card key={card.id || idx} {...card} index={idx} onPlay={onPlay} />
        ))}
      </AnimatePresence>
    </div>
  );
}
