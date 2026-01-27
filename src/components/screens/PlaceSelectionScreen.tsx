import { useMemo, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpaceParticles } from "@/components/SpaceParticles";
import { ImageFieldScene, type PlaceImage } from "@/components/3d/ImageFieldScene";
import { PlanetMenu } from "@/components/3d/PlanetMenu";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2, X } from "lucide-react";
import { useFeedback } from "@/hooks/useFeedback";
import { calculateRoute } from "@/lib/api";

interface PlaceSelectionScreenProps {
  onComplete: (payload: { selectedPlaces: PlaceImage[]; routeCoords: [number, number][] }) => void;
  onReselect?: () => void;
  onViewHistory?: () => void;
  onLogout?: () => void;
  moodImageUrl?: string;
  places: PlaceImage[];
  startPoint?: { lat: number; lng: number };
}

export function PlaceSelectionScreen({ 
  onComplete, 
  onReselect, 
  onViewHistory,
  onLogout,
  moodImageUrl,
  places,
  startPoint,
}: PlaceSelectionScreenProps) {
  const [selectedPlaces, setSelectedPlaces] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { onSelect, onDeselect, onSuccess, onClick } = useFeedback();
  const placeById = useMemo(() => {
    const map = new Map<number, PlaceImage>();
    places.forEach((place) => {
      if (typeof place.id === "number") {
        map.set(place.id, place);
      }
    });
    return map;
  }, [places]);

  const handlePlaceClick = (index: number) => {
    if (!places[index]) return;
    setSelectedPlaces(prev => {
      if (prev.includes(index)) {
        onDeselect();
        return prev.filter(i => i !== index);
      }
      onSelect();
      // Allow up to 5 selections for route
      if (prev.length >= 5) {
        return [...prev.slice(1), index];
      }
      return [...prev, index];
    });
  };

  const handleRemovePlace = (index: number) => {
    onDeselect();
    setSelectedPlaces(prev => prev.filter(i => i !== index));
  };

  const handleGenerateRoute = async () => {
    if (selectedPlaces.length < 2) return;
    
    onClick();
    setIsGenerating(true);
    const selectedItems = selectedPlaces
      .map((index) => places[index])
      .filter((place): place is PlaceImage => Boolean(place));

    try {
      if (!startPoint || selectedItems.length === 0) {
        const routeCoords = selectedItems
          .filter((place) => typeof place.lat === "number" && typeof place.lng === "number")
          .map((place) => [place.lng as number, place.lat as number] as [number, number]);
        setIsGenerating(false);
        onSuccess();
        onComplete({ selectedPlaces: selectedItems, routeCoords });
        return;
      }

      const routePayload = {
        start_lat: startPoint.lat,
        start_lng: startPoint.lng,
        places: selectedItems.map((place) => ({
          id: place.id ?? null,
          name: place.name ?? null,
          lat: place.lat as number,
          lng: place.lng as number,
        })),
      };

      const response = await calculateRoute(routePayload);
      const ordered = (response.data ?? [])
        .map((item) => {
          const base = typeof item.id === "number" ? placeById.get(item.id) : undefined;
          return {
            ...(base ?? {}),
            id: item.id ?? base?.id,
            name: item.name ?? base?.name,
            lat: item.lat ?? base?.lat,
            lng: item.lng ?? base?.lng,
            duration: (item as any).duration ?? base?.duration,
            transport: (item as any).transport ?? base?.transport,
          } as PlaceImage;
        })
        .filter((place) => typeof place.lat === "number" && typeof place.lng === "number");

      const routeCoords: [number, number][] = [
        [startPoint.lng, startPoint.lat],
        ...ordered.map((place) => [place.lng as number, place.lat as number]),
      ];

      setIsGenerating(false);
      onSuccess();
      onComplete({ selectedPlaces: ordered, routeCoords });
    } catch (error) {
      console.error("Route generation failed", error);
      const fallbackCoords = selectedItems
        .filter((place) => typeof place.lat === "number" && typeof place.lng === "number")
        .map((place) => [place.lng as number, place.lat as number] as [number, number]);
      setIsGenerating(false);
      onComplete({ selectedPlaces: selectedItems, routeCoords: fallbackCoords });
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <SpaceParticles particleCount={50} />
      
      {/* Header */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20 pt-safe"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="px-6 py-6 text-center">
          <h1 className="text-elegant text-xs text-muted-foreground mb-2">
            PLACE SELECTION
          </h1>
          <h2 className="text-title text-xl text-foreground tracking-wide">
            오늘의 장소를 선택하세요
          </h2>
          <p className="text-subtitle text-sm text-muted-foreground mt-2">
            2~5개의 장소를 선택하여 루트를 만들어보세요
          </p>
          {moodImageUrl && (
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center gap-3 rounded-full border border-muted/50 bg-card/40 px-4 py-2 backdrop-blur-sm">
                <img
                  src={moodImageUrl}
                  alt="AI mood"
                  className="h-10 w-10 rounded-full object-cover border border-muted"
                />
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    AI MOOD PICK
                  </p>
                  <p className="text-xs text-foreground">무드 기반 추천 이미지</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Planet Menu - top right */}
        <motion.div
          className="absolute top-6 right-6 z-30"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5, type: "spring" }}
        >
          <PlanetMenu
            onReselectMood={onReselect || (() => {})}
            onViewHistory={onViewHistory || (() => {})}
            onLogout={onLogout || (() => {})}
          />
        </motion.div>
      </motion.div>

      {/* 3D Image Field */}
      <motion.div
        className="absolute inset-0 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <Suspense fallback={
          <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        }>
          <ImageFieldScene
            selectedPlaces={selectedPlaces}
            onPlaceClick={handlePlaceClick}
            places={places}
          />
        </Suspense>
      </motion.div>

      {/* Selected places cluster at bottom */}
      <AnimatePresence>
        {selectedPlaces.length > 0 && (
          <motion.div
            className="absolute bottom-36 left-0 right-0 z-30 px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex justify-center gap-2 flex-wrap">
              {selectedPlaces.map((placeIndex, i) => (
                <motion.div
                  key={placeIndex}
                  className="relative group"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary glow-blue-box">
                    <img 
                      src={places[placeIndex]?.url} 
                      alt={places[placeIndex]?.name ?? `place-${placeIndex}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleRemovePlace(placeIndex)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-background border border-muted rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
                    {places[placeIndex]?.name ?? "추천 장소"}
                  </span>
                </motion.div>
              ))}
            </div>
            
            {/* Selection count */}
            <div className="flex justify-center mt-8">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      i < selectedPlaces.length 
                        ? 'bg-secondary glow-yellow-box' 
                        : 'bg-muted'
                    }`}
                    animate={i < selectedPlaces.length ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom actions */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 pb-safe"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <div className="px-6 pb-8 space-y-3">
          {/* Generate route button */}
          <Button
            onClick={handleGenerateRoute}
            disabled={selectedPlaces.length < 2 || isGenerating}
            className="w-full h-14 bg-secondary text-secondary-foreground glow-yellow-box hover:bg-secondary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="text-elegant text-sm">
                  루트 생성하기 ({selectedPlaces.length}/5)
                </span>
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {selectedPlaces.length < 2 && (
            <p className="text-center text-xs text-muted-foreground">
              최소 2개 이상의 장소를 선택해주세요
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
