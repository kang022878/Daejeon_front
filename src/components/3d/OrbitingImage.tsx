import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Image } from "@react-three/drei";
import * as THREE from "three";

interface OrbitingImageProps {
  url: string;
  index: number;
  total: number;
  radius: number;
  rotationSpeed: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function OrbitingImage({
  url,
  index,
  total,
  radius,
  rotationSpeed,
  isSelected = false,
  onClick,
}: OrbitingImageProps) {
  const groupRef = useRef<THREE.Group>(null);
  const imageRef = useRef<THREE.Mesh>(null);
  
  // Calculate initial angle based on index
  const initialAngle = (index / total) * Math.PI * 2;
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const angle = initialAngle + time * rotationSpeed;
    
    // Position on circular orbit
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    groupRef.current.position.x = x;
    groupRef.current.position.z = z;
    
    // Depth-based scaling: closer (higher z) = larger
    // Z ranges from -radius to +radius, normalize to 0.6-1.4 scale
    const normalizedZ = (z + radius) / (radius * 2);
    const scale = 0.6 + normalizedZ * 0.8;
    
    if (imageRef.current) {
      const targetScale = isSelected ? scale * 1.3 : scale;
      imageRef.current.scale.setScalar(THREE.MathUtils.lerp(
        imageRef.current.scale.x,
        targetScale,
        0.1
      ));
    }
  });

  return (
    <group ref={groupRef}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Image
          ref={imageRef}
          url={url}
          scale={1.5}
          transparent
          onClick={onClick}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'default'}
        />
        {isSelected && (
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.7, 1.7]} />
            <meshBasicMaterial 
              color="#00bfff" 
              transparent 
              opacity={0.3}
            />
          </mesh>
        )}
      </Billboard>
    </group>
  );
}
