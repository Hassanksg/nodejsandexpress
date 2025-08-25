// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ficore.app',
  appName: 'FiCore',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    url: 'http://localhost:5000', // Update to your backend URL
    cleartext: true,
  },
};

export default config;