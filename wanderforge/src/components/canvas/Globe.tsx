import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Trail, Float, Stars, OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

function TravelingParticle({ start, end, color, speed = 1 }: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const progress = useRef(0);

  const curve = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midPoint = startVec.clone().add(endVec).multiplyScalar(0.5);
    midPoint.normalize().multiplyScalar(2.5);
    return new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
  }, [start, end]);

  useFrame((_, delta) => {
    if (ref.current) {
      progress.current += delta * 0.3 * speed;
      if (progress.current > 1) progress.current = 0;
      const point = curve.getPoint(progress.current);
      ref.current.position.copy(point);
    }
  });

  return (
    <Trail width={0.05} length={8} color={color} attenuation={(t) => t * t}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </Trail>
  );
}

function ArcLine({ start, end, color }: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const points = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midPoint = startVec.clone().add(endVec).multiplyScalar(0.5);
    midPoint.normalize().multiplyScalar(2.5);
    const curve = new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
    return curve.getPoints(50);
  }, [start, end]);

  return (
    <Line points={points} color={color} lineWidth={1} transparent opacity={0.4} />
  );
}

function DestinationMarker({ position, color, pulse = true }: {
  position: [number, number, number];
  color: string;
  pulse?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current && pulse) {
      const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.3;
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.elapsedTime * 0.05;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial
          color="#1a365d"
          emissive="#312e81"
          emissiveIntensity={0.1}
          roughness={0.8}
          metalness={0.2}
        />
        <mesh>
          <sphereGeometry args={[1.52, 32, 32]} />
          <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.15} />
        </mesh>
        <mesh scale={1.15}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshBasicMaterial color="#818cf8" transparent opacity={0.1} side={THREE.BackSide} />
        </mesh>
      </mesh>
    </Float>
  );
}

function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

const destinations = [
  { name: 'Hampi', lat: 15.335, lng: 76.46, color: '#f59e0b' },
  { name: 'Mumbai', lat: 19.076, lng: 72.877, color: '#6366f1' },
  { name: 'Bangalore', lat: 12.971, lng: 77.594, color: '#10b981' },
  { name: 'Goa', lat: 15.299, lng: 74.124, color: '#ec4899' },
  { name: 'Kerala', lat: 10.850, lng: 76.271, color: '#8b5cf6' },
  { name: 'Delhi', lat: 28.613, lng: 77.209, color: '#f43f5e' },
];

const routes = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 2, to: 0 },
  { from: 5, to: 1 },
];

function Scene() {
  const positions = destinations.map(d => latLngToVector3(d.lat, d.lng, 1.55));

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Earth />
      {destinations.map((dest, i) => (
        <DestinationMarker key={dest.name} position={positions[i]} color={dest.color} />
      ))}
      {routes.map((route, i) => (
        <ArcLine key={i} start={positions[route.from]} end={positions[route.to]} color={destinations[route.from].color} />
      ))}
      {routes.map((route, i) => (
        <TravelingParticle
          key={`particle-${i}`}
          start={positions[route.from]}
          end={positions[route.to]}
          color={destinations[route.from].color}
          speed={0.8 + Math.random() * 0.4}
        />
      ))}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}

export default function Globe() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}
