import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  Eye,
  EyeOff,
  Download,
  X,
  Loader2,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { useARStore, tajMahalHotspots } from '../stores/ar.store';
import * as THREE from 'three';

// Declare MindAR types
declare global {
  interface Window {
    MINDAR: {
      IMAGE: {
        MindARThree: new (config: {
          container: HTMLElement;
          imageTargetSrc: string;
          maxTrack?: number;
          uiLoading?: string;
          uiScanning?: string;
          uiError?: string;
        }) => MindARThreeInstance;
      };
    };
  }
}

interface MindARThreeInstance {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  addAnchor: (index: number) => { group: THREE.Group };
  start: () => Promise<void>;
  stop: () => void;
}

// MindAR CDN URLs
const MINDAR_THREE_JS = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';

// Use MindAR's example target for demo (can be replaced with custom Taj Mahal marker)
const IMAGE_TARGET_URL = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind';

export default function TajMahalAR() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mindarRef = useRef<MindARThreeInstance | null>(null);
  const tajMahalGroupRef = useRef<THREE.Group | null>(null);

  const {
    trackingState,
    modelScale,
    modelRotation,
    selectedHotspot,
    showHotspots,
    showInfoPanel,
    showMarkerModal,
    showInstructions,
    errorMessage,
    setTrackingState,
    setCameraPermission,
    zoomIn,
    zoomOut,
    rotateModel,
    selectHotspot,
    toggleHotspots,
    toggleMarkerModal,
    dismissInstructions,
    setError,
    reset,
  } = useARStore();

  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load MindAR script dynamically
  useEffect(() => {
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.MINDAR) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = MINDAR_THREE_JS;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load MindAR'));
        document.head.appendChild(script);
      });
    };

    loadScript()
      .then(() => {
        setScriptLoaded(true);
      })
      .catch(() => {
        setError('Failed to load AR library. Please refresh the page.');
        setIsLoading(false);
      });

    return () => {
      // Cleanup
      if (mindarRef.current) {
        mindarRef.current.stop();
      }
    };
  }, [setError]);

  // Create Taj Mahal 3D model using Three.js primitives
  const createTajMahalModel = useCallback(() => {
    const group = new THREE.Group();

    // Materials
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
    });
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Main building base (platform)
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.3, 3),
      whiteMaterial
    );
    platform.position.y = 0.15;
    group.add(platform);

    // Main building body
    const mainBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.2, 2),
      whiteMaterial
    );
    mainBuilding.position.y = 0.9;
    group.add(mainBuilding);

    // Main dome
    const mainDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      whiteMaterial
    );
    mainDome.position.y = 1.5;
    group.add(mainDome);

    // Dome finial
    const finial = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.3, 8),
      goldMaterial
    );
    finial.position.y = 2.4;
    group.add(finial);

    // Four minarets
    const minaretPositions = [
      [-1.3, 0, -1.3],
      [1.3, 0, -1.3],
      [-1.3, 0, 1.3],
      [1.3, 0, 1.3],
    ];

    minaretPositions.forEach((pos) => {
      // Minaret body
      const minaret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 2, 16),
        whiteMaterial
      );
      minaret.position.set(pos[0], 1, pos[2]);
      group.add(minaret);

      // Minaret dome
      const minaretDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        whiteMaterial
      );
      minaretDome.position.set(pos[0], 2, pos[2]);
      group.add(minaretDome);

      // Minaret finial
      const minaretFinial = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.1, 8),
        goldMaterial
      );
      minaretFinial.position.set(pos[0], 2.2, pos[2]);
      group.add(minaretFinial);
    });

    // Smaller domes (chattris)
    const chatriPositions = [
      [-0.7, 1.5, -0.7],
      [0.7, 1.5, -0.7],
      [-0.7, 1.5, 0.7],
      [0.7, 1.5, 0.7],
    ];

    chatriPositions.forEach((pos) => {
      const chatri = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        whiteMaterial
      );
      chatri.position.set(pos[0], pos[1], pos[2]);
      group.add(chatri);
    });

    // Front entrance arch
    const archGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16, Math.PI);
    const arch = new THREE.Mesh(archGeometry, whiteMaterial);
    arch.position.set(0, 0.6, 1.01);
    arch.rotation.x = Math.PI / 2;
    arch.rotation.z = Math.PI;
    group.add(arch);

    // Reflecting pool
    const poolMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90d9,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
    });
    const pool = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.02, 2),
      poolMaterial
    );
    pool.position.set(0, 0.31, 2.5);
    group.add(pool);

    // Garden areas
    const gardenMaterial = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.8,
    });
    const gardenLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.05, 2),
      gardenMaterial
    );
    gardenLeft.position.set(-0.75, 0.31, 2.5);
    group.add(gardenLeft);

    const gardenRight = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.05, 2),
      gardenMaterial
    );
    gardenRight.position.set(0.75, 0.31, 2.5);
    group.add(gardenRight);

    // Scale the entire model
    group.scale.setScalar(0.5);

    return group;
  }, []);

  // Initialize MindAR
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;

    const initAR = async () => {
      try {
        // Request camera permission
        await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission('granted');

        const mindarThree = new window.MINDAR.IMAGE.MindARThree({
          container: containerRef.current!,
          imageTargetSrc: IMAGE_TARGET_URL,
          uiLoading: 'no',
          uiScanning: 'no',
          uiError: 'no',
        });

        mindarRef.current = mindarThree;
        const { renderer, scene, camera } = mindarThree;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        // Create and add Taj Mahal model
        const tajMahal = createTajMahalModel();
        tajMahalGroupRef.current = tajMahal;

        // Add anchor for image target
        const anchor = mindarThree.addAnchor(0);
        anchor.group.add(tajMahal);

        // Track target visibility
        anchor.group.visible = false;

        // Custom visibility check
        const checkVisibility = () => {
          if (anchor.group.visible) {
            setTrackingState('tracking');
          } else {
            setTrackingState('scanning');
          }
        };

        setIsLoading(false);
        setTrackingState('scanning');

        // Start AR
        await mindarThree.start();

        // Animation loop
        renderer.setAnimationLoop(() => {
          checkVisibility();

          // Apply user transformations
          if (tajMahalGroupRef.current) {
            tajMahalGroupRef.current.scale.setScalar(0.5 * modelScale);
            tajMahalGroupRef.current.rotation.y = (modelRotation * Math.PI) / 180;
          }

          renderer.render(scene, camera);
        });
      } catch (err) {
        console.error('AR initialization error:', err);
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setCameraPermission('denied');
          setError('Camera permission denied. Please allow camera access to use AR.');
        } else {
          setError('Failed to initialize AR. Please try again.');
        }
        setIsLoading(false);
      }
    };

    initAR();

    return () => {
      if (mindarRef.current) {
        mindarRef.current.stop();
      }
    };
  }, [scriptLoaded, createTajMahalModel, modelScale, modelRotation, setCameraPermission, setError, setTrackingState]);

  // Handle back navigation
  const handleBack = () => {
    reset();
    navigate('/india-heritage');
  };

  // Download marker image
  const handleDownloadMarker = () => {
    // Open the marker image in a new tab for printing
    window.open('https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png', '_blank');
  };

  return (
    <div className="relative w-full h-screen bg-dark-900 overflow-hidden">
      {/* AR Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-dark-900 flex flex-col items-center justify-center z-50"
          >
            <Loader2 className="w-12 h-12 text-accent-500 animate-spin mb-4" />
            <p className="text-white text-lg">Initializing AR Camera...</p>
            <p className="text-gray-400 text-sm mt-2">Please allow camera access when prompted</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-dark-900/95 flex flex-col items-center justify-center z-50 p-6"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-white text-lg text-center mb-4">{errorMessage}</p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
            >
              Go Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Toast */}
      <AnimatePresence>
        {showInstructions && !isLoading && !errorMessage && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-20 left-4 right-4 z-40"
          >
            <div className="bg-dark-800/95 backdrop-blur-sm rounded-xl p-4 border border-dark-700">
              <div className="flex items-start gap-3">
                <Smartphone className="w-6 h-6 text-accent-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-white font-medium">Point camera at the marker</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Print the AR marker and point your camera at it to see the 3D Taj Mahal
                  </p>
                  <button
                    onClick={handleDownloadMarker}
                    className="mt-2 text-accent-400 text-sm flex items-center gap-1 hover:text-accent-300"
                  >
                    <Download className="w-4 h-4" />
                    Download Marker
                  </button>
                </div>
                <button
                  onClick={dismissInstructions}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracking Status Indicator */}
      {!isLoading && !errorMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <div
            className={`px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 ${
              trackingState === 'tracking'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                trackingState === 'tracking' ? 'bg-green-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-sm font-medium">
              {trackingState === 'tracking' ? 'Tracking' : 'Scanning for marker...'}
            </span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
        <button
          onClick={handleBack}
          className="pointer-events-auto p-3 bg-dark-800/80 backdrop-blur-sm rounded-xl text-white hover:bg-dark-700 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={toggleHotspots}
            className={`p-3 backdrop-blur-sm rounded-xl transition-colors ${
              showHotspots
                ? 'bg-accent-500/80 text-white'
                : 'bg-dark-800/80 text-gray-400 hover:text-white'
            }`}
            title="Toggle hotspots"
          >
            {showHotspots ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
          </button>
          <button
            onClick={toggleMarkerModal}
            className="p-3 bg-dark-800/80 backdrop-blur-sm rounded-xl text-white hover:bg-dark-700 transition-colors"
            title="Download marker"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      {!isLoading && !errorMessage && (
        <div className="absolute bottom-8 left-4 right-4 z-30 pointer-events-none">
          <div className="flex justify-center gap-4 pointer-events-auto">
            {/* Zoom Out */}
            <button
              onClick={zoomOut}
              className="p-4 bg-dark-800/80 backdrop-blur-sm rounded-xl text-white hover:bg-dark-700 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-6 h-6" />
            </button>

            {/* Rotate */}
            <button
              onClick={() => rotateModel(45)}
              className="p-4 bg-dark-800/80 backdrop-blur-sm rounded-xl text-white hover:bg-dark-700 transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-6 h-6" />
            </button>

            {/* Info */}
            <button
              onClick={() => selectHotspot(tajMahalHotspots[0])}
              className="p-4 bg-accent-500/80 backdrop-blur-sm rounded-xl text-white hover:bg-accent-600 transition-colors"
              title="Monument info"
            >
              <Info className="w-6 h-6" />
            </button>

            {/* Zoom In */}
            <button
              onClick={zoomIn}
              className="p-4 bg-dark-800/80 backdrop-blur-sm rounded-xl text-white hover:bg-dark-700 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
          </div>

          {/* Hotspot Pills */}
          {showHotspots && trackingState === 'tracking' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-center gap-2 mt-4 flex-wrap pointer-events-auto"
            >
              {tajMahalHotspots.map((hotspot) => (
                <button
                  key={hotspot.id}
                  onClick={() => selectHotspot(hotspot)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedHotspot?.id === hotspot.id
                      ? 'bg-accent-500 text-white'
                      : 'bg-dark-800/80 text-gray-300 hover:bg-dark-700'
                  }`}
                >
                  {hotspot.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Info Panel */}
      <AnimatePresence>
        {showInfoPanel && selectedHotspot && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 left-0 right-0 z-40 pointer-events-auto"
          >
            <div className="bg-dark-800/95 backdrop-blur-xl rounded-t-3xl p-6 border-t border-dark-700">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{selectedHotspot.label}</h3>
                <button
                  onClick={() => selectHotspot(null)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-300 leading-relaxed">{selectedHotspot.description}</p>

              {/* Navigation between hotspots */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {tajMahalHotspots.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    onClick={() => selectHotspot(hotspot)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      selectedHotspot.id === hotspot.id
                        ? 'bg-accent-500 text-white'
                        : 'bg-dark-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    {hotspot.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Marker Download Modal */}
      <AnimatePresence>
        {showMarkerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
            onClick={toggleMarkerModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">AR Marker</h3>
                <button
                  onClick={toggleMarkerModal}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4">
                <img
                  src="https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png"
                  alt="AR Marker"
                  className="w-full h-auto"
                />
              </div>

              <p className="text-gray-400 text-sm mb-4">
                Print this marker or display it on another screen. Point your camera at it to see the 3D Taj Mahal model appear.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDownloadMarker}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Marker
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
