# 공모주 히어로 (IPO Hero) — 프로젝트 컨텍스트

한국 공모주(IPO) 정보를 빠르게 확인하는 **정보 앱** + 살펴보기·출석·실전 예측으로 투자자 등급(개미→공모왕)을 올리는 **앰비언트 RPG**. 웹 우선 → 안드로이드(Capacitor). **Moulru 개인 프로젝트**(연락/도메인 eous.cc · 개인 CF — 회사 medinfalls 자원 금지).

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프론트 | React 18 + TypeScript + Vite 6 |
| 상태 | zustand (+persist, key `ct-save-v6`) |
| 폰트/테마 | Pretendard(번들, `main.tsx` import) · 색은 모두 CSS 변수, **라이트 기본(따뜻한 오프화이트)** + `:root.dark` 다크 토글 |
| 연출 | 순수 CSS + canvas(콘페티) · 진동(`navigator.vibrate`, 설정서 on/off) · **사운드 없음** |
| 데이터 | 하이브리드(`npm run data`) → `ipos.json`. DART(opendart, 키=env `DART_API_KEY` 또는 `OpenAPIkey.txt`) + 거래소(KIND) + 보조 수요지표. DART 실패에 내성(재시도·부분실패 허용) |
| 자동화 | GitHub Actions cron(30분, `public/ipos.json` 갱신). 앱이 런타임에 raw URL로 fetch |
| 저장소 | github.com/Moulru/ipo-hero (public) · 라이브 데이터=`raw.githubusercontent.com/Moulru/ipo-hero/main/public/ipos.json` |
| 모바일 | **Capacitor 6**(JDK 17 · AGP 8.9.1 · Gradle 8.11.1 · **targetSdk/compileSdk 36**, minSdk 22). appId **`cc.eous.ipohero`**. 플러그인: app(뒤로가기)·status-bar·splash-screen·share(종목 공유, 권한 불요). 커스텀 아이콘·스플래시. 라이브 URL=`.env.production`. 릴리스 서명=`android/keystore.properties`(gitignore) |
| 연락 | contact@eous.cc (CF Email Routing → naver) |

## 실행

```
npm install
npm run data   # 실데이터 수집 → src/data/ipos.json (+ public/ipos.json)
npm run dev    # http://localhost:5173
npm run build  # tsc --noEmit + vite build (.env.production의 VITE_DATA_URL 주입)
npx cap sync android                              # 모바일: 빌드 결과 동기화
android\gradlew.bat -p android assembleDebug      # 디버그 APK
android\gradlew.bat -p android bundleRelease      # 서명된 릴리스 AAB
```
출시 산출물(AAB·아이콘512·피처그래픽·`STORE_LISTING.md` 가이드)은 `GooglePlay 산출물/`, 빌드 임시(APK 등)는 `docs/`(둘 다 gitignore·`*.aab`/`*.apk` 제외).

## 탭 구조

- **🏠 공모주**: 앱 실행 시 온보딩 없이 바로 진입. **오늘 브리핑**(오늘 마감·시작·상장/다음 일정 칩) · **검색**(이름·업종·증권사) · **목록/캘린더 토글**(월간 일정 그리드) · 데이터 기준 칩(탭=새로고침) · 실제 IPO(정산대기/청약중/곧시작/상장대기 + 지난 7일) + **최근 상장 성과 통계** + 면책 푸터. 상세(시트): **탭 분리** — 「공모주 정보」(기본: 정보그리드·상장결과·수요지표 게이지·실전 체크 타임라인·증권사 칩) + 「모의청약」(예상배정·상장일 예측·가상청약 슬라이더·정산, 액션 가능 시 탭에 점). 헤더에 **공유 버튼**(텍스트형, @capacitor/share). 용어=**모의청약**(구 '모의투자').
- **🛋️ 라운지**: 투자자 등급 여정(레벨·랭크 사다리·다음목표) · 출석 · 퀘스트 · 투자 카드 가챠+도감
- **👤 MY**: 프로필(성향·등급·전적) · 공모주 도감 · 업적 · 칭호 · ⚙️ **시스템 설정**(다크모드 · 진동 효과 · 데이터 새로고침+갱신시각 · 정보[버전·개인정보·문의·**개인정보처리방침 링크**→`app.eous.cc/ipo-hero-privacy` 외부 브라우저])

## 구조

```
scripts/  fetchIpos.mjs (하이브리드 오케스트레이터) · lib/ dart·kind·source38
src/
  data/   classes · ranks · relics(100종, UI명 '투자 카드') · quests · achievements
          ipos.json(+public/ 런타임 서빙) · loadIpos(번들 폴백 + useIpos/useDataTimestamp 런타임 fetch) · mockIpos
  lib/    calc(단계·가챠·포맷·영업일/환불추정) · juice(진동[on/off]·콘페티·토스트) · native(스플래시·상태바·뒤로가기·onResume) · backStack(오버레이 뒤로가기) · share(네이티브→WebShare→클립보드 폴백)
  store.ts  zustand: setSubscription(증거금 에스크로)·settleReal(상장+1·순수손익)·setHaptics·setDark·pullRelic·tick
  components/ TopBar·BottomNav · Dashboard(브리핑·검색·통계·데이터칩)·CalendarView·IpoDetail(게이지·실전체크·공유)·DropRate · Play·DailyCheckIn·Quests
              My·Dex·RelicDex·Achievements·ClassPicker·SystemSettings · ResultModal·RelicReveal·Toast·CountUp
.github/workflows/  refresh-data.yml(cron 데이터 갱신)
android/  Capacitor 안드로이드 (gitignore · `npx cap add android`로 재생성)
assets/   앱 아이콘·스플래시 소스 → `npx @capacitor/assets generate --android`
PRIVACY.md  개인정보처리방침(Play 등록용·URL 안정 위해 루트 유지) · GooglePlay 산출물/  출시 산출물·가이드(STORE_LISTING.md) · docs/  빌드 임시(gitignore)
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
- **런타임 데이터**: `useIpos()`(useSyncExternalStore) — 번들로 즉시 표시 후 `VITE_DATA_URL`‖`/ipos.json` fetch해 더 최신(`generatedAt`)이면 교체. 실패 시 번들 유지. `useDataTimestamp()`=갱신 시각.
- **테마**: 새 색은 반드시 변수(`var(--surface)`) — 하드코딩 금지. 토스트만 고정 다크.
- **투자 카드 가챠**(100종): 천장=미보유 확정, 등급별 확률 고정. 중복=스택 없이 골드 환불(최대 100G). 100종 완성 시 뽑기 잠금.
- **UI 용어**: 화면 표기는 '투자 성향'(코드 식별자는 `chosenClass`/`CLASSES`).
- **알림 기능 제거됨**(새 공모주 푸시=Firebase 의존이라 제외). 진동 토글·데이터 새로고침으로 대체. `notify.ts` 없음.
- **데이터 파이프라인(2026-07 고도화)**: fetchIpos가 이전 ipos.json과 **머지** — ①id 영속화(이름 기준 기존 id 유지, n→k 전환 방지) ②필드 보존(38 이탈해도 수익률·지표 유지) ③아카이브(유니버스 밖: 상장완료+ticker 400일 · 상장예정/최근 7일 청약은 소스 일시실패 대비 보존, 최대300건) ④정합성 가드(상장일≤청약마감=모순→대체/null · 확정가는 확정플래그와 같은 소스에서 선택[래칫 방지]) ⑤신규 필드 ticker·market(코스피/코스닥)·demandForecastDate ⑥데이터 무변경이면 파일 미기록(cron 노이즈 커밋 방지) ⑦DART 키 부재=호출 시점 실패(38+KIND 폴백 동작). `npm run build`의 prebuild가 데이터 자동 갱신(실패해도 soft-fail). 2회 실행 멱등 검증됨.
- **백그라운드 복귀 갱신**: native resume + visibilitychange 양쪽에서 refreshIpos() (generatedAt 가드로 중복 무해).
- **네이티브(모바일)**: `lib/native.ts`(스플래시·상태바·뒤로가기), `lib/backStack.ts`(오버레이는 `useBackClose(onClose)`로 등록 → 뒤로가기가 위에서부터 닫음). 모든 네이티브 호출은 `Capacitor.isNativePlatform()`+try/catch 가드(웹=no-op).
- **릴리스 빌드**: `gradlew bundleRelease` → 서명 AAB(현재 versionCode 8·versionName 1.0.0·R8 minify on). 산출물=`GooglePlay 산출물/ipohero-v1.0.0-vc8.aab`(+mapping). (프로덕션 첫 제출까지 versionName 1.0.0 유지, vc만 증가.) 키=`android/app/release.keystore`+`keystore.properties`(gitignore, **백업 필수**, pw=`../_myToken_.md` 참고). **android/는 gitignore → 재생성 시** 서명·versionName + targetSdk/compileSdk 36(`variables.gradle`)·AGP 8.9.1(`build.gradle`)·Gradle 8.11.1(`wrapper`)·minifyEnabled true+`proguard-rules.pro`(Capacitor 보호 규칙) 재적용 필수. R8 mapping=`build/outputs/mapping/release/mapping.txt`(Play 업로드용).
- 에뮬레이터 검증 완료(아이콘·뒤로가기·테마·데이터).
- **경로**: 2026-06 OneDrive→로컬 이전 `~/Desktop/JH/Eous/IPO-hero`(`JH/Eous/` 구조째 이동 → `../eous-landing`·`../_myToken_.md` 유효). 기존 OneDrive 동기화발 Vite 워처 누락 문제는 해소됨.

## 관련 (별도 폴더/세션)

- **랜딩페이지**: `../eous-landing/` → **app.eous.cc**(Cloudflare Pages). 여러 앱 허브. 공모주 히어로 카드 포함. 자체 CLAUDE_CONTEXT.md 있음.
- **CF/시크릿**: 개인 CF 토큰=`cloudflare-token.txt`(gitignore). 전체 토큰 금고=`../_myToken_.md`.

## 추후

**증권사별 배정 비교**(증권사별 실시간 경쟁률 소스 미확보 → 보류) · **Play Store 출시 진행 중**(비공개 테스트=v1.0.0/vc3 진행 중. **프로덕션용 v1.0.0/vc8 빌드 완료**[정보코어 v1.1 + 공유버튼 텍스트화 + 웰컴 제거 + 상세시트 탭분리(정보/모의청약) + '모의투자'→'모의청약' + edge-to-edge 하단 safe-area 패딩 수정]=`GooglePlay 산출물/ipohero-v1.0.0-vc8.aab`, 14일 충족 후 제출 예정. 가이드·산출물=`GooglePlay 산출물/`, 방침=PRIVACY.md. ⚠️개인계정은 프로덕션 전 12명·14일 비공개 테스트 의무) · Pretendard는 이미 번들 · 시즌 랭킹(백엔드)
