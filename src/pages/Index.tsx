import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SplashScreen } from "@/components/screens/SplashScreen";
import { OnboardingCityBirth } from "@/components/screens/OnboardingCityBirth";
import { FeatureOnboarding } from "@/components/screens/FeatureOnboarding";
import { MoodInputScreen } from "@/components/screens/MoodInputScreen";
import { PlaceSelectionScreen } from "@/components/screens/PlaceSelectionScreen";
import { RouteResultScreen } from "@/components/screens/RouteResultScreen";
import { RouteHistoryScreen, type RouteRecord } from "@/components/screens/RouteHistoryScreen";
import {
  authKakao,
  setAuthToken,
  type AnalyzeResponse,
  getRouteHistory,
  createRouteHistory,
  deleteRouteHistory,
} from "@/lib/api";
import { type PlaceImage } from "@/components/3d/ImageFieldScene";

// Screen state for navigation
type AppScreen = "splash" | "onboarding" | "features" | "mood" | "places" | "main" | "route" | "result" | "history";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("splash");
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceImage[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [historyReturnScreen, setHistoryReturnScreen] = useState<AppScreen>("places");
  const [moodImageUrl, setMoodImageUrl] = useState<string | undefined>(undefined);
  const [recommendedPlaces, setRecommendedPlaces] = useState<PlaceImage[]>([]);
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [userProfile, setUserProfile] = useState({
    id: 1,
    name: "카카오 사용자",
    avatarUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23FEE500'/><text x='32' y='38' font-size='24' text-anchor='middle' fill='%23191919' font-family='Arial'>K</text></svg>",
  });

  useEffect(() => {
    console.log("OAuth redirect URL:", window.location.href);
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    authKakao(code)
      .then((payload) => {
        const token =
          (payload.token as string | undefined) ||
          (payload.access_token as string | undefined) ||
          (payload.data as { access_token?: string } | undefined)?.access_token;
        if (token) {
          setAuthToken(token);
        }

        const user = (payload.user as Record<string, unknown> | undefined) ?? {};
        const id = (payload.user_id as number | undefined) ?? (user.id as number | undefined) ?? 1;
        const name =
          (payload.nickname as string | undefined) ||
          (user.nickname as string | undefined) ||
          (user.name as string | undefined) ||
          "카카오 사용자";
        const avatarUrl =
          (payload.profile_image_url as string | undefined) ||
          (user.profile_image_url as string | undefined) ||
          (user.profile_image as string | undefined) ||
          (user.avatar_url as string | undefined) ||
          userProfile.avatarUrl;

        setUserProfile({ id, name, avatarUrl });
        setCurrentScreen("mood");
      })
      .catch((error) => {
        console.error("Kakao login failed", error);
      })
      .finally(() => {
        const nextUrl = `/${window.location.hash}`;
        window.history.replaceState({}, document.title, nextUrl);
      });
  }, [userProfile.avatarUrl]);

  useEffect(() => {
    if (currentScreen !== "history") return;
    getRouteHistory()
      .then((payload) => {
        if (payload.status !== "success") return;
        setRoutes(mapHistoryRoutes(payload));
      })
      .catch((error) => {
        console.error("Route history fetch failed", error);
      });
  }, [currentScreen]);

  const activeRoute = useMemo(
    () => routes.find((route) => route.id === activeRouteId) ?? null,
    [activeRouteId, routes]
  );

  const handleGetStarted = () => {
    setCurrentScreen("onboarding");
  };

  const handleOnboardingComplete = () => {
    setCurrentScreen("features");
  };

  const handleFeaturesComplete = () => {
    setCurrentScreen("mood");
  };

  const handlePlacesComplete = (places: PlaceImage[], nextRouteCoords: [number, number][]) => {
    const now = new Date();
    const routeId = `route-${now.getTime()}`;
    const timeLabel = now.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateLabel = now.toISOString().slice(0, 10);

    setSelectedPlaces(places);
    setRouteCoords(nextRouteCoords);
    setActiveRouteId(routeId);
    setRoutes((prev) => [
      {
        id: routeId,
        date: dateLabel,
        time: timeLabel,
        places,
        duration: `${places.length * 30}분`,
        distance: `${(places.length * 1.2).toFixed(1)}km`,
        photosByPinId: {},
        placeImages: places,
        routeCoords: nextRouteCoords,
      },
      ...prev,
    ]);
    setCurrentScreen("route");

    if (startPoint && places.length > 0) {
      createRouteHistory({
        start_lat: startPoint.lat,
        start_lng: startPoint.lng,
        places: places.map((place) => ({
          id: place.id ?? null,
          name: place.name ?? null,
          description: place.description ?? null,
          image_url: place.url ?? null,
          lat: place.lat as number,
          lng: place.lng as number,
        })),
      }).catch((error) => {
        console.error("Route history save failed", error);
      });
    }
  };

  const handleLogout = () => {
    // Mock logout - return to splash
    localStorage.removeItem("authToken");
    setUserProfile({
      id: 1,
      name: "카카오 사용자",
      avatarUrl:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23FEE500'/><text x='32' y='38' font-size='24' text-anchor='middle' fill='%23191919' font-family='Arial'>K</text></svg>",
    });
    setMoodImageUrl(undefined);
    setRecommendedPlaces([]);
    setStartPoint(undefined);
    setRouteCoords([]);
    setCurrentScreen("splash");
    setSelectedPlaces([]);
  };

  const handleSelectHistoryRoute = (route: RouteRecord) => {
    setSelectedPlaces(route.places);
    setActiveRouteId(route.id);
    setRecommendedPlaces(route.placeImages ?? []);
    setRouteCoords(route.routeCoords ?? []);
    setCurrentScreen("route");
  };

  const handleUpdateRoutePhoto = (pinId: string, url: string) => {
    if (!activeRouteId) return;
    setRoutes((prev) =>
      prev.map((route) => {
        if (route.id !== activeRouteId) return route;
        const previousUrl = route.photosByPinId?.[pinId];
        if (previousUrl && previousUrl !== url && previousUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previousUrl);
        }
        return {
          ...route,
          photosByPinId: {
            ...(route.photosByPinId ?? {}),
            [pinId]: url,
          },
        };
      })
    );
  };

  const resolveRecommendedPlaces = (payload?: AnalyzeResponse): PlaceImage[] => {
    if (!payload) return [];

    const pickFromArray = (items: unknown[]): PlaceImage[] => {
      return items
        .map((item, index) => {
          if (typeof item === "string") {
            return { url: item, name: `추천 장소 ${index + 1}` };
          }
          if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            const url =
              (record.url as string | undefined) ||
              (record.image_url as string | undefined) ||
              (record.imageUrl as string | undefined) ||
              (record.photo_url as string | undefined) ||
              (record.photoUrl as string | undefined);
            if (!url) return null;
            const name =
              (record.name as string | undefined) ||
              (record.title as string | undefined) ||
              (record.place_name as string | undefined) ||
              (record.placeName as string | undefined);
            const lat = typeof record.lat === "number" ? (record.lat as number) : undefined;
            const lng = typeof record.lng === "number" ? (record.lng as number) : undefined;
            const id = typeof record.id === "number" ? (record.id as number) : undefined;
            const description =
              (record.description as string | undefined) ||
              (record.desc as string | undefined);
            const address = (record.address as string | undefined) || (record.addr as string | undefined);
            const duration = typeof record.duration === "number" ? (record.duration as number) : undefined;
            const transport =
              (record.transport as string | undefined) ||
              (record.route_type as string | undefined);
            const moodTag =
              (record.mood_tag as string | undefined) ||
              (record.moodTag as string | undefined);
            return {
              id,
              url,
              name,
              description,
              address,
              lat,
              lng,
              duration,
              transport,
              moodTag,
            };
          }
          return null;
        })
        .filter((item): item is PlaceImage => Boolean(item));
    };

    const candidates = [
      payload.data,
      payload.places,
      payload.recommended_places,
      payload.recommendedPlaces,
      payload.place_images,
      payload.placeImages,
      payload.images,
      payload.results,
      payload.data && (payload.data as Record<string, unknown>).places,
      payload.data && (payload.data as Record<string, unknown>).recommended_places,
      payload.data && (payload.data as Record<string, unknown>).recommendedPlaces,
      payload.data && (payload.data as Record<string, unknown>).place_images,
      payload.data && (payload.data as Record<string, unknown>).placeImages,
      payload.data && (payload.data as Record<string, unknown>).images,
      payload.data && (payload.data as Record<string, unknown>).results,
      payload.result && (payload.result as Record<string, unknown>).places,
      payload.result && (payload.result as Record<string, unknown>).recommended_places,
      payload.result && (payload.result as Record<string, unknown>).recommendedPlaces,
      payload.result && (payload.result as Record<string, unknown>).place_images,
      payload.result && (payload.result as Record<string, unknown>).placeImages,
      payload.result && (payload.result as Record<string, unknown>).images,
      payload.result && (payload.result as Record<string, unknown>).results,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        const resolved = pickFromArray(candidate);
        if (resolved.length > 0) return resolved;
      }
    }

    return [];
  };

  const resolveStartPoint = (payload?: AnalyzeResponse) => {
    if (!payload) return undefined;
    const direct = payload.start_point as { lat?: number; lng?: number } | undefined;
    if (direct && typeof direct.lat === "number" && typeof direct.lng === "number") {
      return { lat: direct.lat, lng: direct.lng };
    }
    const alt = payload.startPoint as { lat?: number; lng?: number } | undefined;
    if (alt && typeof alt.lat === "number" && typeof alt.lng === "number") {
      return { lat: alt.lat, lng: alt.lng };
    }
    return undefined;
  };

  const normalizeHistoryPlaces = (items: { places?: any[] } | undefined): PlaceImage[] => {
    if (!items?.places) return [];
    return items.places
      .slice()
      .sort((a, b) => (a?.order_index ?? 0) - (b?.order_index ?? 0))
      .map((place) => ({
        id: place?.id ?? undefined,
        name: place?.name ?? undefined,
        description: place?.description ?? undefined,
        url: place?.image_url ?? "",
        lat: place?.lat,
        lng: place?.lng,
      }));
  };

  const mapHistoryRoutes = (payload: Awaited<ReturnType<typeof getRouteHistory>>) => {
    return payload.routes.map((route) => {
      const createdAt = new Date(route.created_at);
      const dateLabel = createdAt.toISOString().slice(0, 10);
      const timeLabel = createdAt.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const places = normalizeHistoryPlaces(route).filter(
        (place) =>
          typeof place.lat === "number" &&
          typeof place.lng === "number" &&
          typeof place.url === "string" &&
          place.url.length > 0
      );
      const routeCoords: [number, number][] = route.start_point
        ? [[route.start_point.lng, route.start_point.lat], ...places.map((p) => [p.lng as number, p.lat as number])]
        : places.map((p) => [p.lng as number, p.lat as number]);

      return {
        id: `route-${route.route_id}`,
        dbRouteId: route.route_id,
        date: dateLabel,
        time: timeLabel,
        places,
        duration: `${places.length * 30}분`,
        distance: `${(places.length * 1.2).toFixed(1)}km`,
        photosByPinId: {},
        placeImages: places,
        routeCoords,
      };
    });
  };

  const handleDeleteRoute = (routeId: string) => {
    const target = routes.find((route) => route.id === routeId);
    const dbRouteId = target?.dbRouteId;
    if (!dbRouteId) {
      setRoutes((prev) => prev.filter((route) => route.id !== routeId));
      return;
    }

    deleteRouteHistory(dbRouteId)
      .then(() => {
        setRoutes((prev) => prev.filter((route) => route.id !== routeId));
      })
      .catch((error) => {
        console.error("Route history delete failed", error);
      });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {currentScreen === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <SplashScreen onGetStarted={handleGetStarted} />
          </motion.div>
        )}

        {currentScreen === "onboarding" && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <OnboardingCityBirth onComplete={handleOnboardingComplete} />
          </motion.div>
        )}

        {currentScreen === "features" && (
          <motion.div
            key="features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <FeatureOnboarding onComplete={handleFeaturesComplete} />
          </motion.div>
        )}

        {currentScreen === "mood" && (
          <motion.div
            key="mood"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <MoodInputScreen
              onComplete={(payload) => {
                setMoodImageUrl(payload?.moodImageUrl);
                setRecommendedPlaces(resolveRecommendedPlaces(payload?.raw));
                setStartPoint(resolveStartPoint(payload?.raw));
                setRouteCoords([]);
                setCurrentScreen("places");
              }}
            />
          </motion.div>
        )}

        {currentScreen === "places" && (
          <motion.div
            key="places"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <PlaceSelectionScreen 
              onComplete={({ selectedPlaces, routeCoords }) => {
                handlePlacesComplete(selectedPlaces, routeCoords);
              }}
              onReselect={() => {
                setMoodImageUrl(undefined);
                setRecommendedPlaces([]);
                setStartPoint(undefined);
                setRouteCoords([]);
                setCurrentScreen("mood");
              }}
              onViewHistory={() => {
                setHistoryReturnScreen("places");
                setCurrentScreen("history");
              }}
              onLogout={handleLogout}
              moodImageUrl={moodImageUrl}
              places={recommendedPlaces}
              startPoint={startPoint}
            />
          </motion.div>
        )}

        {currentScreen === "route" && (
          <motion.div
            key="route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <RouteResultScreen
              selectedPlaces={selectedPlaces}
              onReselect={() => setCurrentScreen("places")}
              onReselectMood={() => {
                setSelectedPlaces([]);
                setMoodImageUrl(undefined);
                setRecommendedPlaces([]);
                setStartPoint(undefined);
                setRouteCoords([]);
                setCurrentScreen("mood");
              }}
              onViewHistory={() => {
                setHistoryReturnScreen("route");
                setCurrentScreen("history");
              }}
              onLogout={handleLogout}
              userId={userProfile.id}
              userProfile={{ name: userProfile.name, avatarUrl: userProfile.avatarUrl }}
              photosByPinId={activeRoute?.photosByPinId}
              onPhotoUpload={handleUpdateRoutePhoto}
              routeCoords={routeCoords}
            />
          </motion.div>
        )}

        {currentScreen === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <RouteHistoryScreen
              onBack={() => setCurrentScreen(historyReturnScreen)}
              onSelectRoute={handleSelectHistoryRoute}
              routes={routes}
              onDeleteRoute={handleDeleteRoute}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
