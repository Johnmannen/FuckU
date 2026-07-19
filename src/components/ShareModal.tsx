import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Download, Video, Image, Loader2, Film, Check, AlertCircle } from 'lucide-react';
import { compileScreamVideo } from '../lib/videoCompiler';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  audioBlobOrBase64: Blob | string;
  title: string;
  intensity: number;
}

// Convert Base64 data to Blob
function base64ToBlob(base64: string, mimeType = "audio/webm"): Blob {
  if (base64.startsWith("data:")) {
    const parts = base64.split(";base64,");
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  } else {
    const raw = window.atob(base64);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: mimeType });
  }
}

export default function ShareModal({
  isOpen,
  onClose,
  imageUrl,
  audioBlobOrBase64,
  title,
  intensity
}: ShareModalProps) {
  const [compiling, setCompiling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [finishedVideoUrl, setFinishedVideoUrl] = useState<string | null>(null);
  const [finishedVideoBlob, setFinishedVideoBlob] = useState<Blob | null>(null);
  const [fileExtension, setFileExtension] = useState('mp4');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getAudioBlob = (): Blob => {
    if (typeof audioBlobOrBase64 === 'string') {
      return base64ToBlob(audioBlobOrBase64);
    }
    return audioBlobOrBase64;
  };

  const handleShareImage = async () => {
    setErrorMsg(null);
    setStatusText('Downloading image data...');
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Scream Monster: ${title}`,
          text: `Summoned this monster using my scream! Intensity: ${intensity}% ⚡`
        });
      } else {
        // Fallback to direct download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to share image:', err);
      setErrorMsg('Could not fetch image for native sharing. Downloading directly instead.');
      // Direct link fallback
      const a = document.createElement('a');
      a.href = imageUrl;
      a.target = '_blank';
      a.download = `${title}.png`;
      a.click();
    } finally {
      setStatusText('');
    }
  };

  const handleCompileVideo = async () => {
    setErrorMsg(null);
    setCompiling(true);
    setProgress(0);
    setStatusText('Decoding vocal frequencies...');

    try {
      const audioBlob = getAudioBlob();
      
      setStatusText('Synthesizing dynamic viewport tracks...');
      const result = await compileScreamVideo(
        imageUrl,
        audioBlob,
        title,
        intensity,
        (p) => {
          setProgress(p);
          if (p < 30) {
            setStatusText('Binding static character frames...');
          } else if (p < 70) {
            setStatusText('Adding glowing sonic waveforms...');
          } else {
            setStatusText('Fusing dynamic audio container...');
          }
        }
      );

      setFinishedVideoUrl(result.url);
      setFinishedVideoBlob(result.blob);
      setFileExtension(result.extension);
      setStatusText('Fusing complete!');
    } catch (err: any) {
      console.error('Video compilation failed:', err);
      setErrorMsg(err?.message || 'Failed to compile audio-reactive video.');
      setCompiling(false);
    }
  };

  const handleShareVideo = async () => {
    if (!finishedVideoBlob || !finishedVideoUrl) return;

    const filename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.${fileExtension}`;
    const file = new File([finishedVideoBlob], filename, { type: finishedVideoBlob.type });

    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Scream Monster: ${title}`,
          text: `Check out the monster animated directly from my raw scream! ⚡`
        });
      } else {
        // Trigger download
        const a = document.createElement('a');
        a.href = finishedVideoUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to share video:', err);
      setErrorMsg('Native sharing failed. Saving file to your device downloads instead.');
    }
  };

  const resetCompilation = () => {
    setFinishedVideoUrl(null);
    setFinishedVideoBlob(null);
    setCompiling(false);
    setProgress(0);
    setStatusText('');
    setErrorMsg(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" id="share-modal-overlay">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-lg"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="bg-[#0D0D0D] border border-white/10 max-w-md w-full rounded-3xl overflow-hidden relative z-10 shadow-2xl flex flex-col"
            id="share-modal-box"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111]" id="share-header">
              <div>
                <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-red-500 uppercase">Export & Share</span>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-tight mt-0.5">
                  Preserve Your Rage
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1A1A1A] border border-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
                id="btn-close-share"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 flex flex-col" id="share-body">
              {/* Character Header Snippet */}
              <div className="flex gap-4 p-3.5 bg-[#141414] rounded-2xl border border-white/5 items-center mb-6" id="share-preview-snippet">
                <img
                  src={imageUrl}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover border border-white/10"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-black text-white text-xs uppercase truncate tracking-wide">{title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-red-950/60 border border-red-900/30 text-red-400 px-2 py-0.5 rounded-md font-mono text-[8px] font-black uppercase">
                      INTENSITY: {intensity}%
                    </span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-xl flex gap-2.5 items-center text-xs text-red-400 font-medium" id="share-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Status and Progress */}
              {compiling ? (
                <div className="flex flex-col items-center justify-center py-8 text-center" id="compilation-progress-view">
                  {finishedVideoUrl ? (
                    <div className="w-16 h-16 bg-green-950/30 border border-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-400" id="finished-icon">
                      <Check className="w-8 h-8 animate-bounce" />
                    </div>
                  ) : (
                    <div className="relative w-20 h-20 mb-6 flex items-center justify-center" id="glowing-spinner">
                      {/* Dual rotating glowing orbits */}
                      <div className="absolute inset-0 rounded-full border-4 border-red-950/20 border-t-red-500 animate-spin" />
                      <div className="absolute inset-2 rounded-full border-2 border-yellow-950/20 border-b-yellow-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
                      <Film className="w-6 h-6 text-yellow-500 animate-pulse" />
                    </div>
                  )}

                  <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wider font-display">
                    {finishedVideoUrl ? 'Video Completed!' : 'Synthesizing Video...'}
                  </h4>
                  <p className="text-neutral-400 font-mono text-[10px] uppercase tracking-wider mb-5 h-4">
                    {statusText}
                  </p>

                  {/* Progressive visual bar */}
                  {!finishedVideoUrl && (
                    <div className="w-full max-w-xs bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-white/5 relative mb-4">
                      <motion.div
                        className="bg-gradient-to-r from-red-600 to-yellow-500 h-full rounded-full"
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  )}

                  {!finishedVideoUrl && (
                    <span className="font-mono text-xs text-neutral-500 font-black">
                      {progress}% COMPLETE
                    </span>
                  )}

                  {/* Actions post-compilation */}
                  {finishedVideoUrl && (
                    <div className="flex flex-col gap-3 w-full max-w-xs mt-2" id="compiled-video-actions">
                      <button
                        onClick={handleShareVideo}
                        className="w-full py-3.5 bg-green-600 hover:bg-green-500 border border-green-500 rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_25px_rgba(34,197,94,0.2)] active:scale-95"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share / Save MP4</span>
                      </button>
                      <button
                        onClick={resetCompilation}
                        className="w-full py-2 bg-transparent text-neutral-500 hover:text-neutral-400 text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Starta om kompilering
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Choice Menu Grid */
                <div className="flex flex-col gap-4" id="share-options-grid">
                  {/* Share option 1: Video */}
                  <button
                    onClick={handleCompileVideo}
                    className="p-5 rounded-2xl border border-white/5 hover:border-red-500/30 bg-[#121212] hover:bg-[#181212] text-left transition-all flex gap-4 items-start group cursor-pointer"
                    id="opt-share-video"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                      <Film className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-display font-black text-xs uppercase tracking-wide text-white">Animerad Video (MP4)</span>
                        <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 uppercase font-black">Rekommenderas</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal mt-1.5">
                        Kompilerar bilden och din röstinspelning till en häftig video med levande och pulserande neon-red ljudvågor i realtid. Perfekt för Instagram, TikTok eller mail!
                      </p>
                    </div>
                  </button>

                  {/* Share option 2: Image */}
                  <button
                    onClick={handleShareImage}
                    className="p-5 rounded-2xl border border-white/5 hover:border-red-500/20 bg-[#121212] hover:bg-[#121212] text-left transition-all flex gap-4 items-start group cursor-pointer"
                    id="opt-share-image"
                  >
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:scale-105 transition-transform">
                      <Image className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-display font-black text-xs uppercase tracking-wide text-white">Bara Bild (PNG)</span>
                      <p className="text-[10px] text-neutral-400 leading-normal mt-1.5">
                        Dela eller ladda ner den högupplösta monsterbilden direkt till din mobil eller dator.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="p-4 bg-[#0A0A0A] border-t border-white/5 text-center text-neutral-500 text-[9px] font-mono uppercase tracking-wider" id="share-footer-branding">
              Förberedd för Google Play • Export Engine v1.5
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
