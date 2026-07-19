/**
 * Utility to client-side compile a dynamic audio-reactive video (WebM/MP4) 
 * combining the generated avatar image and the recorded scream audio.
 */

export interface CompileProgressCallback {
  (progress: number): void;
}

export async function compileScreamVideo(
  imageUrl: string,
  audioBlob: Blob,
  title: string,
  intensity: number,
  onProgress: CompileProgressCallback
): Promise<{ blob: Blob; url: string; extension: string }> {
  // 1. Pre-load the avatar image using anonymous CORS
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => {
      // If CORS or loading fails, we will still generate a visual fallback card
      resolve(true);
    };
  });

  // 2. Create the target canvas
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  // 3. Set up Web Audio API to decode and analyze the scream audio
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  const audioCtx = new AudioContextClass();
  const arrayBuffer = await audioBlob.arrayBuffer();
  
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    audioCtx.close();
    throw new Error("Failed to decode scream audio file.");
  }

  const duration = audioBuffer.duration;

  // 4. Capture Canvas stream and mix in the audio stream
  // We specify a 30fps rate
  const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : (canvas as any).webkitCaptureStream(30);
  const audioDestination = audioCtx.createMediaStreamDestination();

  const audioSource = audioCtx.createBufferSource();
  audioSource.buffer = audioBuffer;

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 128; // Keep FFT small for fast frequency band extraction
  analyser.smoothingTimeConstant = 0.8;

  // Chain: Source -> Analyser -> Destination Stream (No speakers/output to prevent echo during render)
  audioSource.connect(analyser);
  analyser.connect(audioDestination);

  // 5. Combine video and audio tracks
  const combinedStream = new MediaStream();
  if (canvasStream && canvasStream.getVideoTracks().length > 0) {
    combinedStream.addTrack(canvasStream.getVideoTracks()[0]);
  }
  if (audioDestination.stream && audioDestination.stream.getAudioTracks().length > 0) {
    combinedStream.addTrack(audioDestination.stream.getAudioTracks()[0]);
  }

  // 6. Setup MediaRecorder with best supported modern format
  let options = { mimeType: "video/mp4" };
  let ext = "mp4";

  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "video/webm;codecs=vp9,opus" };
    ext = "webm";
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "video/webm;codecs=vp8,opus" };
    ext = "webm";
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "video/webm" };
    ext = "webm";
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "" }; // Browser default
    ext = "webm";
  }

  const mediaRecorder = new MediaRecorder(combinedStream, options);
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // 7. Start recording and audio playback
  const startTime = audioCtx.currentTime;
  mediaRecorder.start();
  audioSource.start(0);

  // 8. Animation loop to draw real-time audio reactive graphics
  return new Promise((resolve, reject) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    const renderLoop = () => {
      const elapsed = audioCtx.currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      onProgress(Math.round(progress * 100));

      analyser.getByteFrequencyData(dataArray);

      // Extract average volume amplitude
      let totalAmp = 0;
      for (let i = 0; i < dataArray.length; i++) {
        totalAmp += dataArray[i];
      }
      const avgAmp = dataArray.length > 0 ? totalAmp / dataArray.length : 0;
      const volumeMultiplier = Math.min(1, avgAmp / 120);

      // --- Draw Scene ---
      ctx.clearRect(0, 0, 720, 720);

      // A. Draw background avatar image (or custom graphic if image failed to load)
      if (img.complete && img.naturalWidth > 0) {
        // Draw image slightly shaken/scaled by the scream amplitude
        ctx.save();
        const shake = volumeMultiplier * 12;
        const scale = 1 + (volumeMultiplier * 0.05);
        
        ctx.translate(360 + (Math.random() - 0.5) * shake, 360 + (Math.random() - 0.5) * shake);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -360, -360, 720, 720);
        ctx.restore();
      } else {
        // High quality dark space grid fallback card
        const gradient = ctx.createRadialGradient(360, 360, 50, 360, 360, 500);
        gradient.addColorStop(0, "#1c0c0c");
        gradient.addColorStop(0.5, "#0d0505");
        gradient.addColorStop(1, "#030101");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 720, 720);

        // Draw geometric grid lines
        ctx.strokeStyle = "rgba(220, 38, 38, 0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 720; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 720);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(720, i);
          ctx.stroke();
        }
      }

      // B. Transparent dark vignette cover
      const vignette = ctx.createRadialGradient(360, 360, 180, 360, 360, 480);
      vignette.addColorStop(0, "rgba(0, 0, 0, 0.1)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.85)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 720, 720);

      // C. Draw Audio Reactive Glowing Sonic Shockwaves (Radial)
      const centerX = 360;
      const centerY = 360;
      const baseRadius = 140;

      ctx.save();
      // Outer neon shockwave outline
      ctx.shadowBlur = 15 + (volumeMultiplier * 25);
      ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
      ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
      ctx.lineWidth = 4 + (volumeMultiplier * 6);
      ctx.beginPath();

      const numPoints = 80;
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const dataIdx = Math.floor((i % numPoints / numPoints) * dataArray.length);
        const value = dataArray[dataIdx] || 0;
        
        // Add dynamic frequency noise
        const spike = (value / 255) * 110 * (0.8 + Math.sin(elapsed * 25 + i) * 0.2);
        const r = baseRadius + spike;
        
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();

      // Inner amber pulse
      ctx.shadowColor = "rgba(234, 179, 8, 0.7)";
      ctx.strokeStyle = "rgba(234, 179, 8, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const dataIdx = Math.floor(((numPoints - i) % numPoints / numPoints) * dataArray.length);
        const value = dataArray[dataIdx] || 0;
        
        const spike = (value / 255) * 60;
        const r = (baseRadius - 25) + spike;
        
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // D. Header Info Card Overlay
      ctx.fillStyle = "rgba(10, 10, 10, 0.85)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1.5;
      
      // Draw bottom rounded container
      ctx.beginPath();
      ctx.roundRect(50, 580, 620, 100, 24);
      ctx.fill();
      ctx.stroke();

      // Character Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.fillText(title.toUpperCase(), 80, 618);

      // Decibel and parameters text
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 15px monospace";
      ctx.fillText(`⚡ INTENSITY: ${intensity}%  •  ⏱️ DURATION: ${duration.toFixed(2)}s`, 80, 652);

      // Subtle branding signature at the top (extremely elegant and tiny)
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.font = "bold 11px monospace";
      ctx.fillText("SUMMONED WITH SCREAM MONSTER", 255, 45);

      if (elapsed < duration) {
        animationId = requestAnimationFrame(renderLoop);
      } else {
        // Complete the compilation
        setTimeout(() => {
          try {
            mediaRecorder.stop();
          } catch (e) {
            reject(e);
          }
          audioSource.stop();
          audioCtx.close().catch(() => {});
        }, 300);
      }
    };

    mediaRecorder.onstop = () => {
      try {
        const finalBlob = new Blob(chunks, { type: options.mimeType || "video/webm" });
        const videoUrl = URL.createObjectURL(finalBlob);
        resolve({ blob: finalBlob, url: videoUrl, extension: ext });
      } catch (err) {
        reject(err);
      }
    };

    mediaRecorder.onerror = (e) => {
      reject(e);
    };

    // Begin looping
    renderLoop();
  });
}
