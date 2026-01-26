import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SplashScreen } from "@/components/screens/SplashScreen";
import { OnboardingCityBirth } from "@/components/screens/OnboardingCityBirth";
import { FeatureOnboarding } from "@/components/screens/FeatureOnboarding";
import { MoodInputScreen } from "@/components/screens/MoodInputScreen";
import { PlaceSelectionScreen } from "@/components/screens/PlaceSelectionScreen";
import { RouteResultScreen } from "@/components/screens/RouteResultScreen";
import { RouteHistoryScreen } from "@/components/screens/RouteHistoryScreen";

// Screen state for navigation
type AppScreen = "splash" | "onboarding" | "features" | "mood" | "places" | "main" | "route" | "result" | "history";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("splash");
  const [selectedPlaces, setSelectedPlaces] = useState<number[]>([]);

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
    setSelectedPlaces(places);
    setCurrentScreen("route");
  };

  const handleLogout = () => {
    // Mock logout - return to splash
    setCurrentScreen("splash");
    setSelectedPlaces([]);
  };

  const handleSelectHistoryRoute = (routeId: string) => {
    // Mock: Load places from history and show route
    // In real app, would fetch from storage/API
    setSelectedPlaces([0, 2, 5, 7]); // Mock data
    setCurrentScreen("route");
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
              onViewHistory={() => setCurrentScreen("history")}
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
              onComplete={() => setCurrentScreen("result")}
              onReselect={() => setCurrentScreen("places")}
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
              onBack={() => setCurrentScreen("places")}
              onSelectRoute={handleSelectHistoryRoute}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
