import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.weavinglight.app',
  appName: '織光',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    // ⚠️ 開發時取消下面兩行的註解來啟用 Live Reload
    // url: 'http://10.0.2.2:5173',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#FBF7F4',        // 織光暖白背景
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'light',
    },
    StatusBar: {
      style: 'light',                    // 淺色狀態列（深色文字）
      backgroundColor: '#FBF7F4',
    },
  },
};

export default config;

