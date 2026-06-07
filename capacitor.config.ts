import type { CapacitorConfig } from '@capacitor/cli'

// 안드로이드(Capacitor) 설정.
// 빌드: npm run build && npx cap sync android && (android에서) ./gradlew assembleDebug
const config: CapacitorConfig = {
  appId: 'com.medinfalls.ipohero',
  appName: '공모주 히어로',
  webDir: 'dist',
  backgroundColor: '#f6f4ef', // 라이트 테마 배경(스플래시/여백)
}

export default config
