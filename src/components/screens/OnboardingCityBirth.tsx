import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpiralAnimation } from "@/components/SpiralAnimation";
import { MetallicDaejeonMap } from "@/components/MetallicDaejeonMap";
import { SpaceParticles } from "@/components/SpaceParticles";

type Phase = "spiral" | "map" | "text" | "complete";

interface OnboardingCityBirthProps {
  onComplete?: () => void;
}

export function OnboardingCityBirth({ onComplete }: OnboardingCityBirthProps) {
  const [phase, setPhase] = useState<Phase>("spiral");

  useEffect(() => {
    // Phase timing
    const timers: NodeJS.Timeout[] = [];

    // Spiral runs for ~4 seconds, then transition to map
    timers.push(setTimeout(() => setPhase("map"), 4500));
    
    // Map reveal completes, show text
    timers.push(setTimeout(() => setPhase("text"), 8500));
    
    // Complete after text animation
    timers.push(setTimeout(() => setPhase("complete"), 12000));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "complete" && onComplete) {
      onComplete();
    }
  }, [phase, onComplete]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Space background - always visible */}
      <SpaceParticles particleCount={80} />

      {/* Spiral Animation Phase */}
      <AnimatePresence>
        {phase === "spiral" && (
          <motion.div
            key="spiral"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <SpiralAnimation 
              particleCount={100} 
              duration={4}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Reveal Phase */}
      <AnimatePresence>
        {(phase === "map" || phase === "text" || phase === "complete") && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <MetallicDaejeonMap />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Overlay */}
      <AnimatePresence>
        {(phase === "text" || phase === "complete") && (
          <motion.div
            key="text"
            className="absolute inset-0 flex flex-col items-center justify-end pb-24 md:pb-32 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Main tagline */}
            <motion.h2
              className="text-xl md:text-2xl lg:text-3xl text-foreground font-light tracking-wide text-center px-6 mb-4"
              initial={{ opacity: 0, y: 30, rotateX: -10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="glow-blue">당신의 대전</span>을
            </motion.h2>
            
            <motion.h2
              className="text-xl md:text-2xl lg:text-3xl text-foreground font-light tracking-wide text-center px-6"
              initial={{ opacity: 0, y: 30, rotateX: -10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="metallic-gold-text">유잼</span>으로 만들어드립니다
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="mt-6 text-sm md:text-base text-muted-foreground font-extralight tracking-wide text-center px-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              Making Your Daejeon Fun
            </motion.p>

            {/* Continue indicator */}
            <motion.div
              className="mt-12 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2 }}
            >
              <motion.div
                className="w-px h-8 bg-gradient-to-b from-primary/50 to-transparent"
                animate={{ scaleY: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.span
                className="mt-2 text-xs text-muted-foreground tracking-widest uppercase"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                Swipe to continue
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient vignette */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" style={{ zIndex: 5 }} />
    </div>
  );
}
