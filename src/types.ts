export interface ScreamRecord {
  id: string;
  timestamp: number;
  duration: number; // in seconds (e.g., 2.45)
  maxVolume: number; // max volume percentage (0 - 100)
  avgVolume: number; // average volume percentage (0 - 100)
  intensity: number; // overall intensity (0 - 100)
  title: string; // "The Tiny Tremor", "The Rising Storm", "The Primal Scream"
  characterType: string; // pokemon, humanoid, dragon
  characterStyle: string; // sad/blue, angry/orange, furious/neon
  prompt: string; // complete image prompt used
  imageUrl: string; // pollinations.ai image URL
  audioData?: string; // base64 encoded audio string for persistent playback
  analysis?: string; // localized emotion analysis
  userId?: string; // Firebase UID if logged in
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

export type ScreenType = 'start' | 'result' | 'gallery';
