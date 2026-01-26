import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedback } from "@/hooks/useFeedback";
import { RotateCcw, History, LogOut } from "lucide-react";

interface PlanetMeshProps {
  onClick: () => void;
  isOpen: boolean;
}

function PlanetMesh({ onClick, isOpen }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation
      meshRef.current.rotation.y += 0.005;
      // Gentle bobbing
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
    if (ringRef.current) {
      // Ring rotation around planet
      ringRef.current.rotation.z += 0.01;
      ringRef.current.rotation.x = Math.PI / 4;
    }
  });

  return (
    <group>
      {/* Planet */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={isOpen ? "#FFD700" : "#FFC107"}
          metalness={0.6}
          roughness={0.3}
          emissive={isOpen ? "#FFD700" : "#FFC107"}
          emissiveIntensity={isOpen ? 0.3 : 0.1}
        />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.7, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#FFD700"
          metalness={0.8}
          roughness={0.2}
          emissive="#FFD700"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Mascot face - simplified representation */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <group position={[0, 0, 0.51]}>
          {/* Eyes */}
          <mesh position={[-0.12, 0.08, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[0.12, 0.08, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* Smile */}
          <mesh position={[0, -0.08, 0]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.1, 0.02, 8, 16, Math.PI]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      </Billboard>

      {/* Glow effect */}
      <pointLight position={[0, 0, 0]} color="#FFD700" intensity={0.5} distance={3} />
    </group>
  );
}

function PlanetScene({ onClick, isOpen }: PlanetMeshProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 50 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <PlanetMesh onClick={onClick} isOpen={isOpen} />
    </Canvas>
  );
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface PlanetMenuProps {
  onReselectMood: () => void;
  onViewHistory: () => void;
  onLogout: () => void;
}

export function PlanetMenu({ onReselectMood, onViewHistory, onLogout }: PlanetMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { onClick, onSelect } = useFeedback();

  const menuItems: MenuItem[] = [
    {
      id: "mood",
      label: "무드 다시 선택",
      icon: <RotateCcw className="w-4 h-4" />,
      onClick: onReselectMood,
    },
    {
      id: "history",
      label: "루트 히스토리",
      icon: <History className="w-4 h-4" />,
      onClick: onViewHistory,
    },
    {
      id: "logout",
      label: "로그아웃",
      icon: <LogOut className="w-4 h-4" />,
      onClick: onLogout,
    },
  ];

  const handlePlanetClick = () => {
    onClick();
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    onSelect();
    setIsOpen(false);
    item.onClick();
  };

  return (
    <div className="relative">
      {/* 3D Planet */}
      <div className="w-16 h-16 cursor-pointer">
        <PlanetScene onClick={handlePlanetClick} isOpen={isOpen} />
      </div>

      {/* Menu Items - radial layout */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Menu items */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-50">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  className="flex items-center gap-2 bg-card/90 backdrop-blur-md border border-secondary/50 rounded-full px-4 py-2 mb-2 whitespace-nowrap hover:bg-secondary/20 hover:border-secondary transition-all duration-200 glow-yellow-box"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 10, 
                    scale: 0.8,
                    transition: { delay: (menuItems.length - index - 1) * 0.05 }
                  }}
                  onClick={() => handleMenuItemClick(item)}
                >
                  <span className="text-secondary">{item.icon}</span>
                  <span className="text-sm text-foreground">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
