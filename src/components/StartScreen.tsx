import { useState, useRef, useEffect, SyntheticEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Mic, AlertCircle } from 'lucide-react';
import { ScreamRecord } from '../types';

interface StartScreenProps {
  onScreamRecorded: (scream: Omit<ScreamRecord, 'id' | 'imageUrl' | 'timestamp'> & { audioBlob: Blob }) => void;
  onNavigateToGallery: () => void;
}

export default function StartScreen({ onScreamRecorded, onNavigateToGallery }: StartScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [realtimeVolume, setRealtimeVolume] = useState(0);
  const [recordDuration, setRecordDuration] = useState(0);

  // Audio Context and recording references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const shouldBeRecordingRef = useRef(false);

  // Tracking scream stats
  const maxVolumeRef = useRef(0);
  const volumeListRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<any>(null);

  // Initialize Audio Context and request permissions
  const initAudio = async (): Promise<boolean> => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      return true;
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone permission was denied. Please allow microphone access to record your screams!');
      } else {
        setPermissionError('Could not access microphone: ' + (err.message || 'Unknown error'));
      }
      return false;
    }
  };

  // Proactively request permission on mount to make recording instant on click
  useEffect(() => {
    initAudio().then(success => {
      if (success && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    });
  }, []);

  const startRecording = async (e?: SyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (isRecording) return;
    shouldBeRecordingRef.current = true;

    const success = await initAudio();
    if (!success || !streamRef.current) {
      shouldBeRecordingRef.current = false;
      return;
    }

    // Check if user released mouse/touch while the permission request was resolving
    if (!shouldBeRecordingRef.current) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    try {
      // Create Web Audio Analyser
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(streamRef.current);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start Media Recorder for playback
      audioChunksRef.current = [];
      
      // Select best supported MIME type
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        const types = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav', 'audio/aac'];
        for (const type of types) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        
        // Final calculations
        const finalDuration = Math.max(0.5, recordDuration);
        const finalMaxVolume = Math.min(100, Math.round(maxVolumeRef.current));
        const sum = volumeListRef.current.reduce((a, b) => a + b, 0);
        const finalAvgVolume = volumeListRef.current.length > 0 
          ? Math.min(100, Math.round(sum / volumeListRef.current.length)) 
          : 0;

        // Intensity is driven primarily by the peak maxVolume, but blended with the average
        const finalIntensity = Math.min(100, Math.round(finalMaxVolume * 0.8 + finalAvgVolume * 0.2));

        // Determine title
        let title = 'The Tiny Tremor';
        if (finalIntensity >= 30 && finalIntensity <= 60) {
          title = 'The Rising Storm';
        } else if (finalIntensity > 60) {
          title = 'The Primal Scream';
        }

        // Determine character details
        let characterType = 'a cute small pokemon style creature';
        if (finalDuration >= 2 && finalDuration <= 4) {
          characterType = 'a medium-sized humanoid battle creature, stylish fantasy avatar';
        } else if (finalDuration > 4) {
          characterType = 'a massive giant dragon-like boss monster, legendary status';
        }

        let characterStyle = 'whimpering, sad, soft blue and purple tones, gentle';
        if (finalIntensity >= 30 && finalIntensity <= 60) {
          characterStyle = 'angry, fierce, orange and red flames, battle-ready';
        } else if (finalIntensity > 60) {
          characterStyle = 'absolutely furious, screaming, lightning bolts, ultra-dramatic, neon red and yellow, epic cinematic';
        }

        const completePrompt = `${characterType}, ${characterStyle}, detailed digital art, high quality, dark dramatic background, clean portrait framing, fantasy illustration, cinematic composition`;

        onScreamRecorded({
          duration: Number(finalDuration.toFixed(2)),
          maxVolume: finalMaxVolume,
          avgVolume: finalAvgVolume,
          intensity: finalIntensity,
          title,
          characterType,
          characterStyle,
          prompt: completePrompt,
          audioBlob
        });
      };

      // Reset statistics
      maxVolumeRef.current = 0;
      volumeListRef.current = [];
      startTimeRef.current = Date.now();
      setRecordDuration(0);
      setRealtimeVolume(0);
      setIsRecording(true);

      // Start recording
      mediaRecorder.start();

      // Start Realtime Web Audio Analysis loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate root mean square (RMS) amplitude
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128; // scale to -1..1
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        // Map RMS value to percentage (0 - 100).
        // Standard speaking range peaks around 0.1-0.2 RMS, so scale up with a multiplier of 3.5
        const volumePercentage = Math.min(100, Math.round(rms * 100 * 3.5));
        
        setRealtimeVolume(volumePercentage);

        // Track stats
        if (volumePercentage > maxVolumeRef.current) {
          maxVolumeRef.current = volumePercentage;
        }
        volumeListRef.current.push(volumePercentage);

        // Track duration precisely
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRecordDuration(elapsed);

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      animationFrameRef.current = requestAnimationFrame(updateVolume);

      // Simple interval fallback to ensure state updates visually if tab backgrounded
      durationTimerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setRecordDuration(elapsed);
        }
      }, 100);

    } catch (err) {
      console.error('Failed to start audio analysis:', err);
      setPermissionError('Failed to start audio recording. Please try again.');
    }
  };

  const stopRecording = () => {
    shouldBeRecordingRef.current = false;
    if (!isRecording) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error);
        audioCtxRef.current = null;
      }
      return;
    }

    // Stop animation loops
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop microphone stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close Audio Context
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(console.error);
      audioCtxRef.current = null;
    }

    setIsRecording(false);
  };

  // Add global event listeners to catch user releasing mouse outside the button
  useEffect(() => {
    if (isRecording) {
      const handleGlobalRelease = () => {
        stopRecording();
      };
      
      // Listen to both mouseup and touchend globally
      window.addEventListener('mouseup', handleGlobalRelease);
      window.addEventListener('touchend', handleGlobalRelease, { passive: true });
      
      return () => {
        window.removeEventListener('mouseup', handleGlobalRelease);
        window.removeEventListener('touchend', handleGlobalRelease);
      };
    }
  }, [isRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Determine shake class based on real-time volume
  const getShakeClass = () => {
    if (!isRecording || realtimeVolume < 25) return '';
    if (realtimeVolume >= 25 && realtimeVolume < 55) return 'shake-mild';
    if (realtimeVolume >= 55 && realtimeVolume < 80) return 'shake-medium';
    return 'shake-intense';
  };

  // Compute live dynamic background color gradient.
  // Base background is #121212.
  // As volume increases, interpolate to a dark blood-red tone (e.g., up to rgb(60, 10, 10))
  const getDynamicBackgroundStyle = () => {
    if (!isRecording) return { backgroundColor: '#121212' };
    const ratio = realtimeVolume / 100;
    const r = Math.round(18 + ratio * 60); // 18 -> 78
    const g = Math.round(18 - ratio * 12); // 18 -> 6
    const b = Math.round(18 - ratio * 12); // 18 -> 6
    return {
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
      transition: 'background-color 0.1s ease-out'
    };
  };

  return (
    <div 
      className={`min-h-screen flex flex-col justify-between items-center px-6 py-8 relative transition-all duration-300 bg-[#0A0A0A] overflow-hidden ${getShakeClass()}`}
      style={isRecording ? getDynamicBackgroundStyle() : undefined}
      id="start-screen-container"
    >
      {/* Atmospheric Elements */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Top Navigation Row */}
      <nav className="w-full max-w-4xl p-4 flex justify-between items-center z-20" id="header-row">
        <div className="flex items-center gap-3" id="logo-badge">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
          </div>
          <span className="text-xl font-black tracking-tighter uppercase font-display text-white">Scream App</span>
        </div>

        <button
          onClick={onNavigateToGallery}
          className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-neutral-800 flex items-center justify-center hover:bg-[#252525] transition-all text-neutral-200 hover:text-white cursor-pointer shadow-lg"
          title="Open Gallery"
          id="btn-goto-gallery"
        >
          <History className="w-5 h-5 text-red-500" />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-md z-10" id="main-content">
        {/* Dynamic Speech Bubble */}
        <AnimatePresence>
          {!isRecording && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative flex flex-col items-center w-full"
              id="speech-bubble-wrapper"
            >
              <div className="bg-white text-black px-10 py-8 rounded-[40px] w-full shadow-2xl text-center" id="speech-bubble">
                <h2 className="text-3xl font-black mb-2 tracking-tight uppercase font-display" id="bubble-title">Need to vent?</h2>
                <p className="text-base opacity-90 leading-snug font-medium text-neutral-800 font-sans" id="bubble-desc">
                  Press and hold the button. Scream as loud and as long as you want. Let the monster out.
                </p>
              </div>
              <div className="w-8 h-6 bg-white bubble-tail -mt-1" id="bubble-tail"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Status Indicators when Recording */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center mb-4 text-center"
              id="live-stats-badge"
            >
              <div className="px-4 py-1.5 bg-red-600 text-white rounded-full font-display font-black text-xs uppercase tracking-widest mb-3 animate-pulse">
                SCREAMING...
              </div>
              <div className="font-mono text-5xl font-black tracking-tighter text-white tabular-nums mb-1">
                {recordDuration.toFixed(2)}s
              </div>
              <div className="font-mono text-sm font-semibold text-red-400 uppercase tracking-widest">
                Loudness: {realtimeVolume}%
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Central Button & Visualizer Rings */}
        <div className="relative flex items-center justify-center w-80 h-80" id="scream-button-container">
          
          {/* Ambient Rings reacting to scream sound level */}
          <div 
            className="absolute w-[360px] h-[360px] rounded-full visualizer-ring transition-all duration-75 pointer-events-none" 
            style={{ 
              transform: `scale(${1 + (realtimeVolume * 0.002)})`,
              opacity: isRecording ? 0.15 + (realtimeVolume * 0.005) : 0.06 
            }}
          ></div>
          <div 
            className="absolute w-[300px] h-[300px] rounded-full visualizer-ring transition-all duration-75 pointer-events-none" 
            style={{ 
              transform: `scale(${1 + (realtimeVolume * 0.003)})`,
              opacity: isRecording ? 0.2 + (realtimeVolume * 0.005) : 0.08 
            }}
          ></div>
          <div 
            className="absolute w-[240px] h-[240px] rounded-full visualizer-ring transition-all duration-75 pointer-events-none" 
            style={{ 
              transform: `scale(${1 + (realtimeVolume * 0.004)})`,
              opacity: isRecording ? 0.35 + (realtimeVolume * 0.005) : 0.12 
            }}
          ></div>

          {/* Core Interactive Scream Button with Sleek Interface glow and gradient */}
          <motion.button
            onMouseDown={(e) => startRecording(e)}
            onTouchStart={(e) => startRecording(e)}
            onMouseUp={stopRecording}
            onTouchEnd={stopRecording}
            onMouseLeave={stopRecording}
            animate={isRecording ? {
              scale: [0.95, 1.05, 0.95],
              boxShadow: `0 0 ${40 + realtimeVolume * 0.8}px rgba(239, 68, 68, 0.65)`
            } : {
              scale: [1, 1.05, 1],
              boxShadow: '0 0 40px rgba(220, 38, 38, 0.15)'
            }}
            transition={isRecording ? {
              repeat: Infinity,
              duration: 0.8,
              ease: 'easeInOut'
            } : {
              repeat: Infinity,
              duration: 2.2,
              ease: 'easeInOut'
            }}
            className={`relative z-10 w-44 h-44 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 border-4 border-white/10 flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 transition-transform`}
            id="scream-button"
            style={{ touchAction: 'none' }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-200/80 mb-1">
              {isRecording ? 'ACTIVE' : 'RELEASE'}
            </span>
            <span className="text-2xl font-black uppercase tracking-tighter text-white">
              {isRecording ? 'SCREAM!' : 'Let it out'}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-red-300 mt-2 font-mono">
              {isRecording ? 'RELEASE TO FINISH' : 'PRESS & HOLD'}
            </span>
          </motion.button>
        </div>

        {/* Device/Context Instructions */}
        <p className="text-center text-xs text-neutral-500 font-sans mt-2 max-w-[280px]" id="hold-helper-text">
          Make sure your volume is on and microphone is allowed. Taps and holds are highly calibrated!
        </p>

        {/* Permission Error Display */}
        <AnimatePresence>
          {permissionError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-950/80 border border-red-800 rounded-xl flex items-start gap-3 w-full"
              id="error-banner"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-red-300 text-sm" id="err-title">Audio Access Denied</h4>
                <p className="text-red-400 text-xs mt-1 leading-relaxed" id="err-desc">{permissionError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Copyright block */}
      <footer className="w-full text-center py-4 z-10" id="footer-row">
        <span className="text-[10px] text-neutral-600 font-mono tracking-widest">
          FUCK U — THE SCREAM APP • COGNITIVE RELEASE SYSTEM
        </span>
      </footer>
    </div>
  );
}
