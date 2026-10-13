# 공모주 히어로 (IPO Hero)

한국 공모주(IPO) 일정·정보를 한눈에 보는 **정보 앱**이자, 살펴보고·예측하고·정산하며 투자자 등급을 키우는 **앰비언트 RPG**입니다. 웹 우선, 안드로이드(Capacitor) 확장을 목표로 합니다.

> 가상 머니 기반 정보·시뮬레이션 앱입니다. 실제 투자 자문이나 실거래 기능이 아닙니다.

## 주요 기능

- **홈** — 오늘 요약 한 문장(청약 마감·시작·상장, 없으면 다음 일정), 오늘 일정 · 내 모의청약 · 관심 종목 · 공모주 일정(청약 중/예정/상장 예정) · 최근 상장 결과, 당겨서 새로고침
- **일정** — 월간 캘린더(수요예측·청약 시작·마감·상장), 스와이프로 달 이동, 날짜별/다가오는 일정, 스팩 포함 토글
- **종목 상세** — 공모 개요 · 수요 지표(기관 경쟁률·의무확약·통합 경쟁률 + 최근 공모주 대비 백분위) · 주요 일정 타임라인 · 청약 준비(최소 증거금) · 증권사, 용어 설명 시트, 관심 종목·공유
- **모의청약** — 상장일 예측 4지선다 + 수량 스테퍼(증거금 에스크로) → 상장 다음 날 실제 결과로 정산(단계 연출), 취소 가능
- **검색** — 종목·업종·증권사 + 초성 검색, 최근 검색어
- **라운지(방치형 RPG)** — 도트 기사가 무한 스테이지를 자동 전투(보스·지역 변주·탭 공격), 골드로 공격·방어·체력 강화, 시즌 자산 배율·카드 도감 보너스, 방치 보상(최대 8시간), 최고 스테이지로 투자자 등급(개미→공모왕), 출석·퀘스트·투자 카드 100종
- **MY** — 시즌 자산·손익, 적중률, 모의청약 내역, 공모주/카드 도감, 업적, 칭호, 투자 성향, 설정(테마 시스템/라이트/다크·진동·새로고침·시즌 초기화·오픈소스 라이선스)

## 디자인 시스템

- 토큰: `src/styles/tokens.css` — 브랜드 바이올렛(앱 아이콘 그라데이션 중간톤), 국내 관례 상승=빨강/하락=파랑, 라이트·다크, 보조 텍스트 WCAG AA 대비
- 공통 UI: `src/ui/` — Page(스택 페이지)·Sheet(드래그 닫기)·Confirm·Segmented·Switch·ChipTabs·MenuRow·Progress·Empty·StockLogo(모노그램)·Emoji(3D)
- 아이콘: [Lucide](https://lucide.dev)(ISC) + 자체 탭 아이콘/브랜드 마크
- 3D 이모지: [Fluent Emoji](https://github.com/microsoft/fluentui-emoji)(Microsoft, MIT) — `npm run emoji`가 코드에서 쓰는 이모지만 `public/emoji/`로 복사

## 시작하기

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드 (tsc + vite)
npm run emoji    # 새 이모지를 코드에 썼다면 3D 이모지 에셋 동기화
```

## 데이터

공모주 데이터는 **공식 공시(DART)·한국거래소(KIND)** 등을 기반으로 수집합니다.

```bash
npm run data     # 데이터 수집 → src/data/ipos.json · public/ipos.json
```

수집에는 DART OpenAPI 키가 필요합니다 — 프로젝트 루트 `OpenAPIkey.txt` 또는 환경변수 `DART_API_KEY`.

## 데이터 자동 갱신

GitHub Actions(`refresh-data.yml`)가 일정 주기로 데이터를 갱신·커밋합니다 (저장소 Secret `DART_API_KEY` 필요). 앱은 실행 시 호스팅된 `ipos.json`을 가져와 자동으로 최신화하며, 네트워크 실패 시 번들 데이터로 동작합니다. 데이터 URL은 `.env.production`의 `VITE_DATA_URL`로 지정합니다.

## 안드로이드 (Capacitor)

```bash
npm run build              # 웹 자산 빌드 (VITE_DATA_URL 주입)
npx cap sync android       # android/ 네이티브 프로젝트에 동기화
```

이후 Android Studio로 `android/`를 열어 실행·빌드하거나, 디버그 APK를 직접 빌드합니다.

```bash
android\gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

## 프로젝트 구조

```
scripts/   데이터 수집 파이프라인
src/
  data/        도메인 데이터 · 로더(번들 폴백 + 런타임 fetch)
  lib/         계산·연출 유틸
  store.ts     zustand 전역 상태
  components/   화면·UI 컴포넌트
.github/workflows/   데이터 갱신 · 배포
```
