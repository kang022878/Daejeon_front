import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SplashScreen } from "@/components/screens/SplashScreen";
import { OnboardingCityBirth } from "@/components/screens/OnboardingCityBirth";
import { FeatureOnboarding } from "@/components/screens/FeatureOnboarding";
import { MoodInputScreen } from "@/components/screens/MoodInputScreen";
import { PlaceSelectionScreen } from "@/components/screens/PlaceSelectionScreen";
import { RouteResultScreen } from "@/components/screens/RouteResultScreen";
import { RouteHistoryScreen, type RouteRecord } from "@/components/screens/RouteHistoryScreen";
import { authKakao, setAuthToken } from "@/lib/api";

// Screen state for navigation
type AppScreen = "splash" | "onboarding" | "features" | "mood" | "places" | "main" | "route" | "result" | "history";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("splash");
  const [selectedPlaces, setSelectedPlaces] = useState<number[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [historyReturnScreen, setHistoryReturnScreen] = useState<AppScreen>("places");
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

  const handlePlacesComplete = (places: number[]) => {
    const now = new Date();
    const routeId = `route-${now.getTime()}`;
    const timeLabel = now.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateLabel = now.toISOString().slice(0, 10);

    setSelectedPlaces(places);
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
      },
      ...prev,
    ]);
    setCurrentScreen("route");
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
    setCurrentScreen("splash");
    setSelectedPlaces([]);
  };

  const handleSelectHistoryRoute = (route: RouteRecord) => {
    setSelectedPlaces(route.places);
    setActiveRouteId(route.id);
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

  const handleDeleteRoute = (routeId: string) => {
    setRoutes((prev) => prev.filter((route) => route.id !== routeId));
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
            <MoodInputScreen onComplete={() => setCurrentScreen("places")} />
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
              onComplete={handlePlacesComplete} 
              onReselect={() => setCurrentScreen("mood")}
              onViewHistory={() => {
                setHistoryReturnScreen("places");
                setCurrentScreen("history");
              }}
              onLogout={handleLogout}
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
