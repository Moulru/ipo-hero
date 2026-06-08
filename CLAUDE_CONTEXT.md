# 공모주 히어로 (IPO Hero) — 프로젝트 컨텍스트

한국 공모주(IPO) 정보를 빠르게 확인하는 **정보 앱** + 살펴보기·출석·실전 예측으로 투자자 등급(개미→공모왕)을 올리는 **앰비언트 RPG**. 웹 우선 → 안드로이드(Capacitor) 목표.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프론트 | React 18 + TypeScript + Vite 6 |
| 상태 | zustand (+persist, key `ct-save-v6`) |
| 폰트/테마 | Pretendard(CDN) · 색은 모두 CSS 변수, **라이트 기본(따뜻한 오프화이트)** + `:root.dark` 다크 토글 |
| 연출 | 순수 CSS + canvas(콘페티) · navigator.vibrate · **사운드 없음** |
| 데이터 | 하이브리드(`npm run data`) → `ipos.json`. DART(opendart, 키=env `DART_API_KEY` 또는 `OpenAPIkey.txt`) + 거래소(KIND) + 보조 수요지표 |
| 자동화 | GitHub Actions cron(30분, `public/ipos.json` 갱신). 앱이 런타임에 raw URL로 fetch. **웹 배포 제거**(모바일 전환) |
| 저장소 | github.com/Moulru/ipo-hero · 라이브 데이터 = `raw.githubusercontent.com/Moulru/ipo-hero/main/public/ipos.json` |
| 모바일 | **Capacitor 6**(JDK 17). 플러그인: app(뒤로가기)·status-bar·splash-screen·local-notifications. 커스텀 아이콘·스플래시. 라이브 URL=`.env.production`. 릴리스 서명=`android/keystore.properties`(gitignore) |

## 실행

```
npm install
npm run data   # 실데이터 수집 → src/data/ipos.json (+ public/ipos.json)
npm run dev    # http://localhost:5173
npm run build  # tsc --noEmit + vite build (.env.production의 VITE_DATA_URL 주입)
npx cap sync android                 # 모바일: 빌드 결과를 android/에 동기화
android\gradlew.bat -p android assembleDebug   # 디버그 APK (또는 Android Studio로 android/ 열기)
```

## 탭 구조

- **🏠 공모주**: 실제 IPO(정산대기/청약중/곧시작/상장대기 + 지난 7일). 카드에 청약/상장 날짜 + 우측 D-day. 상세에 청약 가능 증권사 칩.
- **🛋️ 라운지**: 투자자 등급 여정(레벨·랭크 사다리·다음목표) · 출석 · 퀘스트 · 투자 카드 가챠+도감
- **👤 MY**: 프로필(성향·등급·전적) · 공모주 도감 · 업적 · 칭호 · ⚙️ 시스템 설정(다크모드·알림·버전)

## 구조

```
scripts/  fetchIpos.mjs (하이브리드 오케스트레이터) · lib/ dart·kind·source(수요지표·수익률)
src/
  data/   classes · ranks · relics(100종, UI명 '투자 카드') · quests · achievements
          ipos.json(+public/ 런타임 서빙) · loadIpos(번들 폴백 + useIpos 런타임 fetch) · mockIpos
  lib/    calc(단계·가챠·콤보·포맷) · juice(진동·콘페티·토스트)
  store.ts  zustand: setSubscription(증거금 에스크로)·settleReal(상장+1·순수손익)·setNotify·setDark·pullRelic·tick
  components/ TopBar·BottomNav · Dashboard·IpoDetail·DropRate · Play·DailyCheckIn·Quests
              My·Dex·RelicDex·Achievements·ClassPicker·SystemSettings · ResultModal·RelicReveal·Toast·CountUp
.github/workflows/  refresh-data.yml(cron 데이터 갱신)
android/  Capacitor 안드로이드 프로젝트 (gitignore · `npx cap add android`로 재생성)
assets/   앱 아이콘 소스(icon-{only,foreground,background}.svg+png) → `npx @capacitor/assets generate --android`로 android/ 아이콘 생성
```

## 핵심 도메인 규칙 (반드시 준수)

1. **정보 만인 평등 · 순수 실력** — 시즌 자산엔 성향(클래스)·카드 영향 없음(배정·손익 순수). 성향=XP 전용, 카드=게임 레이어(XP·골드)+수집 전용.
2. **베팅** — 실전은 청약 중인 종목만. 다가오는은 정보 전용.
3. **등급** — 수요 중심(기관 수요예측·통합 청약경쟁률·의무보유확약) + 공모금액 보조 + 초대형 페널티, 스팩=common. 임의값 금지.
4. **가상청약 에스크로** — 시즌 자산(실력·시즌리셋) ≠ 골드(게임·영속). 청약 시 증거금(50%) 차감 → 상장 전 수정 시 차액 환불, **상장 당일 잠금**, 상장+1일 정산.
5. **투자자 랭크(계단식)** — 랭크마다 10레벨, Lv.10 → 다음 랭크 Lv.1. 개미~슈퍼큰손 각 10레벨, 공모왕 1~무한. `rankInfo(level)`.
6. **가상머니 전용** — 실거래 미실행.

## 메모 / 함정

- 단계는 `computeStage(ipo, 오늘)` 동적 계산. 상장 **D-day 이후**만 '상장 대기'에서 숨김.
- **런타임 데이터**: `useIpos()`(useSyncExternalStore) — 번들로 즉시 표시 후 `VITE_DATA_URL`‖`/ipos.json` fetch해 더 최신(`generatedAt`)이면 교체. 실패 시 번들 유지(오프라인 안전).
- **테마**: 새 색은 반드시 변수(`var(--surface)` 등) 사용 — 하드코딩 금지(라이트에서 깨짐). 토스트만 고정 다크.
- **투자 카드 가챠**(100종): 천장=미보유 확정, 등급별 확률 고정. 중복=스택 없이 골드 환불(최대 100G). 도감 보유분만 표시, 100종 완성 시 뽑기 잠금.
- **UI 용어**: 화면 표기는 '투자 성향'(코드 식별자는 `chosenClass`/`CLASSES`).
- **증권사별 배정주수**는 실시간 증권사별 경쟁률(라이브)이 필요 → 데이터 자동화 확장 단계. 현재는 청약 가능 증권사 **목록**만 표시.
- **CountUp**은 setInterval 기반(헤드리스 rAF throttle 회피).
- **OneDrive 폴더라 Vite 워처가 변경을 누락**할 때가 있음 → 미반영 시 dev 서버 재시작(stop+start).
- **네이티브(모바일)**: `lib/native.ts`(스플래시 hide·상태바·뒤로가기), `lib/backStack.ts`(오버레이는 `useBackClose(onClose)`로 등록 → 뒤로가기가 위에서부터 닫음), `lib/notify.ts`(상장일 로컬 알림). 모든 네이티브 호출은 `Capacitor.isNativePlatform()` + try/catch로 가드(웹에선 no-op). **기기 실측은 못 했으니** 첫 디바이스 테스트 시 상태바/스플래시/알림 확인 필요.
- **릴리스 빌드**: `android\gradlew bundleRelease` → 서명된 AAB. 서명키=`android/app/release.keystore`+`android/keystore.properties`(gitignore, **백업 필수**). android/ 재생성 시 서명 설정 재적용 필요.

## 추후

**증권사별 배정 비교**(증권사별 실시간 경쟁률 소스 미확보 → 보류) · **신규 공모주 푸시**(FCM+발송서버=Firebase 계정 필요) · **Play Store 출시**(AAB 서명 완료 → Console 등록·심사 수동, 개인정보처리방침=PRIVACY.md) · 시즌 랭킹(백엔드)
