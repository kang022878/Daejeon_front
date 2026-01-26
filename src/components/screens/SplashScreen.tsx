import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SplineScene } from "@/components/ui/splite";
import { SpaceParticles } from "@/components/SpaceParticles";
import { OrbitingRing } from "@/components/OrbitingRing";
import { FloatingStar } from "@/components/FloatingStar";
import { Button } from "@/components/ui/button";

// Transformation phases for the robot
type TransformPhase = "initial" | "transforming" | "gold" | "complete";

export function SplashScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const [phase, setPhase] = useState<TransformPhase>("initial");
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Transformation sequence timing
  useEffect(() => {
    if (!splineLoaded) return;

    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Initial state (2s)
    timers.push(setTimeout(() => setPhase("transforming"), 2000));
    
    // Phase 2: Transforming - show ring (4s)
    timers.push(setTimeout(() => setPhase("gold"), 4000));
    
    // Phase 3: Gold with star (6s)
    timers.push(setTimeout(() => setPhase("complete"), 6000));
    
    // Show button (7s)
    timers.push(setTimeout(() => setShowButton(true), 7000));

    return () => timers.forEach(clearTimeout);
  }, [splineLoaded]);

  // Get overlay color based on phase (for color transformation effect)
  const getOverlayStyle = () => {
    switch (phase) {
      case "initial":
        return { opacity: 0 };
      case "transforming":
        return { 
          opacity: 0.3,
          background: "linear-gradient(180deg, transparent 0%, hsla(200, 100%, 50%, 0.2) 100%)"
        };
      case "gold":
      case "complete":
        return { 
          opacity: 0.4,
          background: "linear-gradient(180deg, hsla(45, 80%, 55%, 0.3) 0%, hsla(45, 90%, 40%, 0.2) 100%)"
        };
      default:
        return { opacity: 0 };
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Space background with particles */}
      <SpaceParticles particleCount={120} />

      {/* Main content container with 3D perspective */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center perspective-2000">
        
        {/* Spline Robot Container */}
        <motion.div
          className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Color transformation overlay */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none z-20"
            animate={getOverlayStyle()}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Spline Scene - Interactive Robot */}
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                className="w-16 h-16 rounded-full border-2 border-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          }>
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
              onLoad={() => setSplineLoaded(true)}
            />
          </Suspense>

          {/* Orbiting Neon Ring - appears during transformation */}
          <AnimatePresence>
            {(phase === "transforming" || phase === "gold" || phase === "complete") && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <OrbitingRing 
                  size={280} 
                  duration={10}
                  color="hsl(200, 100%, 50%)"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Star - appears in gold/complete phase */}
          <AnimatePresence>
            {(phase === "gold" || phase === "complete") && (
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <FloatingStar 
                  size={32} 
                  color="hsl(200, 100%, 60%)"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Title Text - rises in Z-space */}
        <motion.div
          className="mt-8 text-center preserve-3d"
          initial={{ opacity: 0, y: 30, rotateX: -15 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            rotateX: 0,
          }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-light tracking-title text-foreground mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <span className="glow-blue">RE:</span> DAEJEON
          </motion.h1>
          
          <motion.p
            className="text-lg md:text-xl text-muted-foreground font-extralight tracking-wide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            대전 유잼도시 어드밴스먼트 프로젝트
          </motion.p>
        </motion.div>

        {/* Get Started Button */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Button
                onClick={onGetStarted}
                className="px-8 py-6 text-lg font-light tracking-wide bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500 glow-blue-box"
                variant="outline"
              >
                Get Started
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gradient vignette overlay */}
      <div className="fixed inset-0 pointer-events-none z-5 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}
