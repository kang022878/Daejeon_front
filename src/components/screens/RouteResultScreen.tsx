import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpaceParticles } from "@/components/SpaceParticles";
import { MetallicDaejeonMap } from "@/components/MetallicDaejeonMap";
import { Button } from "@/components/ui/button";
import { ChevronRight, RotateCcw, MapPin, Clock, Navigation } from "lucide-react";
import { PLACE_IMAGES } from "@/components/3d/ImageFieldScene";

interface RouteResultScreenProps {
  selectedPlaces?: number[];
  onComplete: () => void;
  onReselect?: () => void;
}

// Pin positions on the map (percentage-based)
const PIN_POSITIONS = [
  { x: 38, y: 32 },
  { x: 65, y: 40 },
  { x: 45, y: 55 },
  { x: 70, y: 60 },
  { x: 50, y: 75 },
];

export function RouteResultScreen({ 
  selectedPlaces = [0, 2, 4, 6, 8], 
  onComplete, 
  onReselect 
}: RouteResultScreenProps) {
  const [mapRevealed, setMapRevealed] = useState(false);
  const [visiblePins, setVisiblePins] = useState<number[]>([]);
  const [routeProgress, setRouteProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Animate pins appearing one by one after map reveals
  useEffect(() => {
    if (!mapRevealed) return;

    const pinCount = Math.min(selectedPlaces.length, PIN_POSITIONS.length);
    let currentPin = 0;

    const interval = setInterval(() => {
      if (currentPin < pinCount) {
        setVisiblePins(prev => [...prev, currentPin]);
        currentPin++;
      } else {
        clearInterval(interval);
        // Start route line animation
        setTimeout(() => {
          const routeInterval = setInterval(() => {
            setRouteProgress(prev => {
              if (prev >= 100) {
                clearInterval(routeInterval);
                setTimeout(() => setShowDetails(true), 500);
                return 100;
              }
              return prev + 2;
            });
          }, 30);
        }, 300);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [mapRevealed, selectedPlaces.length]);

  // Generate SVG path for route line
  const generateRoutePath = () => {
    const points = visiblePins.map(i => PIN_POSITIONS[i]);
    if (points.length < 2) return "";
    
    return points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `${path} L ${point.x} ${point.y}`;
    }, "");
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <SpaceParticles particleCount={40} />

      {/* Header */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-30 pt-safe"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="px-6 py-6 text-center">
          <h1 className="text-elegant text-xs text-muted-foreground mb-2">
            ROUTE GENERATED
          </h1>
          <h2 className="text-title text-xl text-foreground tracking-wide">
            오늘의 추천 루트
          </h2>
        </div>
      </motion.div>

      {/* Map Container */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative w-full max-w-md aspect-square mx-6">
          {/* Metallic Map */}
          <MetallicDaejeonMap onRevealComplete={() => setMapRevealed(true)} />

          {/* Route Line Overlay */}
          {visiblePins.length >= 2 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" />
                </linearGradient>
              </defs>
              
              {/* Animated route path */}
              <motion.path
                d={generateRoutePath()}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#routeGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: routeProgress / 100 }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
              
              {/* Glowing dots along the path */}
              <motion.path
                d={generateRoutePath()}
                fill="none"
                stroke="white"
                strokeWidth="0.3"
                strokeLinecap="round"
                strokeDasharray="0.5 3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: routeProgress / 100 }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </svg>
          )}

          {/* Animated Pins */}
          {visiblePins.map((pinIndex, i) => {
            const position = PIN_POSITIONS[pinIndex];
            const placeIndex = selectedPlaces[pinIndex];
            const place = PLACE_IMAGES[placeIndex];

            return (
              <motion.div
                key={pinIndex}
                className="absolute z-30"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: "translate(-50%, -100%)",
                }}
                initial={{ opacity: 0, y: -30, scale: 0 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: i * 0.1,
                }}
              >
                {/* Pin Container */}
                <div className="relative group cursor-pointer">
                  {/* Pin number badge */}
                  <motion.div
                    className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center z-10 glow-yellow-box"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                  >
                    {i + 1}
                  </motion.div>

                  {/* Pin image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-primary glow-blue-box shadow-lg">
                    <img
                      src={place?.url}
                      alt={place?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Pin pointer */}
                  <div
                    className="absolute left-1/2 -bottom-2 w-0 h-0 -translate-x-1/2"
                    style={{
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: "8px solid hsl(var(--primary))",
                      filter: "drop-shadow(0 0 4px hsl(var(--primary)))",
                    }}
                  />

                  {/* Hover tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <span className="text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
                      {place?.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Route Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="absolute bottom-32 left-0 right-0 z-20 px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Route summary cards */}
            <div className="flex justify-center gap-4 mb-4">
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-muted rounded-lg px-4 py-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{visiblePins.length}개 장소</span>
              </div>
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-muted rounded-lg px-4 py-2">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-sm text-foreground">약 {visiblePins.length * 30}분</span>
              </div>
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-muted rounded-lg px-4 py-2">
                <Navigation className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{(visiblePins.length * 1.2).toFixed(1)}km</span>
              </div>
            </div>

            {/* Place list */}
            <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {visiblePins.map((pinIndex, i) => {
                const place = PLACE_IMAGES[selectedPlaces[pinIndex]];
                return (
                  <motion.div
                    key={pinIndex}
                    className="flex items-center gap-2 bg-card/30 backdrop-blur-sm border border-muted/50 rounded-full px-3 py-1.5 shrink-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-xs text-foreground">{place?.name}</span>
                    {i < visiblePins.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Actions */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 pb-safe"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showDetails ? 1 : 0, y: showDetails ? 0 : 20 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="px-6 pb-8 space-y-3">
          {onReselect && (
            <Button
              variant="outline"
              onClick={onReselect}
              className="w-full h-11 border-muted-foreground/30 text-muted-foreground hover:border-secondary hover:text-secondary transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              <span className="text-elegant text-xs">장소 다시 선택</span>
            </Button>
          )}

          <Button
            onClick={onComplete}
            className="w-full h-14 bg-secondary text-secondary-foreground glow-yellow-box hover:bg-secondary/90 transition-all duration-300"
          >
            <span className="text-elegant text-sm">루트 시작하기</span>
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
