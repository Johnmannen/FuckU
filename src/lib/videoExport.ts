/**
 * Utility to record an animated "Split-Jaw" canvas + audio into an MP4/WebM video.
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
      recorder.ondataavailable = (e) => chunks.push(event?.data || e.data);
      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/mp4' });
        URL.revokeObjectURL(audioUrl);
        resolve(videoBlob);
      };

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

        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(0, 0, 720, 720);

        // --- SPLIT-JAW ANIMATION ---
        const jawOffset = volRatio * 40;
        const shakeX = (Math.random() - 0.5) * volRatio * 10;
        const shakeY = (Math.random() - 0.5) * volRatio * 10;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Draw Top Half (Stationary)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 720, 360);
        ctx.clip();
        ctx.drawImage(img, 0, 0, 720, 720);
        ctx.restore();

        // Draw Bottom Half (Moving Down)
        ctx.save();
        ctx.translate(0, jawOffset);
        ctx.beginPath();
        ctx.rect(0, 360, 720, 360);
        ctx.clip();
        ctx.drawImage(img, 0, 0, 720, 720);
        ctx.restore();

        ctx.restore();
        // ---------------------------

        // Overlay Title
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
