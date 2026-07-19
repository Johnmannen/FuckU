/**
 * Utility to download an image from a URL to the user's device.
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.replace(/\s+/g, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download image:', err);
    // Fallback: Open in new tab if download fails
    window.open(imageUrl, '_blank');
  }
}
