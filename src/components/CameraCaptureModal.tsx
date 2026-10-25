import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Check, X, Sparkles, Smile, RefreshCw, AlertCircle } from 'lucide-react';
import { StickerId } from '../types/game';
import { STICKERS, DEFAULT_AVATARS } from '../data/themes';
import { sounds } from '../audio/soundManager';

interface Props {
  playerName: string;
  initialPhoto: string | null;
  initialSticker: StickerId;
  onSave: (photoUrl: string | null, sticker: StickerId) => void;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<Props> = ({
  playerName,
  initialPhoto,
  initialSticker,
  onSave,
  onClose,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhoto);
  const [selectedSticker, setSelectedSticker] = useState<StickerId>(initialSticker);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Stop live stream if active
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsLiveActive(false);
  };

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // Process any File/Blob into a centered circular cropped data URL
  const processImageFile = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsLoading(false);
          return;
        }

        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        // Circular clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(180, 180, 174, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 360, 360);
        ctx.restore();

        // High contrast border ring
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(180, 180, 174, 0, Math.PI * 2);
        ctx.stroke();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPhotoPreview(dataUrl);
        setIsLoading(false);
        sounds.sfxCameraClick();
        stopLiveCamera();
      };
      img.onerror = () => {
        setIsLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle native camera / file change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input value so re-taking with the same file triggers change
    e.target.value = '';
  };

  // Optional: Try starting in-browser live webcam stream
  const startLiveWebcam = async () => {
    setLiveError(null);
    sounds.sfxPop();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setLiveError('Tu navegador no permite cámara en vivo aquí. ¡Usa el botón "Hacer Foto con Cámara"!');
      return;
    }

    try {
      stopLiveCamera();
      let stream: MediaStream;
      try {
        // Try user facing camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        // Fallback to simple video
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsLiveActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
    } catch (err: any) {
      console.warn('Webcam stream error:', err);
      setLiveError(
        'El navegador bloqueó el vídeo en vivo. ¡Usa el botón "Hacer Foto con Cámara" para abrir la cámara de tu móvil!'
      );
      setIsLiveActive(false);
    }
  };

  // Trigger live snapshot countdown
  const triggerLiveSnapshot = () => {
    if (countdown !== null) return;
    setCountdown(3);
    sounds.sfxCountdown(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          captureFromVideo();
          return null;
        }
        sounds.sfxCountdown(prev === 2);
        return prev - 1;
      });
    }, 900);
  };

  // Capture frame from active HTML video
  const captureFromVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    const vw = video.videoWidth || 360;
    const vh = video.videoHeight || 360;
    const size = Math.min(vw, vh);

    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(180, 180, 174, 0, Math.PI * 2);
    ctx.clip();

    // Mirror image for natural selfie feel
    ctx.translate(360, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 360, 360);
    ctx.restore();

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(180, 180, 174, 0, Math.PI * 2);
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoPreview(dataUrl);
    setFlash(true);
    sounds.sfxCameraClick();
    setTimeout(() => setFlash(false), 200);
    stopLiveCamera();
  };

  const currentStickerObj = STICKERS.find((s) => s.id === selectedSticker);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border-4 border-amber-300 text-slate-800 flex flex-col items-center max-h-[94vh] overflow-y-auto">
        {/* Hidden File & Native Camera Inputs */}
        {/* capture="user" triggers device camera directly on mobile iOS / Android without iframe permission issues! */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleInputChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.sfxPop();
            stopLiveCamera();
            onClose();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-black text-pink-600 text-center mb-1 flex items-center gap-2">
          <span>📸</span> ¡Foto de {playerName}!
        </h2>
        <p className="text-xs font-semibold text-slate-500 mb-3 text-center">
          Tu cara saldrá jugando dentro del circuito
        </p>

        {/* Big Circular Photo Viewfinder */}
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full border-4 border-pink-400 shadow-lg bg-pink-50 overflow-hidden flex items-center justify-center mb-4 shrink-0">
          {flash && <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-300" />}

          {countdown !== null && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <span className="text-6xl font-black text-yellow-300 drop-shadow-md animate-ping">
                {countdown}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-pink-500 gap-2">
              <RefreshCw className="w-10 h-10 animate-spin" />
              <span className="text-xs font-bold">Cargando foto...</span>
            </div>
          ) : isLiveActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : photoPreview ? (
            <img
              src={photoPreview}
              alt={playerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <Smile className="w-16 h-16 text-amber-400 mb-1 animate-bounce" />
              <span className="text-xs font-bold text-slate-600">¡Hazte una foto!</span>
            </div>
          )}

          {/* Sticker Overlay */}
          {selectedSticker !== 'none' && currentStickerObj && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-4xl select-none pointer-events-none drop-shadow-lg z-20 animate-bounce">
              {currentStickerObj.icon}
            </div>
          )}
        </div>

        {/* PRIMARY ACTIONS: Native Camera & Gallery */}
        <div className="w-full flex flex-col gap-2 mb-3">
          {/* 1. NATIVE DEVICE CAMERA (Works 100% on Android & iOS!) */}
          <button
            onClick={() => {
              sounds.sfxPop();
              nativeCameraInputRef.current?.click();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-black text-base shadow-md active:scale-95 transition flex items-center justify-center gap-2 border-b-4 border-rose-700"
          >
            <Camera className="w-5 h-5 stroke-[2.5]" />
            <span>📸 Hacer Foto (Abre tu cámara)</span>
          </button>

          {/* Secondary Options Row: Gallery & Live Webcam */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sounds.sfxPop();
                galleryInputRef.current?.click();
              }}
              className="py-2.5 px-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs shadow-xs active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Subir de Galería</span>
            </button>

            {isLiveActive ? (
              <button
                onClick={triggerLiveSnapshot}
                disabled={countdown !== null}
                className="py-2.5 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-xs active:scale-95 transition flex items-center justify-center gap-1"
              >
                <Camera className="w-4 h-4" />
                <span>¡Disparar ahora!</span>
              </button>
            ) : (
              <button
                onClick={startLiveWebcam}
                className="py-2.5 px-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-extrabold text-xs shadow-xs active:scale-95 transition flex items-center justify-center gap-1"
              >
                <span>🔴 Cámara en vivo</span>
              </button>
            )}
          </div>
        </div>

        {liveError && (
          <div className="w-full p-2 bg-rose-50 border border-rose-200 rounded-xl mb-3 flex items-start gap-1.5 text-left">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-700 font-semibold leading-tight">
              {liveError}
            </p>
          </div>
        )}

        {/* Sticker / Accessories Selector */}
        <div className="w-full mb-3">
          <label className="text-xs font-black text-slate-700 block mb-1 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> ¡Ponte un adorno o corona!
          </label>
          <div className="flex gap-1.5 overflow-x-auto py-1 px-1 justify-center flex-wrap">
            {STICKERS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSticker(s.id);
                  sounds.sfxPop();
                }}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition border-2 ${
                  selectedSticker === s.id
                    ? 'bg-amber-100 border-amber-500 scale-110 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
                title={s.label}
              >
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Instant Avatar Presets */}
        <div className="w-full border-t border-slate-100 pt-2 mb-3">
          <span className="text-[11px] font-bold text-slate-400 block text-center mb-1">
            O elige un personaje simpático si no quieres foto:
          </span>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {DEFAULT_AVATARS.map((av) => (
              <button
                key={av.name}
                type="button"
                onClick={() => {
                  const canvas = document.createElement('canvas');
                  canvas.width = 240;
                  canvas.height = 240;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.fillStyle = '#fef08a';
                    ctx.beginPath();
                    ctx.arc(120, 120, 114, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.lineWidth = 8;
                    ctx.strokeStyle = '#f59e0b';
                    ctx.stroke();

                    ctx.font = '120px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(av.emoji, 120, 130);
                    setPhotoPreview(canvas.toDataURL('image/png'));
                    stopLiveCamera();
                    sounds.sfxPop();
                  }
                }}
                className="w-8 h-8 text-lg rounded-xl bg-slate-100 hover:bg-amber-100 hover:scale-110 flex items-center justify-center transition"
                title={av.name}
              >
                {av.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Save / Confirm Button */}
        <button
          onClick={() => {
            sounds.sfxPop();
            stopLiveCamera();
            onSave(photoPreview, selectedSticker);
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-base shadow-lg active:scale-98 transition flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>¡Guardar mi foto! 🌟</span>
        </button>
      </div>
    </div>
  );
};
