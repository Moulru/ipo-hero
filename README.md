# 공모주 히어로 (IPO Hero)

한국 공모주(IPO) 일정·정보를 한눈에 보는 **정보 앱**이자, 살펴보고·예측하고·정산하며 투자자 등급을 키우는 **앰비언트 RPG**입니다. 웹 우선, 안드로이드(Capacitor) 확장을 목표로 합니다.

> 가상 머니 기반 정보·시뮬레이션 앱입니다. 실제 투자 자문이나 실거래 기능이 아닙니다.

## 주요 기능

- **공모주 정보** — 청약 일정·공모가·공모 규모·상장일, 10주 청약 시 예상 배정, 청약 가능 증권사
- **실전 시뮬레이션** — 청약 중인 종목에 가상 청약(증거금 에스크로) + 결과 예측 → 실제 상장일 결과로 정산
- **투자자 등급** — 개미 → 불개미 → … → 공모왕 계단식 랭크, XP·골드 성장
- **투자 카드** — 100종 수집 가챠(중복 환불, 미보유 천장)
- **출석·퀘스트·업적·칭호**, 라이트/다크 테마

## 탭 구성

| 탭 | 내용 |
|---|---|
| 🏠 공모주 | 정산 대기 · 청약 중 · 곧 시작 · 상장 대기 · 지난 7일 결과 |
| 🛋️ 라운지 | 등급 여정 · 출석 · 퀘스트 · 투자 카드 가챠/도감 |
| 👤 MY | 프로필 · 공모주 도감 · 업적 · 칭호 · 시스템 설정 |

## 기술 스택

React 18 · TypeScript · Vite 6 · zustand · Pretendard · 순수 CSS(라이트/다크 테마)

## 시작하기

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드 (tsc + vite)
```

## 데이터

공모주 데이터는 **공식 공시(DART)·한국거래소(KIND)** 등을 기반으로 수집합니다.

```bash
npm run data     # 데이터 수집 → src/data/ipos.json · public/ipos.json
```

수집에는 DART OpenAPI 키가 필요합니다 — 프로젝트 루트 `OpenAPIkey.txt` 또는 환경변수 `DART_API_KEY`.

## 자동 갱신 · 배포

GitHub Actions로 무료 운영합니다.

- **`refresh-data.yml`** — 일정 주기로 데이터를 갱신·커밋 (저장소 Secret `DART_API_KEY` 필요)
- **`deploy.yml`** — 코드 변경 시 GitHub Pages로 빌드·배포
- 앱은 실행 시 호스팅된 `ipos.json`을 가져와 자동으로 최신화하며, 네트워크 실패 시 번들 데이터로 동작합니다.

외부 호스팅·모바일 빌드에서는 `VITE_DATA_URL`로 라이브 데이터 URL을 지정합니다.

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
