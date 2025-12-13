import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Info,
  X,
  Sparkles,
  MapPin,
  Clock,
  Users,
  ChevronUp,
  Camera,
  ZoomIn,
  ZoomOut,
  Move3D,
  RefreshCw,
} from 'lucide-react';
import * as THREE from 'three';

interface FactCard {
  icon: string;
  title: string;
  value: string;
}

const tajMahalFacts: FactCard[] = [
  { icon: '🏛️', title: 'Built', value: '1632-1653' },
  { icon: '📏', title: 'Height', value: '73 meters' },
  { icon: '👥', title: 'Workers', value: '20,000+' },
  { icon: '💎', title: 'Material', value: 'White Marble' },
];

const architectureInfo = [
  {
    id: 'dome',
    title: 'The Great Dome',
    description: 'Rising 73 meters, the double-layered marble dome is crowned with a gilded finial combining traditional Persian and Hindu elements.',
  },
  {
    id: 'minarets',
    title: 'Four Minarets',
    description: 'Each 40-meter minaret is slightly tilted outward to protect the main tomb in case of collapse.',
  },
  {
    id: 'pietra-dura',
    title: 'Pietra Dura',
    description: 'Intricate inlay work featuring 28 types of precious stones including lapis lazuli, jade, and sapphire.',
  },
  {
    id: 'calligraphy',
    title: 'Quranic Calligraphy',
    description: 'Verses from the Quran in elegant thuluth script, created using jasper inlaid in white marble.',
  },
];

export default function TajMahalAR() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [_cameraError, setCameraError] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(0);
  const [showFacts, setShowFacts] = useState(false);
  const [modelScale, setModelScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);

  // Create detailed Taj Mahal model
  const createTajMahalModel = useCallback(() => {
    const group = new THREE.Group();

    const marbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xfefefa,
      roughness: 0.15,
      metalness: 0.05,
    });

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.1,
      metalness: 0.9,
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
    });

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.05,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
    });

    const gardenMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.9,
    });

    // Base Platforms
    const platform1 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 5), marbleMaterial);
    platform1.position.y = 0.075;
    platform1.castShadow = true;
    platform1.receiveShadow = true;
    group.add(platform1);

    const platform2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 4.5), marbleMaterial);
    platform2.position.y = 0.2;
    group.add(platform2);

    const platform3 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4), marbleMaterial);
    platform3.position.y = 0.3;
    group.add(platform3);

    // Main Building
    const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 2), marbleMaterial);
    mainBuilding.position.y = 0.95;
    mainBuilding.castShadow = true;
    group.add(mainBuilding);

    // Archways
    for (let i = 0; i < 4; i++) {
      const archGroup = new THREE.Group();
      const arch = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.05), darkMaterial);
      arch.position.set(0, 0.8, 1.01);
      archGroup.add(arch);

      const archTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.05, 32, 1, false, 0, Math.PI),
        darkMaterial
      );
      archTop.rotation.x = Math.PI / 2;
      archTop.rotation.z = Math.PI / 2;
      archTop.position.set(0, 1.25, 1.01);
      archGroup.add(archTop);

      archGroup.rotation.y = (i * Math.PI) / 2;
      group.add(archGroup);
    }

    // Upper section
    const upperSection = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.8), marbleMaterial);
    upperSection.position.y = 1.7;
    group.add(upperSection);

    // Dome base
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 0.2, 32), marbleMaterial);
    domeBase.position.y = 1.95;
    group.add(domeBase);

    // Main Dome
    const domeGeometry = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeometry, marbleMaterial);
    dome.position.y = 2.05;
    dome.castShadow = true;
    group.add(dome);

    // Finial
    const finialBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 16), goldMaterial);
    finialBase.position.y = 3.1;
    group.add(finialBase);

    const finialBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), goldMaterial);
    finialBall.position.y = 3.2;
    group.add(finialBall);

    const finialSpire = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 16), goldMaterial);
    finialSpire.position.y = 3.45;
    group.add(finialSpire);

    // Chattris
    const chattriPositions = [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]];
    chattriPositions.forEach(([x, z]) => {
      const chattriBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.2, 16), marbleMaterial);
      chattriBase.position.set(x, 1.65, z);
      group.add(chattriBase);

      const chattriDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        marbleMaterial
      );
      chattriDome.position.set(x, 1.75, z);
      group.add(chattriDome);

      const chattriFinial = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.1, 8), goldMaterial);
      chattriFinial.position.set(x, 2, z);
      group.add(chattriFinial);
    });

    // Minarets
    const minaretPositions = [[-2, -2], [2, -2], [-2, 2], [2, 2]];
    minaretPositions.forEach(([x, z]) => {
      const minaretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 16), marbleMaterial);
      minaretBase.position.set(x, 0.4, z);
      group.add(minaretBase);

      const minaretBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 2, 16), marbleMaterial);
      minaretBody.position.set(x, 1.55, z);
      minaretBody.castShadow = true;
      group.add(minaretBody);

      [0.8, 1.4, 2.0].forEach((y) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 32), marbleMaterial);
        ring.position.set(x, y, z);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      });

      const minaretTop = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 16), marbleMaterial);
      minaretTop.position.set(x, 2.75, z);
      group.add(minaretTop);

      const minaretDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        marbleMaterial
      );
      minaretDome.position.set(x, 2.95, z);
      group.add(minaretDome);

      const minaretFinial = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.1, 8), goldMaterial);
      minaretFinial.position.set(x, 3.15, z);
      group.add(minaretFinial);
    });

    // Pool
    const pool = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 3), waterMaterial);
    pool.position.set(0, 0.16, 2.5);
    group.add(pool);

    // Gardens
    const garden1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 3), gardenMaterial);
    garden1.position.set(-1.1, 0.16, 2.5);
    group.add(garden1);

    const garden2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 3), gardenMaterial);
    garden2.position.set(1.1, 0.16, 2.5);
    group.add(garden2);

    return group;
  }, []);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError('Camera not available. Showing 3D preview mode.');
        setCameraActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      const video = videoRef.current;
      if (video?.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize Three.js
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd700, 0.2);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    const model = createTajMahalModel();
    model.scale.setScalar(0.8);
    modelRef.current = model;
    scene.add(model);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      if (modelRef.current) {
        modelRef.current.scale.setScalar(0.8 * modelScale);
        if (autoRotate) {
          modelRef.current.rotation.y += 0.003;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
    };
  }, [createTajMahalModel, modelScale, autoRotate]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setLastTouch({ x: clientX, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !modelRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - lastTouch.x;
    modelRef.current.rotation.y += deltaX * 0.01;
    setLastTouch({ x: clientX, y: 0 });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleBack = () => navigate('/india-heritage');

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Camera Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Fallback gradient */}
      {!cameraActive && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black" />
      )}

      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Loading */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center"
          >
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-amber-500/30 flex items-center justify-center">
                <Camera className="w-10 h-10 text-amber-400" />
              </div>
              <motion.div
                className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-amber-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <h2 className="text-2xl font-light text-white mb-2">Initializing AR</h2>
            <p className="text-slate-400 text-sm">Preparing immersive experience...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute top-0 left-0 right-0 z-40"
      >
        <div className="bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-4 pb-16 px-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className={`px-4 py-2 rounded-full backdrop-blur-xl border ${
              cameraActive
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-sm font-medium">{cameraActive ? 'AR Active' : '3D Preview'}</span>
              </div>
            </div>

            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className={`p-3 backdrop-blur-xl rounded-2xl transition-all border ${
                showInfoPanel ? 'bg-amber-500/30 border-amber-500/50 text-amber-400' : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
              }`}
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Monument Label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute top-24 left-1/2 -translate-x-1/2 z-30"
      >
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-2xl rounded-2xl px-6 py-3 border border-amber-500/30">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-white font-medium">Taj Mahal</span>
            <span className="text-amber-400 text-sm">UNESCO Heritage</span>
          </div>
        </div>
      </motion.div>

      {/* Side Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3"
      >
        <button
          onClick={() => setModelScale(s => Math.min(2, s + 0.2))}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/10"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => setModelScale(s => Math.max(0.3, s - 0.2))}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/10"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-3 backdrop-blur-xl rounded-2xl transition-all border ${
            autoRotate ? 'bg-amber-500/30 border-amber-500/50 text-amber-400' : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        </button>
      </motion.div>

      {/* Drag hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-48 left-1/2 -translate-x-1/2 z-30"
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 text-white/70 text-sm">
          <Move3D className="w-4 h-4" />
          <span>Drag to rotate</span>
        </div>
      </motion.div>

      {/* Bottom Facts */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 z-40"
      >
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-6 px-4">
          <button
            onClick={() => setShowFacts(!showFacts)}
            className="mx-auto mb-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full border border-white/10 text-white"
          >
            <motion.div animate={{ rotate: showFacts ? 180 : 0 }}>
              <ChevronUp className="w-4 h-4" />
            </motion.div>
            <span className="text-sm">Quick Facts</span>
          </button>

          <AnimatePresence>
            {showFacts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {tajMahalFacts.map((fact, i) => (
                    <motion.div
                      key={fact.title}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 text-center border border-white/10"
                    >
                      <div className="text-2xl mb-1">{fact.icon}</div>
                      <div className="text-white font-semibold text-sm">{fact.value}</div>
                      <div className="text-slate-400 text-xs">{fact.title}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Agra, India</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>1632-1653</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4 text-amber-500" />
              <span>7M+/year</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfoPanel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 bottom-0 w-full max-w-md z-50 bg-slate-900/95 backdrop-blur-2xl border-l border-white/10"
          >
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-light text-white">Taj Mahal</h2>
                  <button onClick={() => setShowInfoPanel(false)} className="p-2 hover:bg-white/10 rounded-xl">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  An ivory-white marble mausoleum commissioned by Mughal emperor Shah Jahan
                  in memory of his wife Mumtaz Mahal. A UNESCO World Heritage Site and one
                  of the New Seven Wonders of the World.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-amber-500 text-sm font-medium uppercase tracking-wider mb-4">
                  Architectural Highlights
                </h3>
                <div className="space-y-4">
                  {architectureInfo.map((info, i) => (
                    <button
                      key={info.id}
                      onClick={() => setSelectedInfo(i)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedInfo === i ? 'bg-amber-500/20 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <h4 className={`font-medium mb-1 ${selectedInfo === i ? 'text-amber-400' : 'text-white'}`}>
                        {info.title}
                      </h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{info.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-black/30">
                <div className="text-sm text-slate-500">UNESCO World Heritage Site since 1983</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
