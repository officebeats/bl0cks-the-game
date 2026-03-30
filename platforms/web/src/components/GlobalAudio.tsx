"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";

export default function GlobalAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // We mount audio globally so it persists seamlessly 
    const audio = new Audio("/audio/title-screen.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    (window as any).__globalAudio = audio;

    const handleAudioChange = (e: any) => {
      const newSrc = e.detail?.src;
      if (!newSrc || audio.src.endsWith(newSrc)) return;

      const wasPlaying = !audio.paused;
      audio.src = newSrc;
      audio.load();
      if (wasPlaying) {
        audio.play().catch(() => {});
      }
    };

    window.addEventListener('bl0cks-audio-change', handleAudioChange);

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        console.log("Autoplay blocked. User interaction required.");
        setShowPrompt(true);
      });

    return () => {
      audio.pause();
      delete (window as any).__globalAudio;
      window.removeEventListener('bl0cks-audio-change', handleAudioChange);
    };
  }, []);

  const toggleMute = () => {
    const audio = (window as any).__globalAudio;
    if (!audio) return;
    
    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true);
        setShowPrompt(false);
      });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3">
      {showPrompt && !isPlaying && (
        <span className="text-[10px] uppercase font-bold tracking-widest text-primary animate-pulse bg-black/50 px-2 py-1 rounded border border-primary/20 backdrop-blur-sm">
          Click anywhere to start music
        </span>
      )}
      <button 
        onClick={toggleMute}
        className="w-10 h-10 rounded-full glass flex items-center justify-center text-foreground-muted hover:text-primary transition-colors hover:scale-110 active:scale-95"
        title={isPlaying ? "Mute Music" : "Play Music"}
      >
        {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} className="opacity-50" />}
      </button>
    </div>
  );
}
