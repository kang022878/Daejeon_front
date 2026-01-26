import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Route, Camera } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
import { Button } from "@/components/ui/button";

interface FeatureSlide {
  id: string;
  icon: React.ReactNode;
  titleKo: string;
  titleEn: string;
  description: string;
}

const slides: FeatureSlide[] = [
  {
    id: "spots",
    icon: <MapPin className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1} />,
    titleKo: "맞춤형 장소 추천",
    titleEn: "Personalized Spots",
    description: "AI가 당신의 무드를 분석하여\n완벽한 대전 명소를 추천합니다",
  },
  {
    id: "flow",
    icon: <Route className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1} />,
    titleKo: "스마트 여행 동선",
    titleEn: "Smart Travel Flow",
    description: "최적의 경로로 연결된\n효율적인 여행 동선을 제공합니다",
  },
  {
    id: "moments",
    icon: <Camera className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1} />,
    titleKo: "지도 위의 추억",
    titleEn: "Moments on the Map",
    description: "방문한 장소의 사진을 기록하고\n나만의 여행 지도를 완성하세요",
  },
];

interface FeatureOnboardingProps {
  onComplete: () => void;
}

export function FeatureOnboarding({ onComplete }: FeatureOnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowLogin(true);
    }
  };

  const handleKakaoLogin = () => {
    // Mock login - proceed to next screen
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Space background */}
      <SpaceParticles particleCount={60} />

      {/* Skip button */}
      {!showLogin && (
        <motion.button
          className="absolute top-6 right-6 z-20 text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleSkip}
        >
          Skip
        </motion.button>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {!showLogin ? (
            <motion.div
              key={slides[currentSlide].id}
              className="flex flex-col items-center text-center max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Icon */}
              <motion.div
                className="mb-8 text-primary"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="p-6 rounded-full border border-primary/30 glow-blue-box">
                  {slides[currentSlide].icon}
                </div>
              </motion.div>

              {/* English title */}
              <motion.p
                className="text-xs md:text-sm text-muted-foreground tracking-[0.3em] uppercase mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {slides[currentSlide].titleEn}
              </motion.p>

              {/* Korean title */}
              <motion.h2
                className="text-2xl md:text-3xl font-light text-foreground tracking-wide mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {slides[currentSlide].titleKo}
              </motion.h2>

              {/* Description */}
              <motion.p
                className="text-sm md:text-base text-muted-foreground font-extralight leading-relaxed whitespace-pre-line"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {slides[currentSlide].description}
              </motion.p>
            </motion.div>
          ) : (
            /* Kakao Login Screen */
            <motion.div
              key="login"
              className="flex flex-col items-center text-center max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Logo */}
              <motion.div
                className="mb-8"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h1 className="text-3xl md:text-4xl font-light tracking-title text-foreground">
                  <span className="glow-blue">RE:</span> DAEJEON
                </h1>
              </motion.div>

              {/* Welcome text */}
              <motion.p
                className="text-lg md:text-xl text-foreground font-light tracking-wide mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                대전 여행을 시작하세요
              </motion.p>
              
              <motion.p
                className="text-sm text-muted-foreground font-extralight mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Start your Daejeon journey
              </motion.p>

              {/* Kakao Login Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Button
                  onClick={handleKakaoLogin}
                  className="px-8 py-6 text-base font-medium bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] rounded-lg flex items-center gap-3 transition-all duration-300"
                >
                  {/* Kakao icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.48 2 10.5c0 2.52 1.68 4.74 4.2 6.06-.18.66-.66 2.4-.76 2.78-.12.48.18.48.38.34.16-.1 2.46-1.66 3.46-2.34.56.08 1.14.16 1.72.16 5.52 0 10-3.48 10-7.5S17.52 3 12 3z"/>
                  </svg>
                  카카오로 시작하기
                </Button>
              </motion.div>

              {/* Alternative login */}
              <motion.button
                className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                onClick={handleKakaoLogin}
              >
                다른 방법으로 로그인
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slide indicators & Next button */}
        {!showLogin && (
          <motion.div
            className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {/* Dot indicators */}
            <div className="flex gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-primary w-6 glow-blue-box"
                      : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                  }`}
                />
              ))}
            </div>

            {/* Next button */}
            <Button
              onClick={handleNext}
              variant="outline"
              className="px-8 py-5 text-sm font-light tracking-wide border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500"
            >
              {currentSlide < slides.length - 1 ? "다음" : "시작하기"}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Gradient vignette */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" style={{ zIndex: 5 }} />
    </div>
  );
}
