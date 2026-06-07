/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 라이브 데이터 절대 URL (모바일/외부 호스팅 빌드 시 주입). 미지정 시 같은 출처의 /ipos.json
  readonly VITE_DATA_URL?: string
}
