import { Canvas } from "@react-three/fiber";
import { FloatingImage } from "./FloatingImage";
import { Environment, Float } from "@react-three/drei";
import { useMemo } from "react";

export type PlaceImage = {
  id?: number;
  url: string;
  name?: string;
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
  duration?: number;
  transport?: string;
  walkDuration?: number;
  driveDuration?: number;
  moodTag?: string;
};

interface ImageFieldSceneProps {
  selectedPlaces: number[];
  onPlaceClick: (index: number) => void;
  places: PlaceImage[];
}

function Scene({ selectedPlaces, onPlaceClick, places }: ImageFieldSceneProps) {
  // Generate random initial positions for floating effect
  const positions = useMemo(() => {
    return places.map((_, index) => {
      // Distribute in a 3D space with some randomness
      const angle = (index / places.length) * Math.PI * 2;
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
      {places.map((place, index) => (
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

export function ImageFieldScene({ selectedPlaces, onPlaceClick, places }: ImageFieldSceneProps) {
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
      <Scene selectedPlaces={selectedPlaces} onPlaceClick={onPlaceClick} places={places} />
    </Canvas>
  );
}
