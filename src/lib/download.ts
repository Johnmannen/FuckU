/**
 * Utility to download a high-quality "Monster Card" for social media.
 */
export async function downloadMonsterCard(
  imageUrl: string,
  title: string,
  stats: { intensity: number; pitch: number; stability: number; duration: number },
  analysis: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Setup Canvas (Portrait social media size: 1080x1350)
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");

      // 2. Load Monster Image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((res) => (img.onload = res));

      // 3. Draw Background
      const gradient = ctx.createLinearGradient(0, 0, 0, 1350);
      gradient.addColorStop(0, '#0A0A0A');
      gradient.addColorStop(1, '#1A0A0A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1350);

      // 4. Draw Monster Image (Top, with rounded corners/margin)
      const padding = 60;
      const imgSize = 1080 - (padding * 2);

      ctx.save();
      // Simple rounded corner clip
      ctx.beginPath();
      ctx.roundRect(padding, padding, imgSize, imgSize, 40);
      ctx.clip();
      ctx.drawImage(img, padding, padding, imgSize, imgSize);
      ctx.restore();

      // 5. Draw Title
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 64px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title.toUpperCase(), 540, imgSize + padding + 100);

      // 6. Draw Stats Row
      const drawStat = (label: string, value: string, x: number, y: number) => {
        ctx.fillStyle = "#666666";
        ctx.font = "bold 24px monospace";
        ctx.fillText(label, x, y);
        ctx.fillStyle = "#FF3333";
        ctx.font = "900 48px monospace";
        ctx.fillText(value, x, y + 60);
      };

      ctx.textAlign = "center";
      drawStat("INTENSITY", `${stats.intensity}%`, 270, imgSize + padding + 200);
      drawStat("PITCH", `${stats.pitch}%`, 540, imgSize + padding + 200);
      drawStat("STABILITY", `${stats.stability}%`, 810, imgSize + padding + 200);

      // 7. Draw Analysis (Wrapped Text)
      ctx.fillStyle = "#CCCCCC";
      ctx.font = "italic 32px sans-serif";
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, y);
      };
      wrapText(`"${analysis}"`, 540, imgSize + padding + 360, 960, 48);

      // 8. Branding
      ctx.fillStyle = "#444444";
      ctx.font = "bold 20px monospace";
      ctx.fillText("SCREAMED WITH FUCKU — COGNITIVE RELEASE SYSTEM", 540, 1310);

      // 9. Trigger Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `fucku_${title.replace(/\s+/g, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve();

    } catch (err) {
      reject(err);
    }
  });
}
