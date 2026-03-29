"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Brain, Hexagon, ChevronRight, Terminal } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-pattern relative selection:bg-primary selection:text-black">
      {/* Background Glow Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-glow rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-glow rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-7xl mx-auto w-full z-10">
        <motion.div 
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-foreground-muted">
              v2.0.0 Alpha Live
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-8xl font-bold mb-6 font-outfit"
          >
            B L <span className="gradient-text">0</span> C K S
          </motion.h1>

          {/* Tagline */}
          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-foreground-muted mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            The first AI-driven strategy card game with a persistent, 
            evolving narrative world. Every move leaves a trail.
          </motion.p>

          {/* Calls to Action */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            <Link href="/play">
              <button className="glow-btn flex items-center gap-3 text-lg">
                <Zap size={20} />
                Initialize Engine
              </button>
            </Link>
            <button className="px-8 py-3 rounded-md border border-border bg-white/5 hover:bg-white/10 transition-colors font-semibold flex items-center gap-2">
              <Terminal size={18} />
              CLI Version
            </button>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Feature 1 */}
          <motion.div variants={itemVariants} className="glass-card p-8 flex flex-col gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-lg items-center justify-center flex text-primary">
              <Brain size={24} />
            </div>
            <h3 className="text-xl">AI-Driven ROMs</h3>
            <p className="text-foreground-muted text-sm line-clamp-3">
              Content is streamed dynamically from ROM modules, powered by state-of-the-art LLMs that remember your past betrayals.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={itemVariants} className="glass-card p-8 flex flex-col gap-4">
            <div className="bg-secondary/10 w-12 h-12 rounded-lg items-center justify-center flex text-secondary">
              <Shield size={24} />
            </div>
            <h3 className="text-xl">Hidden Stat Layers</h3>
            <p className="text-foreground-muted text-sm line-clamp-3">
              Every character has visible and hidden loyalty. SNITCH to reveal the truth before they flip the block on you.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={itemVariants} className="glass-card p-8 flex flex-col gap-4">
            <div className="bg-success/10 w-12 h-12 rounded-lg items-center justify-center flex text-success">
              <Hexagon size={24} />
            </div>
            <h3 className="text-xl">Cross-Platform Sync</h3>
            <p className="text-foreground-muted text-sm line-clamp-3">
              Play on your Terminal, the Web, or Mobile with the same persistent Ledger and Stash across all sessions.
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t border-border mt-12 backdrop-blur-md relative z-10 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xl font-outfit font-bold">
              <Hexagon className="text-primary" size={20} />
              BL0CKS
            </div>
            <p className="text-xs text-foreground-muted max-w-xs">
              Built by Ernesto &apos;Beats&apos; Rodriguez. AI-agnostic game engine v2.0.0.
            </p>
          </div>
          
          <div className="flex items-center gap-8 text-sm font-medium text-foreground-muted">
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">ROM Marketplace</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-primary transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
