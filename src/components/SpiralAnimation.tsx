import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

interface SpiralAnimationProps {
  className?: string;
  particleCount?: number;
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  element: HTMLDivElement;
  angle: number;
  radius: number;
  z: number;
  speed: number;
  size: number;
  isBlue: boolean;
}

export function SpiralAnimation({
  className,
  particleCount = 80,
  duration = 4,
  onComplete,
}: SpiralAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing particles
    container.innerHTML = "";
    particlesRef.current = [];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const element = document.createElement("div");
      element.className = "absolute rounded-full pointer-events-none";
      
      const isBlue = Math.random() > 0.7;
      const size = Math.random() * 4 + 2;
      
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      element.style.background = isBlue 
        ? "hsl(200, 100%, 60%)" 
        : "hsl(0, 0%, 100%)";
      
      if (isBlue) {
        element.style.boxShadow = "0 0 8px hsl(200, 100%, 60%), 0 0 16px hsl(200, 100%, 50%)";
      }

      container.appendChild(element);

      // Initial position - scattered around the viewport
      const angle = (i / particleCount) * Math.PI * 8 + Math.random() * Math.PI;
      const radius = 300 + Math.random() * 400;
      const z = Math.random() * 200 - 100;

      particlesRef.current.push({
        element,
        angle,
        radius,
        z,
        speed: 0.5 + Math.random() * 1.5,
        size,
        isBlue,
      });

      // Set initial position
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      gsap.set(element, {
        x: x + container.offsetWidth / 2,
        y: y + container.offsetHeight / 2,
        scale: 1 + z / 200,
        opacity: 0.3 + Math.random() * 0.7,
      });
    }

    // Create spiral animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      },
    });
    animationRef.current = tl;

    // Animate each particle spiraling inward
    particlesRef.current.forEach((particle, index) => {
      const delay = index * 0.02;
      const rotations = 2 + Math.random() * 2;
      
      tl.to(
        particle.element,
        {
          duration: duration,
          ease: "power2.inOut",
          motionPath: {
            path: generateSpiralPath(
              particle.radius,
              particle.angle,
              rotations,
              container.offsetWidth / 2,
              container.offsetHeight / 2
            ),
            curviness: 1.5,
          },
          scale: 0,
          opacity: 0,
          z: 100,
        },
        delay
      );
    });

    // Fallback animation without motionPath (if plugin not available)
    particlesRef.current.forEach((particle, index) => {
      const delay = index * 0.015;
      
      gsap.to(particle.element, {
        duration: duration,
        ease: "power2.inOut",
        x: container.offsetWidth / 2,
        y: container.offsetHeight / 2,
        scale: 0,
        opacity: 0,
        rotation: 720 * particle.speed,
        delay: delay,
      });
    });

    // Final convergence glow effect
    const glowElement = document.createElement("div");
    glowElement.className = "absolute rounded-full";
    glowElement.style.width = "4px";
    glowElement.style.height = "4px";
    glowElement.style.background = "hsl(200, 100%, 60%)";
    glowElement.style.left = "50%";
    glowElement.style.top = "50%";
    glowElement.style.transform = "translate(-50%, -50%)";
    glowElement.style.boxShadow = `
      0 0 20px hsl(200, 100%, 60%),
      0 0 40px hsl(200, 100%, 50%),
      0 0 80px hsl(200, 100%, 40%)
    `;
    container.appendChild(glowElement);

    gsap.fromTo(
      glowElement,
      { scale: 0, opacity: 0 },
      {
        scale: 30,
        opacity: 1,
        duration: duration * 0.3,
        delay: duration * 0.7,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(glowElement, {
            scale: 100,
            opacity: 0,
            duration: 1,
            ease: "power2.out",
          });
        },
      }
    );

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      gsap.killTweensOf(particlesRef.current.map((p) => p.element));
    };
  }, [particleCount, duration, onComplete]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 overflow-hidden pointer-events-none preserve-3d perspective-2000",
        className
      )}
      style={{ zIndex: 50 }}
    />
  );
}

// Generate spiral path points
function generateSpiralPath(
  startRadius: number,
  startAngle: number,
  rotations: number,
  centerX: number,
  centerY: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const steps = 20;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const angle = startAngle + progress * rotations * Math.PI * 2;
    const radius = startRadius * (1 - progress);
    
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  return points;
}
