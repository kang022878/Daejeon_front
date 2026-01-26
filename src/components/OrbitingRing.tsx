import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrbitingRingProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  color?: string;
}

export function OrbitingRing({
  className,
  size = 120,
  duration = 8,
  delay = 0,
  color = "hsl(200, 100%, 50%)",
}: OrbitingRingProps) {
  return (
    <div
      className={cn("absolute preserve-3d", className)}
      style={{
        width: size,
        height: size,
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* 3D Orbiting Ring - rotates in true 3D space */}
      <motion.div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          rotateX: 70, // Tilt the orbit plane
        }}
        animate={{
          rotateY: [0, 360],
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* The ring itself */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            border: `2px solid ${color}`,
            boxShadow: `
              0 0 10px ${color},
              0 0 20px ${color}80,
              0 0 30px ${color}40,
              inset 0 0 10px ${color}20
            `,
            transformStyle: "preserve-3d",
          }}
        />
        
        {/* Orbiting particle on the ring */}
        <motion.div
          className="absolute"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            boxShadow: `
              0 0 10px ${color},
              0 0 20px ${color},
              0 0 30px ${color}
            `,
            left: "50%",
            top: 0,
            marginLeft: -4,
            marginTop: -4,
            transformStyle: "preserve-3d",
          }}
          animate={{
            rotateZ: [0, 360],
          }}
          transition={{
            duration: duration / 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>
    </div>
  );
}
