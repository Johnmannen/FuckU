import { useState, useEffect, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trash2, Play, Square, Volume2, Calendar, Clock, Sparkles, AlertTriangle, ShieldAlert, Share2 } from 'lucide-react';
import { ScreamRecord } from '../types';
import { getAllScreams, deleteScream } from '../lib/storage';
import ShareModal from './ShareModal';

interface GalleryScreenProps {
  onBackToStart: () => void;
}

export default function GalleryScreen({ onBackToStart }: GalleryScreenProps) {
  const [screams, setScreams] = useState<ScreamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Audio playback state
  const [playingScreamId, setPlayingScreamId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio-reactive visualizer state and refs
  const [playbackVolume, setPlaybackVolume] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Delete confirmation modal state
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Share Modal state
  const [sharingRecord, setSharingRecord] = useState<ScreamRecord | null>(null);

  // Fetch screams from IndexedDB/localStorage
  const fetchScreams = async () => {
    setLoading(true);
    try {
      const list = await getAllScreams();
      setScreams(list);
    } catch (err) {
      console.error('Failed to retrieve gallery screams:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set up the audio-reactive Web Audio API analyzer
  const setupAudioAnalyzer = (audioElement: HTMLAudioElement) => {
    // Clear old analyzer if any
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128; // Small fftSize is perfect for low-overhead frequency tracking
      
      const source = ctx.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (err) {
      console.error("Web Audio API analyzer initialization failed in GalleryScreen:", err);
    }
  };

  // Start checking real-time audio amplitude data
  const startVisualizerLoop = (audioElement: HTMLAudioElement) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!audioElement || audioElement.paused) {
        setPlaybackVolume(0);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

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

  useEffect(() => {
    fetchScreams();
    return () => {
      // Clean up audio playback and animation frame on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error("Failed to close AudioContext on unmount:", err));
      }
    };
  }, []);

  // Handle Play/Stop voice record
  const handleTogglePlay = (record: ScreamRecord) => {
    if (!record.audioData) {
      console.warn('No recorded audio data found for this session.');
      return;
    }

    if (playingScreamId === record.id) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingScreamId(null);
      setPlaybackVolume(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      // Stop previous playing audio if any
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Create new audio element from base64 string
      const audio = new Audio(record.audioData);
      audioRef.current = audio;
      setPlayingScreamId(record.id);

      // Setup and run Web Audio API analyzer
      setupAudioAnalyzer(audio);

      audio.play()
        .then(() => {
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }
          startVisualizerLoop(audio);
        })
        .catch(err => {
          console.error('Playback failed:', err);
          setPlayingScreamId(null);
          setPlaybackVolume(0);
        });

      audio.addEventListener('ended', () => {
        setPlayingScreamId(null);
        setPlaybackVolume(0);
        audioRef.current = null;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      });
    }
  };

  // Trigger custom delete modal
  const promptDelete = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setDeleteCandidateId(id);
  };

  // Perform actual deletion
  const confirmDelete = async () => {
    if (!deleteCandidateId) return;

    // If deleting the currently playing audio, stop it
    if (playingScreamId === deleteCandidateId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingScreamId(null);
    }

    try {
      await deleteScream(deleteCandidateId);
      // Refresh screen list
      setScreams(prev => prev.filter(s => s.id !== deleteCandidateId));
    } catch (err) {
      console.error('Error deleting record:', err);
    } finally {
      setDeleteCandidateId(null);
    }
  };

  // Helper to format timestamps to readable localized Swedish/English date format
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center px-4 py-8 relative overflow-hidden" id="gallery-screen-container">
      
      {/* Atmospheric Elements */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Top Header Row */}
      <div className="w-full max-w-md flex items-center justify-between mb-8 z-10" id="gallery-header">
        <button
          onClick={onBackToStart}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] border border-white/5 hover:bg-[#252525] text-neutral-300 hover:text-white rounded-full transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-lg"
          id="btn-gallery-back"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-red-500" />
          <span>Scream Room</span>
        </button>

        <h1 className="font-display font-black uppercase text-xl tracking-tighter text-white" id="gallery-title">
          Monster Sanctuary
        </h1>

        <div className="w-[104px] sm:block hidden"></div>
      </div>

      {/* Main Gallery List */}
      <div className="flex-1 w-full max-w-md flex flex-col z-10" id="gallery-list-area">
        {loading ? (
          <div className="flex-1 flex flex-col justify-center items-center py-20" id="gallery-loader">
            <div className="w-10 h-10 border-4 border-red-950 border-t-red-500 rounded-full animate-spin mb-4"></div>
            <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">Unveiling Sanctuary...</span>
          </div>
        ) : screams.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center py-16 px-6 text-center" id="gallery-empty-state">
            <div className="w-16 h-16 bg-[#111] border border-white/5 flex items-center justify-center rounded-3xl mb-6 shadow-2xl" id="empty-icon-box">
              <Sparkles className="w-8 h-8 text-neutral-600 animate-pulse" />
            </div>
            <h3 className="font-display font-black text-xl uppercase text-white tracking-tight" id="empty-title">
              Sanctuary is Vacant
            </h3>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-[280px] mt-2 font-sans mb-8" id="empty-desc">
              You haven't preserved any monsters yet. Unleash your raw vocal energy first to give life to your first avatar!
            </p>
            <button
              onClick={onBackToStart}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-display font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.2)] border border-red-500 transition-all cursor-pointer active:scale-95"
              id="btn-empty-scream"
            >
              Let Out A Scream
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4.5" id="screams-grid">
            <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-black mb-1">
              Your Rage Inventory ({screams.length})
            </p>

            {screams.map((record) => (
              <div
                key={record.id}
                className="bg-[#111] border border-white/5 rounded-3xl p-4 flex gap-4 items-center relative transition-all duration-200 hover:border-red-500/20 shadow-2xl"
                id={`card-${record.id}`}
              >
                {/* Rounded Avatar Thumbnail */}
                <div 
                  className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-black border border-white/10 shadow-inner transition-all duration-75"
                  style={{
                    transform: playingScreamId === record.id ? `scale(${1 + (playbackVolume * 0.0012)})` : 'scale(1)',
                    borderColor: playingScreamId === record.id ? `rgba(239, 68, 68, ${0.3 + (playbackVolume * 0.007)})` : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: playingScreamId === record.id 
                      ? `0 0 ${15 + playbackVolume * 0.4}px rgba(239, 68, 68, ${0.2 + (playbackVolume * 0.006)})` 
                      : 'none'
                  }}
                  id="thumbnail-frame"
                >
                  <img
                    src={record.imageUrl}
                    alt={record.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    style={{
                      transform: playingScreamId === record.id 
                        ? `translate(${(Math.random() - 0.5) * (playbackVolume * 0.12)}px, ${(Math.random() - 0.5) * (playbackVolume * 0.12)}px)` 
                        : 'translate(0px, 0px)',
                      transition: playingScreamId === record.id ? 'none' : 'transform 0.2s ease-out'
                    }}
                    loading="lazy"
                    id={`thumb-${record.id}`}
                  />
                  {/* Miniature Intensity Indicator Overlay */}
                  <div className="absolute bottom-1 right-1 bg-black/90 px-1.5 py-0.5 rounded-lg text-[8px] font-mono font-black text-red-500 border border-white/5">
                    {record.intensity}%
                  </div>
                </div>

                {/* Card Info Section */}
                <div className="flex-1 min-w-0" id="card-body">
                  <div className="flex items-center gap-1.5" id="card-title-row">
                    <h3 className="font-display font-black text-white text-sm tracking-tight truncate uppercase">
                      {record.title}
                    </h3>
                  </div>
                  
                  {/* Stats snippet */}
                  <div className="flex items-center gap-2.5 text-[10px] font-mono text-neutral-400 mt-1" id="card-stats-row">
                    <span className="flex items-center gap-1">
                      <span className="text-neutral-500 font-semibold">DUR:</span> {record.duration.toFixed(2)}s
                    </span>
                    <span className="text-neutral-700">•</span>
                    <span className="flex items-center gap-1">
                      <span className="text-neutral-500 font-semibold">VOL:</span> {record.maxVolume}%
                    </span>
                  </div>

                  {/* Date Timestamp */}
                  <div className="flex items-center gap-1 text-[9px] text-neutral-500 mt-2 font-sans font-medium" id="card-date-row">
                    <Calendar className="w-2.5 h-2.5 text-red-500/70" />
                    <span>{formatTimestamp(record.timestamp)}</span>
                  </div>
                </div>

                {/* Row Action Buttons */}
                <div className="flex flex-col gap-2 shrink-0 ml-1" id="card-actions">
                  {/* Play Audio Button */}
                  <button
                    onClick={() => handleTogglePlay(record)}
                    disabled={!record.audioData}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                      playingScreamId === record.id
                        ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/10'
                        : 'bg-[#181818] border-white/10 text-neutral-300 hover:text-white hover:border-red-500'
                    }`}
                    title="Play Vocal Recording"
                    id={`btn-play-${record.id}`}
                  >
                    {playingScreamId === record.id ? (
                      <Square className="w-3 h-3 fill-black text-black" />
                    ) : (
                      <Play className="w-3 h-3 fill-current text-current ml-0.5" />
                    )}
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => setSharingRecord(record)}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-[#181818] border border-white/10 text-neutral-300 hover:text-white hover:border-red-500 transition-all cursor-pointer"
                    title="Dela Monster"
                    id={`btn-share-${record.id}`}
                  >
                    <Share2 className="w-3.5 h-3.5 text-red-500" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => promptDelete(record.id, e)}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-[#181818] border border-white/10 text-neutral-500 hover:text-red-500 hover:border-red-500/40 hover:bg-red-950/20 transition-all cursor-pointer"
                    title="Purge Monster"
                    id={`btn-del-${record.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal Dialog */}
      <AnimatePresence>
        {deleteCandidateId && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" id="delete-modal-overlay">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteCandidateId(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#0E0E0E] border border-white/10 max-w-sm w-full rounded-3xl p-8 relative z-10 shadow-2xl text-center"
              id="delete-modal-box"
            >
              <div className="w-12 h-12 bg-red-950/30 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4" id="modal-alert-icon">
                <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
              </div>

              <h3 className="font-display font-black uppercase text-lg text-white tracking-tight" id="modal-title">
                Purge this monster?
              </h3>
              <p className="text-neutral-400 text-xs mt-2 leading-relaxed font-sans" id="modal-desc">
                This will permanently delete this scream session and its visual avatar from your inventory. This action cannot be undone.
              </p>

              {/* Modal Buttons */}
              <div className="flex gap-3 mt-6" id="modal-buttons">
                <button
                  onClick={() => setDeleteCandidateId(null)}
                  className="flex-1 py-3 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 rounded-2xl text-xs font-bold text-neutral-300 transition-all cursor-pointer active:scale-95"
                  id="modal-btn-cancel"
                >
                  Keep it
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 border border-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-lg shadow-red-600/10"
                  id="modal-btn-delete"
                >
                  Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal overlay */}
      <ShareModal
        isOpen={!!sharingRecord}
        onClose={() => setSharingRecord(null)}
        imageUrl={sharingRecord?.imageUrl || ''}
        audioBlobOrBase64={sharingRecord?.audioData || ''}
        title={sharingRecord?.title || ''}
        intensity={sharingRecord?.intensity || 0}
      />
    </div>
  );
}
