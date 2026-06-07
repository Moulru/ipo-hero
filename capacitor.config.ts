import type { CapacitorConfig } from '@capacitor/cli'

// 안드로이드 출시(최종 목표) 준비용 Capacitor 설정.
// 실제 빌드 시: npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
//             npx cap init && npm run build && npx cap add android && npx cap open android
const config: CapacitorConfig = {
  appId: 'com.medinfalls.cheongyaktower',
  appName: '청약의 탑',
  webDir: 'dist',
}

export default config
