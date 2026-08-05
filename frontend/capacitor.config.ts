import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.autismparent.assistant',
  appName: 'Autism Parent Assistant',
  webDir: 'dist',
  server: {
    // When building for native, your app loads from bundled files.
    // Set your production API URL in frontend .env (VITE_API_URL) so the app talks to your backend.
    // androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
