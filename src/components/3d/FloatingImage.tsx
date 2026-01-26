import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Image } from "@react-three/drei";
import * as THREE from "three";

interface FloatingImageProps {
  url: string;
  initialPosition: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
}

export function FloatingImage({
  url,
  initialPosition,
  isSelected = false,
  onClick,
}: FloatingImageProps) {
  const groupRef = useRef<THREE.Group>(null);
  const imageRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Random drift parameters - unique per instance
  const driftParams = useMemo(() => ({
    speedX: 0.1 + Math.random() * 0.15,
    speedY: 0.08 + Math.random() * 0.12,
    speedZ: 0.05 + Math.random() * 0.1,
    amplitudeX: 0.3 + Math.random() * 0.4,
    amplitudeY: 0.2 + Math.random() * 0.3,
    amplitudeZ: 0.15 + Math.random() * 0.2,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    phaseZ: Math.random() * Math.PI * 2,
  }), []);

  // Target position for selected state (bottom cluster)
  const basePosition = useMemo(() => new THREE.Vector3(...initialPosition), [initialPosition]);
  
  useFrame((state) => {
    if (!groupRef.current || !imageRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Subtle drifting motion
    const driftX = Math.sin(time * driftParams.speedX + driftParams.phaseX) * driftParams.amplitudeX;
    const driftY = Math.sin(time * driftParams.speedY + driftParams.phaseY) * driftParams.amplitudeY;
    const driftZ = Math.sin(time * driftParams.speedZ + driftParams.phaseZ) * driftParams.amplitudeZ;
    
    // Calculate target position
    let targetX = basePosition.x + driftX;
    let targetY = basePosition.y + driftY;
    let targetZ = basePosition.z + driftZ;
    
    // When selected, pull forward in Z and move toward bottom cluster
    if (isSelected) {
      targetZ = basePosition.z + 2; // Pull forward
    }
    
    // Smooth interpolation to target
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.08);
    
    // Depth-based scaling: closer (higher z) = larger
    // Z ranges roughly from -3 to 3, normalize to 0.6-1.4 scale
    const normalizedZ = (groupRef.current.position.z + 3) / 6;
    const depthScale = 0.6 + normalizedZ * 0.8;
    
    // Apply hover effect only; selection should rely on glow
    let targetScale = depthScale;
    if (hovered) targetScale *= 1.1;
    
    imageRef.current.scale.setScalar(THREE.MathUtils.lerp(
      imageRef.current.scale.x,
      targetScale,
      0.1
    ));
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Image
          ref={imageRef}
          url={url}
          scale={1.2}
          transparent
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
        />
        {/* Selection glow ring */}
        {isSelected && (
          <mesh position={[0, 0, -0.02]}>
            <ringGeometry args={[0.55, 0.65, 32]} />
            <meshBasicMaterial 
              color="#00bfff" 
              transparent 
              opacity={0.6}
            />
          </mesh>
        )}
        {/* Hover indicator */}
        {hovered && !isSelected && (
          <mesh position={[0, 0, -0.01]}>
            <ringGeometry args={[0.58, 0.62, 32]} />
            <meshBasicMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3}
            />
          </mesh>
        )}
      </Billboard>
    </group>
  );
}
