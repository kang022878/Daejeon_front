import { useRef, useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpaceParticles } from "@/components/SpaceParticles";
import { OrbitGalleryScene } from "@/components/3d/OrbitGalleryScene";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2, Upload, X } from "lucide-react";
import { analyzeImages } from "@/lib/api";

interface MoodInputScreenProps {
  onComplete: () => void;
}

export function MoodInputScreen({ onComplete }: MoodInputScreenProps) {
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wasEmptyRef = useRef(true);

  const defaultMoodImages = [
    "/moods/mood-1.png",
    "/moods/mood-2.png",
    "/moods/mood-3.png",
    "/moods/mood-4.png",
    "/moods/mood-5.png",
  ];
  const galleryImages = images.length > 0 ? images.map((item) => item.url) : defaultMoodImages;

  useEffect(() => {
    const isEmpty = images.length === 0;
    if (wasEmptyRef.current !== isEmpty) {
      setSelectedImages([]);
    }
    wasEmptyRef.current = isEmpty;
  }, [images.length]);

  const handleImageClick = (index: number) => {
    setSelectedImages(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), index];
      }
      return [...prev, index];
    });
  };

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const selectedFiles = selectedImages
        .map((index) => images[index]?.file)
        .filter((file): file is File => Boolean(file));

      if (selectedFiles.length > 0) {
        await analyzeImages(selectedFiles);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Image analyze failed", error);
    }
    setIsAnalyzing(false);
    onComplete();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const nextImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...nextImages]);
    event.target.value = "";
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    setSelectedImages((prev) =>
      prev
        .filter((index) => index !== indexToRemove)
        .map((index) => (index > indexToRemove ? index - 1 : index))
    );
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <SpaceParticles particleCount={60} />
      
      {/* Header */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20 pt-safe"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="px-6 py-8 text-center">
          <h1 className="text-elegant text-xs text-muted-foreground mb-2">
            MOOD INPUT
          </h1>
          <h2 className="text-title text-xl text-foreground tracking-wide">
            오늘의 무드를 선택하세요
          </h2>
          <p className="text-subtitle text-sm text-muted-foreground mt-2">
            최대 3장의 이미지를 선택할 수 있습니다
          </p>
        </div>
      </motion.div>

      {/* 3D Gallery */}
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
          <OrbitGalleryScene
            selectedImages={selectedImages}
            onImageClick={handleImageClick}
            showCenter={false}
            images={galleryImages}
          />
        </Suspense>
      </motion.div>

      {/* Selected count indicator */}
      <AnimatePresence>
        {selectedImages.length > 0 && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 z-30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    i < selectedImages.length 
                      ? 'bg-primary glow-blue-box' 
                      : 'bg-muted'
                  }`}
                  animate={i < selectedImages.length ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
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
        <div className="px-6 pb-8 space-y-4">
          {images.length > 0 && (
            <div className="rounded-xl border border-muted/40 bg-card/40 backdrop-blur-sm p-3">
              <p className="text-xs text-muted-foreground mb-2">업로드한 사진</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((item, index) => (
                  <div key={item.url} className="relative w-14 h-14 rounded-lg overflow-hidden border border-muted/50 shrink-0">
                    <img src={item.url} alt={`upload-${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background/80 border border-muted flex items-center justify-center hover:bg-background"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Upload custom photo button */}
          <Button
            variant="outline"
            className="w-full h-12 border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300"
            onClick={handleUploadClick}
          >
            <Upload className="w-4 h-4 mr-2" />
            <span className="text-elegant text-xs">내 사진 업로드</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUploadChange}
          />

          {/* Analyze button */}
          <Button
            onClick={handleAnalyze}
            disabled={selectedImages.length === 0 || isAnalyzing}
            className="w-full h-14 bg-primary text-primary-foreground glow-blue-box hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="text-elegant text-sm">
                  무드 분석하기
                </span>
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {selectedImages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              원하는 이미지를 탭하여 선택하세요
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
