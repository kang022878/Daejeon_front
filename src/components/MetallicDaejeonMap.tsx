import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetallicDaejeonMapProps {
  className?: string;
  onRevealComplete?: () => void;
}

export function MetallicDaejeonMap({ className, onRevealComplete }: MetallicDaejeonMapProps) {
  const [phase, setPhase] = useState<"hidden" | "lighting" | "revealed">("hidden");

  useEffect(() => {
    // Start lighting reveal after mount
    const timer1 = setTimeout(() => setPhase("lighting"), 100);
    const timer2 = setTimeout(() => setPhase("revealed"), 2500);
    const timer3 = setTimeout(() => onRevealComplete?.(), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onRevealComplete]);

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center preserve-3d perspective-2000", className)}>
      {/* Ambient glow behind the map */}
      <motion.div
        className="absolute w-[400px] h-[400px] md:w-[500px] md:h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsla(200, 100%, 50%, 0.15) 0%, transparent 70%)",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: phase !== "hidden" ? 1 : 0,
          scale: phase !== "hidden" ? 1.2 : 0.5,
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Metallic Daejeon Map - SVG representation */}
      <motion.div
        className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
        initial={{ opacity: 0, scale: 0.8, rotateX: 20, rotateY: -10 }}
        animate={{
          opacity: phase !== "hidden" ? 1 : 0,
          scale: phase === "revealed" ? 1 : 0.9,
          rotateX: phase === "revealed" ? 0 : 15,
          rotateY: phase === "revealed" ? 0 : -5,
        }}
        transition={{ duration: 2.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Main map shape - stylized Daejeon silhouette */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 0 30px hsla(200, 100%, 50%, 0.3))" }}
        >
          <defs>
            {/* Metallic gradient */}
            <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(0, 0%, 85%)" />
              <stop offset="25%" stopColor="hsl(0, 0%, 60%)" />
              <stop offset="50%" stopColor="hsl(0, 0%, 90%)" />
              <stop offset="75%" stopColor="hsl(0, 0%, 55%)" />
              <stop offset="100%" stopColor="hsl(0, 0%, 75%)" />
            </linearGradient>

            {/* Gold accent gradient */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 90%, 70%)" />
              <stop offset="50%" stopColor="hsl(45, 80%, 55%)" />
              <stop offset="100%" stopColor="hsl(45, 70%, 40%)" />
            </linearGradient>

            {/* Lighting sweep */}
            <linearGradient id="lightingSweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="45%" stopColor="hsla(0, 0%, 100%, 0.4)" />
              <stop offset="50%" stopColor="hsla(0, 0%, 100%, 0.8)" />
              <stop offset="55%" stopColor="hsla(0, 0%, 100%, 0.4)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* Neon glow filter */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Clip path for lighting animation */}
            <clipPath id="mapClip">
              <path d="M200 50 L320 100 L350 180 L340 280 L280 340 L180 360 L100 320 L60 240 L70 140 L120 80 Z" />
            </clipPath>
          </defs>

          {/* Base map shape - metallic */}
          <motion.path
            d="M200 50 L320 100 L350 180 L340 280 L280 340 L180 360 L100 320 L60 240 L70 140 L120 80 Z"
            fill="url(#metallicGradient)"
            stroke="hsl(0, 0%, 40%)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: phase !== "hidden" ? 1 : 0, 
              opacity: phase !== "hidden" ? 1 : 0 
            }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Inner detail - districts */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "revealed" ? 0.6 : 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <path
              d="M200 120 L260 150 L250 220 L200 250 L150 220 L140 150 Z"
              fill="none"
              stroke="hsl(0, 0%, 50%)"
              strokeWidth="1"
            />
            <path
              d="M200 150 L230 170 L220 210 L200 230 L180 210 L170 170 Z"
              fill="url(#goldGradient)"
              opacity="0.4"
            />
          </motion.g>

          {/* Neon outline */}
          <motion.path
            d="M200 50 L320 100 L350 180 L340 280 L280 340 L180 360 L100 320 L60 240 L70 140 L120 80 Z"
            fill="none"
            stroke="hsl(200, 100%, 50%)"
            strokeWidth="2"
            filter="url(#neonGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: phase === "revealed" ? 1 : 0, 
              opacity: phase === "revealed" ? 1 : 0 
            }}
            transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
          />

          {/* Lighting sweep overlay */}
          <motion.rect
            x="-100"
            y="0"
            width="200"
            height="400"
            fill="url(#lightingSweep)"
            clipPath="url(#mapClip)"
            initial={{ x: -200 }}
            animate={{ x: phase === "lighting" || phase === "revealed" ? 600 : -200 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* City center marker */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: phase === "revealed" ? 1 : 0, 
              opacity: phase === "revealed" ? 1 : 0 
            }}
            transition={{ duration: 0.5, delay: 2.5 }}
          >
            <circle
              cx="200"
              cy="190"
              r="8"
              fill="hsl(200, 100%, 50%)"
              filter="url(#neonGlow)"
            />
            <circle
              cx="200"
              cy="190"
              r="4"
              fill="hsl(0, 0%, 100%)"
            />
          </motion.g>

          {/* Location pins */}
          {[
            { x: 150, y: 130, delay: 2.7 },
            { x: 260, y: 160, delay: 2.9 },
            { x: 180, y: 260, delay: 3.1 },
            { x: 280, y: 240, delay: 3.3 },
          ].map((pin, index) => (
            <motion.g
              key={index}
              initial={{ scale: 0, opacity: 0, y: -20 }}
              animate={{ 
                scale: phase === "revealed" ? 1 : 0, 
                opacity: phase === "revealed" ? 0.8 : 0,
                y: phase === "revealed" ? 0 : -20,
              }}
              transition={{ duration: 0.4, delay: pin.delay, ease: "backOut" }}
            >
              <path
                d={`M${pin.x} ${pin.y - 15} 
                   C${pin.x - 8} ${pin.y - 15} ${pin.x - 8} ${pin.y - 5} ${pin.x} ${pin.y}
                   C${pin.x + 8} ${pin.y - 5} ${pin.x + 8} ${pin.y - 15} ${pin.x} ${pin.y - 15}
                   L${pin.x} ${pin.y + 5} Z`}
                fill="hsl(50, 100%, 50%)"
                filter="url(#neonGlow)"
              />
              <circle
                cx={pin.x}
                cy={pin.y - 12}
                r="3"
                fill="hsl(0, 0%, 0%)"
              />
            </motion.g>
          ))}
        </svg>

        {/* Floating particles around map */}
        {phase === "revealed" && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-neon-blue"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  boxShadow: "0 0 6px hsl(200, 100%, 60%)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [0, -20, -40],
                }}
                transition={{
                  duration: 2,
                  delay: 3 + i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
