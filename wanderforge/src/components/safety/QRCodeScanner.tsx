// QR Code Scanner Component - Scan QR to join a group
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Loader2, QrCode, Keyboard } from 'lucide-react';
import Button from '../ui/Button';

interface QRCodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function QRCodeScanner({
  onScan,
  onClose,
  isLoading = false,
  error: externalError = null,
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasStartedRef = useRef(false);

  const error = externalError || scanError;

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    setIsScanning(true);
    setScanError(null);

    try {
      const scanner = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Extract code from URL or use directly
          let code = decodedText;

          // Check if it's a URL with join parameter
          const urlMatch = decodedText.match(/[?&]join=([A-Z0-9]{6})/i);
          if (urlMatch) {
            code = urlMatch[1].toUpperCase();
          } else if (/^[A-Z0-9]{6}$/i.test(decodedText)) {
            // Direct 6-character code
            code = decodedText.toUpperCase();
          } else {
            // Invalid format, keep scanning
            return;
          }

          // Stop scanner and call onScan
          scanner.stop().then(() => {
            hasStartedRef.current = false;
            onScan(code);
          }).catch(() => {
            onScan(code);
          });
        },
        () => {
          // Ignore continuous scan errors (no QR found)
        }
      );
    } catch (err) {
      hasStartedRef.current = false;
      setIsScanning(false);

      const errorMessage = (err as Error).message || 'Camera access failed';

      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission')) {
        setScanError('Camera permission denied. Please allow camera access or enter code manually.');
      } else if (errorMessage.includes('NotFoundError')) {
        setScanError('No camera found on this device. Please enter code manually.');
      } else {
        setScanError('Camera access failed. Please enter code manually.');
      }

      setShowManualEntry(true);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    hasStartedRef.current = false;
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    const code = manualCode.toUpperCase().trim();
    if (/^[A-Z0-9]{6}$/.test(code)) {
      setScanError(null);
      onScan(code);
    } else {
      setScanError('Please enter a valid 6-character code');
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-dark-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md glass-card p-6 relative"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-dark-700/50 text-dark-400 hover:text-dark-200 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">
                Scan QR Code
              </h2>
              <p className="text-dark-400 text-sm">
                Point camera at the group QR code
              </p>
            </div>
          </div>

          {/* Scanner Area */}
          {!showManualEntry && (
            <div
              id="qr-reader"
              className="w-full aspect-square bg-dark-800 rounded-xl overflow-hidden mb-4 relative"
            >
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Camera className="w-12 h-12 text-dark-500 mb-4" />
                  <Button variant="primary" onClick={startScanner}>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-2" />
                <span className="text-dark-300">Joining group...</span>
              </div>
            </div>
          )}

          {/* Toggle to Manual Entry */}
          {!showManualEntry && (
            <button
              onClick={() => {
                stopScanner();
                setShowManualEntry(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-dark-400 hover:text-dark-200 transition-colors"
            >
              <Keyboard className="w-4 h-4" />
              <span className="text-sm">Enter code manually</span>
            </button>
          )}

          {/* Manual Code Entry */}
          {showManualEntry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-4 bg-dark-800/50 border border-dark-700 rounded-xl text-white font-mono text-2xl text-center tracking-[0.3em] placeholder-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition uppercase"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualCode.length === 6) {
                      handleManualSubmit();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setShowManualEntry(false);
                    setScanError(null);
                  }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Use Camera
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleManualSubmit}
                  disabled={manualCode.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Join Group
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
