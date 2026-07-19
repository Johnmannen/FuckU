/**
 * Utility to record an animated "Organic Warp" canvas + audio into an MP4/WebM video.
 */
export async function recordScreamVideo(
  imageUrl: string,
  audioBlob: Blob,
  title: string,
  onProgress: (p: number) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((res) => (img.onload = res));

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(audio);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const stream = canvas.captureStream(30);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      const audioTrack = dest.stream.getAudioTracks()[0];
      stream.addTrack(audioTrack);

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/mp4' });
        URL.revokeObjectURL(audioUrl);
        resolve(videoBlob);
      };

      const render = () => {
        if (audio.paused || audio.ended) {
          if (recorder.state !== 'inactive') recorder.stop();
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const volume = sum / dataArray.length;
        const volRatio = volume / 128;

        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(0, 0, 720, 720);

        // --- ORGANIC WARP SIMULATION ON CANVAS ---
        const warpScaleY = 1 + (volRatio * 0.15);
        const shakeX = (Math.random() - 0.5) * volRatio * 15;
        const shakeY = (Math.random() - 0.5) * volRatio * 15;

        ctx.save();
        ctx.translate(360 + shakeX, 360 + shakeY);
        // Warp from top
        ctx.translate(0, -360);
        ctx.scale(1 + (volRatio * 0.05), warpScaleY);

        ctx.drawImage(img, -360, 0, 720, 720);
        ctx.restore();
        // ----------------------------------------

        // Overlay Branding/Title
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "right";
        ctx.fillText(title.toUpperCase(), 690, 690);

        onProgress(Math.min(99, (audio.currentTime / audio.duration) * 100));
        requestAnimationFrame(render);
      };

      recorder.start();
      audio.play();
      render();

    } catch (err) {
      reject(err);
    }
  });
}
