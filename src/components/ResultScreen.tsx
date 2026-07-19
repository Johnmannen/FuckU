import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Square, Save, RefreshCw, Sparkles, Volume2, Calendar, Clock, ChevronRight, Share2, Download, LogIn, User } from 'lucide-react';
import { ScreamRecord, UserProfile } from '../types';
import { saveScream } from '../lib/storage';
import { downloadImage } from '../lib/download';
import { API_ENDPOINTS } from '../lib/api';
import ShareModal from './ShareModal';

interface ResultScreenProps {
  screamData: {
    duration: number;
    maxVolume: number;
    avgVolume: number;
    intensity: number;
    title: string;
    characterType: string;
    characterStyle: string;
    prompt: string;
    audioBlob: Blob;
  };
  user: UserProfile | null;
  onSaveComplete: () => void;
  onScreamAgain: () => void;
  onLoginClick: () => void;
}

// Function to convert Blob to Base64 Data URL
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const SUMMONING_MESSAGES = [
  'Capturing emotional frequencies...',
  'Analyzing decibel turbulence...',
  'Extracting raw stress markers...',
  'Summoning your inner creature...',
  'Channeling visual wavelengths...',
  'Coalescing molecular rage pixels...',
  'Forming defensive monster avatar...',
  'Finalizing cosmic state...'
];

export default function ResultScreen({ screamData, user, onSaveComplete, onScreamAgain, onLoginClick }: ResultScreenProps) {
  const [analyzedData, setAnalyzedData] = useState<{
    title: string;
    characterType: string;
    characterStyle: string;
    prompt: string;
    analysis?: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio-reactive visualizer state and refs
  const [playbackVolume, setPlaybackVolume] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Set up the audio-reactive Web Audio API analyzer
  const setupAudioAnalyzer = () => {
    if (!audioRef.current) return;
    if (audioContextRef.current) return; // Already initialized

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128; // Small fftSize is fast and perfectly captures the dynamic volume spikes
      
      // Hook up the HTMLMediaElement as an audio source
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (err) {
      console.error("Web Audio API analyzer initialization failed:", err);
    }
  };

  // Start checking the real-time frequency/amplitude data during playback
  const startVisualizerLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!audioRef.current || audioRef.current.paused) {
        setPlaybackVolume(0);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      // Extract average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      // Map average amplitude to a clear percentage (0 to 100)
      const volumePercent = Math.min(100, Math.round((average / 110) * 100));
      setPlaybackVolume(volumePercent);

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
  };

  // Call the server to get dynamic analysis
  useEffect(() => {
    let active = true;
    setIsAnalyzing(true);

    const userLang = navigator.language || 'en';

    fetch(API_ENDPOINTS.analyzeScream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration: screamData.duration,
        maxVolume: screamData.maxVolume,
        avgVolume: screamData.avgVolume,
        intensity: screamData.intensity,
        lang: userLang
      })
    })
    .then(res => res.json())
    .then(data => {
      if (active) {
        if (data && data.prompt) {
          setAnalyzedData(data);
        } else {
          // fallback
          setAnalyzedData({
            title: screamData.title,
            characterType: screamData.characterType,
            characterStyle: screamData.characterStyle,
            prompt: screamData.prompt,
            analysis: userLang.toLowerCase().startsWith('sv')
              ? 'Ett djupt utlopp av undertryckt energi. Detta skrik bär på en tyst storm fylld av primal kraft.'
              : 'A deep release of pent-up energy. This scream carries a quiet storm filled with primal power.'
          });
        }
        setIsAnalyzing(false);
      }
    })
    .catch(err => {
      console.error("Failed to analyze scream with AI:", err);
      if (active) {
        setAnalyzedData({
          title: screamData.title,
          characterType: screamData.characterType,
          characterStyle: screamData.characterStyle,
          prompt: screamData.prompt,
          analysis: userLang.toLowerCase().startsWith('sv')
            ? 'Ett djupt utlopp av undertryckt energi. Detta skrik bär på en tyst storm fylld av primal kraft.'
            : 'A deep release of pent-up energy. This scream carries a quiet storm filled with primal power.'
        });
        setIsAnalyzing(false);
      }
    });

    return () => {
      active = false;
    };
  }, [screamData]);

  // Use dynamic activeData if loaded, otherwise fallback
  const activeData = analyzedData || {
    title: screamData.title,
    characterType: screamData.characterType,
    characterStyle: screamData.characterStyle,
    prompt: screamData.prompt,
    analysis: (navigator.language || 'en').toLowerCase().startsWith('sv')
      ? 'Ett djupt utlopp av undertryckt energi. Detta skrik bär på en tyst storm fylld av primal kraft.'
      : 'A deep release of pent-up energy. This scream carries a quiet storm filled with primal power.'
  };

  // Pollinations API image URL with random seed for guaranteed uniqueness
  // We use useMemo to freeze the seed and URL so it doesn't change on every re-render
  const imageUrl = useMemo(() => {
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(activeData.prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${seed}`;
  }, [activeData.prompt]);

  // Create temporary audio URL for playback
  useEffect(() => {
    const url = URL.createObjectURL(screamData.audioBlob);
    audioUrlRef.current = url;
    audioRef.current = new Audio(url);

    const handleAudioEnded = () => {
      setIsPlayingAudio(false);
      setPlaybackVolume(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    audioRef.current.addEventListener('ended', handleAudioEnded);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.pause();
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [screamData.audioBlob]);

  // Clean up Web Audio Context on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error("Failed to close AudioContext:", err));
      }
    };
  }, []);

  // Cycle summoning messages while loading image or analyzing
  useEffect(() => {
    if (imageLoaded) return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % SUMMONING_MESSAGES.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [imageLoaded]);

  // Handle Play/Stop Audio
  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
      setPlaybackVolume(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      setupAudioAnalyzer();

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          setIsPlayingAudio(true);
          startVisualizerLoop();
        })
        .catch(err => console.error('Audio playback failed:', err));
    }
  };

  // Handle saving to database
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // Convert audio blob to base64 for persistent storage
      const base64Audio = await blobToBase64(screamData.audioBlob);

      const record: ScreamRecord = {
        id: `scream_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: Date.now(),
        duration: screamData.duration,
        maxVolume: screamData.maxVolume,
        avgVolume: screamData.avgVolume,
        intensity: screamData.intensity,
        title: activeData.title,
        characterType: activeData.characterType,
        characterStyle: activeData.characterStyle,
        prompt: activeData.prompt,
        imageUrl: imageUrl, // Save direct Pollinations API URL
        audioData: base64Audio,
        analysis: activeData.analysis,
        userId: user?.uid
      };

      await saveScream(record, user?.uid);
      onSaveComplete();
    } catch (err) {
      console.error('Failed to save scream:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-between items-center px-6 py-8 relative overflow-hidden" id="result-screen-container">

      {/* Profile/Auth Button */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={onLoginClick}
          className="w-10 h-10 rounded-full bg-[#111] border border-white/10 flex items-center justify-center hover:bg-[#1A1A1A] transition-all overflow-hidden shadow-lg"
        >
          {user ? (
            user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-red-500" />
          ) : (
            <LogIn className="w-4 h-4 text-neutral-400" />
          )}
        </button>
      </div>

      {/* Atmospheric Elements */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Header Info */}
      <div className="w-full max-w-md text-center mb-4 z-10" id="result-header">
        <span className="font-display font-bold uppercase tracking-wider text-xs text-red-500">
          {isAnalyzing ? "Analyzing Soundwaves..." : "Summoning Complete"}
        </span>
        <h1 className="font-display font-black text-4xl uppercase tracking-tighter text-white mt-1" id="monster-identity-title">
          {activeData.title}
        </h1>
      </div>

      {/* Main Avatar Section */}
      <div className="flex-1 w-full max-w-md flex flex-col justify-center items-center my-4 z-10" id="avatar-section">
        <div className="relative w-80 h-80 flex items-center justify-center">
          
          {/* Audio-Reactive Sonic Ripples / Energy Waves behind the card */}
          {isPlayingAudio && (
            <div className="absolute inset-0 pointer-events-none z-0">
              {/* Outer wave */}
              <div 
                className="absolute inset-0 rounded-3xl border border-red-500/30 bg-red-600/5 transition-all duration-75"
                style={{
                  transform: `scale(${1 + (playbackVolume * 0.0035)})`,
                  opacity: 0.15 + (playbackVolume * 0.0075),
                  boxShadow: `0 0 ${20 + playbackVolume * 0.8}px rgba(220, 38, 38, 0.35)`
                }}
              />
              {/* Inner wave */}
              <div 
                className="absolute inset-0 rounded-3xl border border-yellow-500/20 transition-all duration-75"
                style={{
                  transform: `scale(${1 + (playbackVolume * 0.007)})`,
                  opacity: playbackVolume * 0.005
                }}
              />
            </div>
          )}

          <div 
            className="relative w-80 h-80 rounded-3xl overflow-hidden border bg-black flex items-center justify-center z-10 transition-all duration-75"
            style={{
              transform: isPlayingAudio ? `scale(${1 + (playbackVolume * 0.001)})` : 'scale(1)',
              borderColor: isPlayingAudio ? `rgba(239, 68, 68, ${0.2 + (playbackVolume * 0.008)})` : 'rgba(255, 255, 255, 0.1)',
              boxShadow: isPlayingAudio 
                ? `0 0 ${40 + playbackVolume * 1.5}px rgba(220, 38, 38, ${0.15 + (playbackVolume * 0.006)})` 
                : '0 0 80px rgba(220, 38, 38, 0.15)'
            }}
            id="avatar-image-frame"
          >
            
            {/* Main Generated Image */}
            {!isAnalyzing && (
              <img
                src={imageUrl}
                alt={activeData.title}
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.error("Failed to load image from Pollinations.ai");
                  setImageLoaded(true); // Stop loading spinner even on error
                }}
                className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  transform: isPlayingAudio 
                    ? `translate(${(Math.random() - 0.5) * (playbackVolume * 0.18)}px, ${(Math.random() - 0.5) * (playbackVolume * 0.18)}px)
                       rotate(${(Math.random() - 0.5) * (playbackVolume * 0.05)}deg)
                       scale(${1 + (playbackVolume * 0.0005)})
                       scaleY(${1 + (playbackVolume * 0.0015)})`
                    : 'translate(0px, 0px) rotate(0deg) scale(1) scaleY(1)',
                  filter: isPlayingAudio
                    ? `brightness(${1 + (playbackVolume * 0.008)})
                       contrast(${1 + (playbackVolume * 0.004)})
                       hue-rotate(${playbackVolume * 0.1}deg)
                       ${playbackVolume > 70 ? `drop-shadow(${(Math.random() - 0.5) * 5}px 0px 2px rgba(255,0,0,0.5)) drop-shadow(${(Math.random() - 0.5) * -5}px 0px 2px rgba(0,255,255,0.5))` : ''}`
                    : 'none',
                  transformOrigin: 'top center', // Crucial for the jaw-drop effect
                  transition: isPlayingAudio ? 'none' : 'transform 0.2s ease-out, filter 0.2s ease-out'
                }}
                id="generated-avatar-img"
              />
            )}

            {/* Loading Summoner Spinner */}
            {(!imageLoaded || isAnalyzing) && (
              <div className="absolute inset-0 flex flex-col justify-center items-center p-6 bg-[#0A0A0A] text-center" id="summon-loader">
                {/* Rotating Portal Graphic */}
                <div className="relative w-24 h-24 mb-6" id="portal-gfx">
                  <div className="absolute inset-0 rounded-full border-4 border-red-950 border-t-red-500 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border border-yellow-950 border-b-yellow-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-4 rounded-full bg-red-600/5 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                  </div>
                </div>
                
                {/* Custom Status Messages */}
                <motion.p
                  key={loadingMessageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-mono text-xs text-red-500 font-bold uppercase tracking-widest h-4"
                >
                  {isAnalyzing ? "Consulting AI Pantheon..." : SUMMONING_MESSAGES[loadingMessageIndex]}
                </motion.p>
                <p className="text-neutral-500 text-[10px] mt-2 font-sans tracking-wide">
                  {isAnalyzing ? "Extracting acoustic signature and styling..." : "Generating avatar. Let the neural energies bind..."}
                </p>
              </div>
            )}

            {/* Emotion Analysis Overlap - Background set to opaque for screenshot stability */}
            {imageLoaded && !isAnalyzing && (
              <div className="absolute bottom-3 left-3 right-3 bg-[#0D0D0D] rounded-2xl p-3 border border-white/10 shadow-2xl" id="emotion-analysis-box">
                <p className="text-xs text-neutral-200 font-sans font-medium tracking-wide leading-relaxed text-center italic">
                  "{activeData.analysis}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Audio Player Row */}
        <div className="mt-5 w-full flex justify-center" id="voice-playback-row">
          <button
            onClick={toggleAudio}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-full border text-xs font-black uppercase tracking-[0.2em] cursor-pointer transition-all ${
              isPlayingAudio 
                ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.35)]' 
                : 'bg-[#161616] border-white/10 text-neutral-200 hover:border-red-500 hover:bg-[#222]'
            }`}
            id="btn-voice-playback"
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-3.5 h-3.5 fill-black" />
                <span>Stop Vocal</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Back Scream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scream Stats Dashboard (Sleek Bento Style) */}
      <div className="w-full max-w-md bg-[#111] border border-white/5 rounded-3xl p-6 mb-6 backdrop-blur-md grid grid-cols-2 gap-4 z-10" id="stats-dashboard">
        
        {/* Metric 1: Duration */}
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex flex-col justify-center" id="stat-col-duration">
          <span className="text-[10px] uppercase font-mono tracking-[0.15em] text-neutral-500 font-bold">Scream Duration</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-3xl font-black text-white tracking-tighter">{screamData.duration.toFixed(2)}</span>
            <span className="font-sans text-xs text-neutral-400 font-semibold">sec</span>
          </div>
        </div>

        {/* Metric 2: Max Volume / Intensity */}
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex flex-col justify-center" id="stat-col-intensity">
          <span className="text-[10px] uppercase font-mono tracking-[0.15em] text-red-500 font-bold">Intensity Scale</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-3xl font-black text-red-500 tracking-tighter">{screamData.intensity}</span>
            <span className="font-sans text-xs text-red-400 font-semibold">%</span>
          </div>
        </div>

        {/* Level Indicator Footer */}
        <div className="col-span-2 border-t border-white/5 pt-4 flex justify-between items-center text-xs font-semibold" id="stat-class-row">
          <div className="flex items-center gap-1.5 text-neutral-400 uppercase tracking-wider text-[10px]">
            <Volume2 className="w-3.5 h-3.5 text-red-500" />
            <span>Classification:</span>
          </div>
          <span className={`font-mono uppercase font-black text-[10px] px-3 py-1 rounded-full ${
            screamData.intensity < 30 ? 'bg-blue-950/80 text-blue-400 border border-blue-900/30' :
            screamData.intensity <= 60 ? 'bg-orange-950/80 text-orange-400 border border-orange-900/30' :
            'bg-red-950/80 text-red-400 border border-red-900/30'
          }`} id="classification-badge">
            {screamData.intensity < 30 ? 'Low Decibel' :
             screamData.intensity <= 60 ? 'Mid Decibel' :
             'High Decibel'}
          </span>
        </div>
      </div>

      {/* Bottom Action Menu */}
      <div className="w-full max-w-md flex flex-col gap-3 z-20" id="action-menu-row">
        
        <div className="flex gap-3 w-full">
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!imageLoaded || isSaving}
            className="flex-1 py-4 rounded-2xl font-display font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-red-600 hover:bg-red-500 text-white shadow-[0_0_40px_rgba(220,38,38,0.2)] disabled:opacity-50 disabled:cursor-not-allowed border border-red-500 active:scale-[0.99]"
            id="btn-save-monster"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Fusing...' : 'Spara'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={() => downloadImage(imageUrl, activeData.title)}
            disabled={!imageLoaded}
            className="w-14 py-4 rounded-2xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-red-500 transition-all cursor-pointer disabled:opacity-50"
            title="Ladda ner bild"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-3 w-full">
          {/* Share Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            disabled={!imageLoaded || isSaving}
            className="flex-1 py-3.5 rounded-2xl font-display font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#1A1A1A] border border-white/10 hover:border-red-500 hover:bg-[#252525] text-white active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            id="btn-share-monster"
          >
            <Share2 className="w-3.5 h-3.5 text-red-500" />
            <span>Dela Monster</span>
          </button>
        </div>

        {/* Return Button */}
        <button
          onClick={onScreamAgain}
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl font-mono font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#111] border border-white/10 hover:bg-[#1A1A1A] text-neutral-400 hover:text-neutral-200 active:scale-[0.99]"
          id="btn-scream-again"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Discard & Scream Again</span>
        </button>
      </div>

      {/* Share Modal overlay */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        imageUrl={imageUrl}
        audioBlobOrBase64={screamData.audioBlob}
        title={activeData.title}
        intensity={screamData.intensity}
      />

    </div>
  );
}
