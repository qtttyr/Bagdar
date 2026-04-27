import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  VolumeHighIcon,
  VolumeMuteIcon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";

type StepType = "learning" | "practice" | "break";

export default function NomadMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const { step, planTitle } = location.state || {};

  const [timeLeft, setTimeLeft] = useState((step?.duration || 25) * 60);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const typeConfig = {
    learning: { label: "Обучение", gradient: "from-violet-500 to-purple-600" },
    practice: { label: "Практика", gradient: "from-cyan-500 to-blue-600" },
    break: { label: "Перерыв", gradient: "from-amber-400 to-orange-500" },
  };

  const currentType = typeConfig[step?.type as StepType] ?? typeConfig.learning;

  // Initialize audio
  useEffect(() => {
    const initAudio = async () => {
      try {
        const ctx = new AudioContext();
        const response = await fetch("/audio/nomad-focus.mp3");
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();

        audioCtxRef.current = ctx;
        sourceRef.current = source;
        gainNodeRef.current = gainNode;

        // Media Session API
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: step?.title || "Фокус",
            artist: "Baǵdar",
            album: planTitle || "Обучение",
            artwork: [
              { src: "/icons/logo-512.png", sizes: "512x512", type: "image/png" },
            ],
          });

          navigator.mediaSession.setActionHandler("play", () => {
            setIsPlaying(true);
            ctx.resume();
          });

          navigator.mediaSession.setActionHandler("pause", () => {
            setIsPlaying(false);
            ctx.suspend();
          });
        }
      } catch (e) {
        console.error("Audio init error:", e);
      }
    };

    initAudio();

    return () => {
      sourceRef.current?.stop();
      audioCtxRef.current?.close();
    };
  }, [step, planTitle]);

  // Timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsPlaying(false);
          setShowNotification(true);
          // Stop music
          gainNodeRef.current?.gain.linearRampToValueAtTime(0, audioCtxRef.current!.currentTime + 1);
          setTimeout(() => {
            sourceRef.current?.stop();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioCtxRef.current?.suspend();
      setIsPlaying(false);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
    } else {
      audioCtxRef.current?.resume();
      setIsPlaying(true);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      gainNodeRef.current?.gain.linearRampToValueAtTime(1, audioCtxRef.current!.currentTime + 0.3);
      setIsMuted(false);
    } else {
      gainNodeRef.current?.gain.linearRampToValueAtTime(0, audioCtxRef.current!.currentTime + 0.3);
      setIsMuted(true);
    }
  }, [isMuted]);

  const handleBack = () => {
    sourceRef.current?.stop();
    audioCtxRef.current?.close();
    navigate("/map");
  };

  const handleContinue = () => {
    setShowNotification(false);
    // Start 5 min break
    setTimeLeft(5 * 60);
    setIsPlaying(true);
    // Restart audio if needed
    if (audioCtxRef.current?.state === "closed") {
      // Re-init audio
    }
  };

  const handleFinish = () => {
    sourceRef.current?.stop();
    audioCtxRef.current?.close();
    navigate("/map");
  };

  if (!step) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Данные не найдены</p>
          <Button onClick={() => navigate("/map")}>Вернуться к карте</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/nomad-bg.jpg')" }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.5} className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="text-xs text-white/60 uppercase tracking-wider">Сессия</div>
            <div className="text-sm text-white font-medium">{planTitle}</div>
          </div>

          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <HugeiconsIcon
              icon={isMuted ? VolumeMuteIcon : VolumeHighIcon}
              strokeWidth={1.5}
              className="w-5 h-5"
            />
          </button>
        </div>

        {/* Center - Timer */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl font-light text-white tabular-nums tracking-tight">
              {formatTime(timeLeft)}
            </div>
            <div className="mt-4 text-white/60 text-sm">
              {isPlaying ? "В процессе..." : "На паузе"}
            </div>
          </div>
        </div>

        {/* Bottom - Current task card */}
        <div className="p-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${currentType.gradient} text-white font-medium`}>
                      {currentType.label}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-1 truncate">
                    {step.title}
                  </h2>
                  <p className="text-white/60 text-sm">
                    Осталось {formatTime(timeLeft)} • {step.duration} мин всего
                  </p>
                </div>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition flex-shrink-0"
                >
                  <HugeiconsIcon
                    icon={isPlaying ? PauseIcon : PlayIcon}
                    strokeWidth={1.5}
                    className="w-6 h-6"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification modal */}
      {showNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 border border-border">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="font-heading text-2xl font-bold">Уақыт таусылды!</h3>
              <p className="text-muted-foreground">
                Жолың басында жүрген жақсы, жолдың соңында жүрген одан да жақсы. 
                <br />
                <span className="text-sm">Время вышло! Продолжим покорять знания?</span>
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleFinish}
                  className="flex-1"
                >
                  Завершить
                </Button>
                <Button
                  onClick={handleContinue}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                >
                  Перерыв 5 мин
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
