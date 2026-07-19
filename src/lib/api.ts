/**
 * API configuration and helpers
 */

// On web (Vercel/Localhost), we can use relative paths.
// In Capacitor (Android/iOS), we must use absolute URLs pointing to the backend.
const isCapacitor = window.hasOwnProperty('Capacitor');
const baseUrl = import.meta.env.VITE_API_BASE_URL || (isCapacitor ? 'https://fucku-six.vercel.app' : '');

export const API_ENDPOINTS = {
  analyzeScream: `${baseUrl}/api/analyze-scream`,
};

export default API_ENDPOINTS;
