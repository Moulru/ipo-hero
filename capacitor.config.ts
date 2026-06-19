import type { CapacitorConfig } from '@capacitor/cli'

// 안드로이드(Capacitor) 설정.
// 빌드: npm run build && npx cap sync android && (android에서) ./gradlew assembleDebug
const config: CapacitorConfig = {
  appId: 'cc.eous.ipohero',
  appName: '공모주 히어로',
  webDir: 'dist',
  backgroundColor: '#f6f4ef', // 라이트 테마 배경(여백)
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500, // 앱 준비되면 SplashScreen.hide()로 더 빨리 사라짐
      backgroundColor: '#4f63f0',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
    },
  },
}

export default config
