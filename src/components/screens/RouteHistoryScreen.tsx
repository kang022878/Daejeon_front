import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpaceParticles } from "@/components/SpaceParticles";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar, Navigation, Trash2, History as HistoryIcon } from "lucide-react";
import { PLACE_IMAGES } from "@/components/3d/ImageFieldScene";
import { useFeedback } from "@/hooks/useFeedback";

interface RouteHistoryScreenProps {
  onBack: () => void;
  onSelectRoute: (route: RouteRecord) => void;
  routes: RouteRecord[];
  onDeleteRoute?: (routeId: string) => void;
}

export type RouteRecord = {
  id: string;
  date: string;
  time: string;
  places: number[];
  duration: string;
  distance: string;
  photosByPinId?: Record<string, string>;
};

export function RouteHistoryScreen({
  onBack,
  onSelectRoute,
  routes,
  onDeleteRoute,
}: RouteHistoryScreenProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const { onClick, onSelect, onDeselect } = useFeedback();

  const handleDeleteRoute = (routeId: string) => {
    onDeselect();
    if (selectedRouteId === routeId) {
      setSelectedRouteId(null);
    }
    onDeleteRoute?.(routeId);
  };

  const handleSelectRoute = (routeId: string) => {
    onSelect();
    setSelectedRouteId(routeId);
  };

  const handleNavigate = () => {
    const selectedRoute = routes.find((route) => route.id === selectedRouteId);
    if (selectedRoute) {
      onClick();
      onSelectRoute(selectedRoute);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", weekday: "short" };
    return date.toLocaleDateString("ko-KR", options);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <SpaceParticles particleCount={30} />

      {/* Header */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20 pt-safe"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onClick();
                onBack();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-elegant text-xs text-muted-foreground mb-1">
                ROUTE HISTORY
              </h1>
              <h2 className="text-title text-xl text-foreground tracking-wide">
                루트 히스토리
              </h2>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Route List */}
      <motion.div
        className="absolute top-28 left-0 right-0 bottom-24 z-10 overflow-y-auto px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="space-y-4 pb-4">
          <AnimatePresence>
            {routes.map((route, index) => (
              <motion.div
                key={route.id}
                className={`relative bg-card/50 backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 cursor-pointer ${
                  selectedRouteId === route.id
                    ? "border-primary glow-blue-box"
                    : "border-muted hover:border-muted-foreground"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelectRoute(route.id)}
              >
                {/* Date & Time */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{formatDate(route.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{route.time}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoute(route.id);
                    }}
                    className="p-1.5 rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>

                {/* Places */}
                <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide">
                  {route.places.map((placeIndex, i) => {
                    const place = PLACE_IMAGES[placeIndex];
                    const userPhoto = route.photosByPinId?.[String(placeIndex)];
                    return (
                      <div key={i} className="flex items-center shrink-0">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-muted">
                            <img
                              src={userPhoto || place?.url}
                              alt={place?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="absolute -top-1 -left-1 w-4 h-4 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                            {i + 1}
                          </span>
                        </div>
                        {i < route.places.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-muted-foreground mx-1" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">{route.places.length}개 장소</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-secondary" />
                    <span className="text-xs text-muted-foreground">{route.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">{route.distance}</span>
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedRouteId === route.id && (
                  <motion.div
                    className="absolute top-3 right-12 w-2 h-2 rounded-full bg-primary glow-blue-box"
                    layoutId="selection-indicator"
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {routes.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-muted-foreground mb-2">
                <HistoryIcon className="w-12 h-12 mx-auto opacity-50" />
              </div>
              <p className="text-muted-foreground">저장된 루트가 없습니다</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Bottom Action */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 pb-safe"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="px-6 pb-8">
          <Button
            onClick={handleNavigate}
            disabled={!selectedRouteId}
            className="w-full h-14 bg-secondary text-secondary-foreground glow-yellow-box hover:bg-secondary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-elegant text-sm">
              {selectedRouteId ? "이 루트로 다시 가기" : "루트를 선택해주세요"}
            </span>
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
