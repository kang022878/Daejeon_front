import { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpaceParticles } from "@/components/SpaceParticles";
import Map3D from "@/components/Map3D";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, History, MapPin, Clock, LogOut, RotateCcw, Navigation } from "lucide-react";
import { PLACE_IMAGES } from "@/components/3d/ImageFieldScene";
import { verifyVisit } from "@/lib/api";

interface RouteResultScreenProps {
  selectedPlaces?: number[];
  onReselect?: () => void;
  onReselectMood?: () => void;
  onViewHistory?: () => void;
  onLogout?: () => void;
  userId?: number;
  userProfile?: { name: string; avatarUrl: string };
  photosByPinId?: Record<string, string>;
  onPhotoUpload?: (pinId: string, url: string) => void;
}

const PLACE_COORDS: [number, number][] = [
  [127.3872, 36.3514],
  [127.3831, 36.3489],
  [127.3928, 36.3552],
  [127.3794, 36.3537],
  [127.3899, 36.3465],
  [127.3813, 36.3571],
  [127.3961, 36.3492],
  [127.3758, 36.3501],
  [127.3857, 36.3443],
  [127.3982, 36.3567],
  [127.3742, 36.3478],
  [127.3915, 36.3526],
];

export function RouteResultScreen({ 
  selectedPlaces = [0, 2, 4, 6, 8], 
  onReselect,
  onReselectMood,
  onViewHistory,
  onLogout,
  userId = 1,
  userProfile = {
    name: "카카오 사용자",
    avatarUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23FEE500'/><text x='32' y='38' font-size='24' text-anchor='middle' fill='%23191919' font-family='Arial'>K</text></svg>",
  },
  photosByPinId = {},
  onPhotoUpload,
}: RouteResultScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pins = useMemo(() => {
    const uniquePlaces = selectedPlaces.slice(0, 5);
    return uniquePlaces.map((placeIndex, idx) => {
      const coords = PLACE_COORDS[placeIndex] ?? PLACE_COORDS[idx % PLACE_COORDS.length];
      return {
        id: String(placeIndex),
        lng: coords[0],
        lat: coords[1],
      };
    });
  }, [selectedPlaces]);

  const routeCoords = useMemo(() => pins.map((pin) => [pin.lng, pin.lat] as [number, number]), [pins]);

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const handlePinClick = (pinId: string) => {
    setActivePinId(pinId);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activePinId) return;

    const nextUrl = URL.createObjectURL(file);
    onPhotoUpload?.(activePinId, nextUrl);

    const pin = pins.find((item) => item.id === activePinId);
    if (!pin) return;

    verifyVisit({
      userId,
      placeId: Number(activePinId),
      lat: pin.lat,
      lng: pin.lng,
      file,
    })
      .then((payload) => {
        const candidateUrl =
          (payload.url as string | undefined) ||
          (payload.image_url as string | undefined) ||
          (payload.photo_url as string | undefined);
        if (candidateUrl) {
          onPhotoUpload?.(activePinId, candidateUrl);
        }
      })
      .catch(() => {
        // Keep local preview on failure.
      });
  };

  const activePlace = activePinId ? PLACE_IMAGES[Number(activePinId)] : null;

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
        <div className="px-6 py-6">
          <div className="relative flex items-start justify-center">
            <div className="text-center">
              <h1 className="text-elegant text-xs text-muted-foreground mb-2">
                ROUTE GENERATED
              </h1>
              <h2 className="text-title text-xl text-foreground tracking-wide">
                오늘의 추천 루트
              </h2>
            </div>

            <div className="absolute right-0 top-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex items-center gap-2 rounded-full bg-card/60 px-2 py-1.5 border border-muted hover:border-primary transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
                      <AvatarFallback>KM</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-foreground">{userProfile.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onViewHistory?.()}>
                    <History className="mr-2 h-4 w-4" />
                    경로기록 보기
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onLogout?.()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Map Container */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative w-full h-full">
          <Map3D
            pins={pins}
            route={routeCoords}
            onPinClick={handlePinClick}
            photosByPinId={photosByPinId}
          />
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
                <span className="text-sm text-foreground">{pins.length}개 장소</span>
              </div>
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-muted rounded-lg px-4 py-2">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-sm text-foreground">약 {pins.length * 30}분</span>
              </div>
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-muted rounded-lg px-4 py-2">
                <Navigation className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{(pins.length * 1.2).toFixed(1)}km</span>
              </div>
            </div>

            {/* Place list */}
            <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {pins.map((pin, i) => {
                const place = PLACE_IMAGES[Number(pin.id)];
                return (
                  <motion.div
                    key={pin.id}
                    className="flex items-center gap-2 bg-card/30 backdrop-blur-sm border border-muted/50 rounded-full px-3 py-1.5 shrink-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-xs text-foreground">{place?.name}</span>
                    {i < pins.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo upload modal */}
      <AnimatePresence>
        {activePinId && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-[260px] bg-card/90 border border-muted rounded-xl p-4"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-foreground font-medium">
                  {activePlace?.name ?? "사진 업로드"}
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setActivePinId(null)}
                >
                  ✕
                </button>
              </div>

              <div className="w-full h-40 rounded-lg bg-muted/40 border border-muted flex items-center justify-center overflow-hidden">
                {photosByPinId[activePinId] ? (
                  <img
                    src={photosByPinId[activePinId]}
                    alt="uploaded preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">사진을 업로드하세요</span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  사진 업로드
                </Button>
                <Button
                  variant="outline"
                  className="h-10 px-3"
                  onClick={() => setActivePinId(null)}
                >
                  닫기
                </Button>
              </div>
            </motion.div>
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

          {onReselectMood && (
            <Button
              variant="outline"
              onClick={onReselectMood}
              className="w-full h-11 border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              <span className="text-elegant text-xs">무드 다시 선택</span>
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
