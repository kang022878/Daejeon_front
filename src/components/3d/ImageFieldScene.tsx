import { Canvas } from "@react-three/fiber";
import { FloatingImage } from "./FloatingImage";
import { Environment, Float } from "@react-three/drei";
import { useMemo } from "react";

// Sample place images - would be replaced with actual recommendation data
const PLACE_IMAGES = [
  { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop", name: "카페" },
  { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop", name: "레스토랑" },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", name: "공원" },
  { url: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=400&fit=crop", name: "미술관" },
  { url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=400&fit=crop", name: "바" },
  { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=400&fit=crop", name: "베이커리" },
  { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop", name: "맛집" },
  { url: "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=400&h=400&fit=crop", name: "카페2" },
  { url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop", name: "북카페" },
  { url: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&h=400&fit=crop", name: "파티룸" },
  { url: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&h=400&fit=crop", name: "레스토랑2" },
  { url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=400&fit=crop", name: "브런치" },
];

interface ImageFieldSceneProps {
  selectedPlaces: number[];
  onPlaceClick: (index: number) => void;
}

function Scene({ selectedPlaces, onPlaceClick }: ImageFieldSceneProps) {
  // Generate random initial positions for floating effect
  const positions = useMemo(() => {
    return PLACE_IMAGES.map((_, index) => {
      // Distribute in a 3D space with some randomness
      const angle = (index / PLACE_IMAGES.length) * Math.PI * 2;
      const radius = 2 + Math.random() * 1.5;
      const height = -1.5 + Math.random() * 3;
      const depth = -2 + Math.random() * 2;
      
      return [
        Math.cos(angle) * radius + (Math.random() - 0.5) * 1.5,
        height,
        depth + Math.sin(angle) * 0.5,
      ] as [number, number, number];
    });
  }, []);

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -5, -10]} intensity={0.4} color="#00bfff" />
      <pointLight position={[5, -10, 5]} intensity={0.3} color="#ffd700" />
      
      {/* Floating images in 3D space */}
      {PLACE_IMAGES.map((place, index) => (
        <FloatingImage
          key={index}
          url={place.url}
          initialPosition={positions[index]}
          isSelected={selectedPlaces.includes(index)}
          onClick={() => onPlaceClick(index)}
        />
      ))}
      
      {/* Center focal point - subtle glow */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh position={[0, 0, -1]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshBasicMaterial 
            color="#ffd700" 
            transparent 
            opacity={0.5}
          />
        </mesh>
      </Float>
      
      {/* Ambient depth particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <Float 
          key={`particle-${i}`} 
          speed={0.5 + Math.random() * 0.5} 
          floatIntensity={0.3}
        >
          <mesh 
            position={[
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 6,
              -3 + Math.random() * 2
            ]}
          >
            <sphereGeometry args={[0.02 + Math.random() * 0.03, 8, 8]} />
            <meshBasicMaterial 
              color={Math.random() > 0.5 ? "#00bfff" : "#ffd700"} 
              transparent 
              opacity={0.3 + Math.random() * 0.4}
            />
          </mesh>
        </Float>
      ))}
      
      <Environment preset="night" />
    </>
  );
}

export function ImageFieldScene({ selectedPlaces, onPlaceClick }: ImageFieldSceneProps) {
  return (
    <Canvas
      camera={{ 
        position: [0, 0, 6], 
        fov: 55,
        near: 0.1,
        far: 100
      }}
      style={{ background: 'transparent' }}
      gl={{ 
        antialias: true,
        alpha: true,
      }}
    >
      <Scene selectedPlaces={selectedPlaces} onPlaceClick={onPlaceClick} />
    </Canvas>
  );
}

export { PLACE_IMAGES };
