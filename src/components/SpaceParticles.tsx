import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SpaceParticlesProps {
  className?: string;
  particleCount?: number;
}

export function SpaceParticles({ className, particleCount = 100 }: SpaceParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create particles
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      size: number;
      speed: number;
      opacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
      isBlue: boolean;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 3,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.02 + 0.005,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        isBlue: Math.random() > 0.85,
      });
    }

    let animationId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      particles.forEach((particle) => {
        // Slow drift
        particle.y += particle.speed * (1 + particle.z * 0.5);
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
        }

        // Twinkle effect
        const twinkle = Math.sin(time * particle.twinkleSpeed * 60 + particle.twinklePhase);
        const currentOpacity = particle.opacity * (0.5 + twinkle * 0.5);

        // Draw particle
        ctx.beginPath();
        const displaySize = particle.size * (1 + particle.z * 0.3);
        ctx.arc(particle.x, particle.y, displaySize, 0, Math.PI * 2);

        if (particle.isBlue) {
          ctx.fillStyle = `hsla(200, 100%, 70%, ${currentOpacity})`;
          // Add glow for blue stars
          ctx.shadowBlur = 8;
          ctx.shadowColor = "hsla(200, 100%, 60%, 0.8)";
        } else {
          ctx.fillStyle = `hsla(0, 0%, 100%, ${currentOpacity})`;
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("fixed inset-0 pointer-events-none", className)}
      style={{ zIndex: 0 }}
    />
  );
}
