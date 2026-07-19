/**
 * Utility to record an animated canvas + audio into an MP4/WebM video.
 */
export async function recordScreamVideo(
  imageUrl: string,
  audioBlob: Blob,
  title: string,
  onProgress: (p: number) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Setup Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");

      // 2. Load Image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((res) => (img.onload = res));

      // 3. Setup Audio for Analysis
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(audio);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // 4. Setup MediaRecorder
      const stream = canvas.captureStream(30); // 30 FPS

      // Mix audio into the stream
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      const audioTrack = dest.stream.getAudioTracks()[0];
      stream.addTrack(audioTrack);

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(event?.data || e.data);
      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/mp4' });
        URL.revokeObjectURL(audioUrl);
        resolve(videoBlob);
      };

      // 5. Animation Loop
      const render = () => {
        if (audio.paused || audio.ended) {
          recorder.stop();
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const volume = sum / dataArray.length;
        const volRatio = volume / 128;

        // Clear and Draw
        ctx.clearRect(0, 0, 512, 512);

        // Apply "Jaw Drop" effect to canvas draw
        const jawStretch = 1 + (volRatio * 0.15);
        const shakeX = (Math.random() - 0.5) * volRatio * 15;
        const shakeY = (Math.random() - 0.5) * volRatio * 15;

        ctx.save();
        ctx.translate(256 + shakeX, 256 + shakeY);
        // We simulate the jaw drop by drawing the top half normally and stretching the bottom
        // Simplified: just scale the whole thing from top
        ctx.translate(0, -256);
        ctx.scale(1 + (volRatio * 0.05), jawStretch);
        ctx.drawImage(img, -256, 0, 512, 512);
        ctx.restore();

        // Overlay Title
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "bold 20px monospace";
        ctx.fillText(title.toUpperCase(), 30, 480);

        onProgress(Math.min(99, (audio.currentTime / audio.duration) * 100));
        requestAnimationFrame(render);
      };

      // Start
      recorder.start();
      audio.play();
      render();

    } catch (err) {
      reject(err);
    }
  });
}
