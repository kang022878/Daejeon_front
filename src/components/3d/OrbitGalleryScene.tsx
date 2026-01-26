import { Canvas, useThree } from "@react-three/fiber";
import { OrbitingImage } from "./OrbitingImage";
import { Environment, Float, Image } from "@react-three/drei";

// Placeholder mood images - these would be replaced with actual user photos
const MOOD_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=400&fit=crop",
];

interface OrbitGallerySceneProps {
  selectedImages: number[];
  onImageClick: (index: number) => void;
  centerImageSrc?: string;
  showCenter?: boolean;
}

function Scene({
  selectedImages,
  onImageClick,
  centerImageSrc,
  showCenter,
}: OrbitGallerySceneProps) {
  const { size } = useThree();
  const orbitRadius = size.width < 768 ? 2.8 : 3.6;

  return (
    <>
      {/* Ambient lighting for visibility */}
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00bfff" />
      
      {/* Orbiting images */}
      {MOOD_IMAGES.map((url, index) => (
        <OrbitingImage
          key={index}
          url={url}
          index={index}
          total={MOOD_IMAGES.length}
          radius={orbitRadius}
          rotationSpeed={0.15}
          isSelected={selectedImages.includes(index)}
          onClick={() => onImageClick(index)}
        />
      ))}
      
      {/* Center focal point - subtle glow */}
      {showCenter !== false && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          {centerImageSrc ? (
            <Image url={centerImageSrc} scale={[0.9, 0.9, 1]} position={[0, 0, 0]} />
          ) : (
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.3, 32, 32]} />
              <meshBasicMaterial
                color="#00bfff"
                transparent
                opacity={0.4}
              />
            </mesh>
          )}
        </Float>
      )}
      
      {/* Orbit ring indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[orbitRadius - 0.2, orbitRadius + 0.2, 64]} />
        <meshBasicMaterial 
          color="#00bfff" 
          transparent 
          opacity={0.15}
          side={2}
        />
      </mesh>
      
      <Environment preset="night" />
    </>
  );
}

export function OrbitGalleryScene({
  selectedImages,
  onImageClick,
  centerImageSrc,
  showCenter,
}: OrbitGallerySceneProps) {
  return (
    <Canvas
      camera={{ 
        position: [0, 2, 8], 
        fov: 50,
        near: 0.1,
        far: 100
      }}
      style={{ background: 'transparent' }}
      gl={{ 
        antialias: true,
        alpha: true,
      }}
    >
      <Scene
        selectedImages={selectedImages}
        onImageClick={onImageClick}
        centerImageSrc={centerImageSrc}
        showCenter={showCenter}
      />
    </Canvas>
  );
}
