import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.johnmannen.screamapp',
  appName: 'FuckU',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
