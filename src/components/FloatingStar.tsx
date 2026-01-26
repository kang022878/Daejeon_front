import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingStarProps {
  className?: string;
  size?: number;
  delay?: number;
  color?: string;
}

export function FloatingStar({
  className,
  size = 24,
  delay = 0,
  color = "hsl(200, 100%, 60%)",
}: FloatingStarProps) {
  return (
    <motion.div
      className={cn("absolute", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: [0.6, 1, 0.6],
        y: [-5, -15, -5],
        scale: [0.95, 1.05, 0.95],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* 4-pointed star shape */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full"
        style={{
          filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color})`,
        }}
      >
        <path
          d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
          fill={color}
        />
      </svg>
      
      {/* Inner glow circle */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          delay: delay + 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div
          className="rounded-full"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            background: "white",
            boxShadow: `0 0 ${size * 0.5}px ${color}`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
