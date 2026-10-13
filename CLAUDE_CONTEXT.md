# 공모주 히어로 (IPO Hero) — 프로젝트 컨텍스트

한국 공모주(IPO) 정보를 빠르게 확인하는 **정보 앱** + 살펴보기·출석·실전 예측으로 투자자 등급(개미→공모왕)을 올리는 **앰비언트 RPG**. 웹 우선 → 안드로이드(Capacitor). **Moulru 개인 프로젝트**(연락/도메인 eous.cc · 개인 CF — 회사 medinfalls 자원 금지).

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프론트 | React 18 + TypeScript + Vite 6 |
| 상태 | zustand (+persist, key `ct-save-v6`) |
| 디자인 | **2026-10 전면 개편(v2 디자인 시스템)** — `src/styles/tokens.css` 토큰(브랜드 바이올렛 `--brand`, 상승 `--up`=빨강·하락 `--down`=파랑, 보조텍스트 AA 대비) · Pretendard 번들 · 아이콘 Lucide(ISC)+자체 탭/브랜드 SVG(`ui/icons.tsx`) · 3D 이모지 Fluent Emoji(MIT, `public/emoji/`, `npm run emoji`) · 테마 `theme`=시스템(신규 기본)/라이트/다크 → `html.dark` |
| 연출 | 순수 CSS 애니메이션(페이지 슬라이드·시트·카드 플립, `prefers-reduced-motion` 존중) + canvas(콘페티) · 진동(설정 on/off) · **사운드 없음** |
| 데이터 | 하이브리드(`npm run data`) → `ipos.json`. DART(opendart, 키=env `DART_API_KEY` 또는 `OpenAPIkey.txt`) + 거래소(KIND) + 보조 수요지표. DART 실패에 내성(재시도·부분실패 허용) |
| 자동화 | GitHub Actions cron(30분, `public/ipos.json` 갱신). 앱이 런타임에 raw URL로 fetch |
| 저장소 | github.com/Moulru/ipo-hero (public) · 라이브 데이터=`raw.githubusercontent.com/Moulru/ipo-hero/main/public/ipos.json` |
| 모바일 | **Capacitor 6**(JDK 17 · AGP 8.9.1 · Gradle 8.11.1 · **targetSdk/compileSdk 36**, minSdk 24(Play 자동 보호 요건, 2026-10-13 상향)). appId **`cc.eous.ipohero`**. 플러그인: app(뒤로가기)·status-bar·splash-screen·share(종목 공유, 권한 불요). 커스텀 아이콘·스플래시. 라이브 URL=`.env.production`. 릴리스 서명=`android/keystore.properties`(gitignore) |
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

## 탭 구조 (하단 4탭 + 스택 페이지)

- **홈**: 헤더(브랜드 마크·검색) · 오늘 요약 한 문장(+상대시각 갱신표시, 탭=새로고침) · 당겨서 새로고침 · 오프라인 배너 · 오늘 일정 · 내 모의청약(정산 가능 우선) · 관심 종목 · 공모주 일정(칩: 청약 중/청약 예정/상장 예정, 스팩은 접기) · 최근 상장 결과(→ 전체: 상승 비율·**중앙값**) · 수요 등급 안내 시트 · 면책 푸터.
- **일정**: 월간 캘린더(수요예측·청약 시작·마감·상장 점, 스와이프 달 이동, 지난 날 흐림) · 선택일 일정/없으면 다가오는 일정 5개 · 스팩 포함 스위치.
- **라운지(2.0 방치형 RPG)**: 전투 화면(캔버스 도트, 탭=추가 공격, 보스·지역 색 변주) · 능력치 강화(공격·방어·체력, ×1/×10/최대, 길게 눌러 연속) · 전투 보너스(시즌 자산 배율·카드 도감·투자 성향) · 투자자 등급(최고 스테이지) · 7일 출석 · 오늘의 퀘스트 · 투자 카드 뽑기. 첫 진입 소개 시트(1.x 등급 보상 골드 안내), 앱 복귀 시 방치 보상 시트.
- **MY**: 프로필(투자 성향 시트·칭호) · 시즌 자산(총액=가용+증거금, 손익%) · 적중률/살펴본 종목/연속 출석 · 컬렉션(공모주 도감·카드 도감·업적·칭호 시트) · 설정.
- **스택 페이지**(`nav.ts`, 오른쪽에서 진입·뒤로가기로 닫힘): 종목 상세(탭 「공모 정보」/「모의청약」, 관심★·공유, 용어 설명 시트) · 검색(초성·최근 검색어) · 설정(테마 3단·진동·새로고침·**시즌 초기화 확인**·문의·개인정보처리방침·**오픈소스 라이선스**) · 도감/업적 · 모의청약 내역 · 상장 결과.
- 오버레이: 정산 결과(단계 공개, 건너뛰기) · 카드 뽑기(플립/10연 그리드, NEW 표시) · 토스트(하단 스낵바).
- 용어: '모의청약'(구 '모의투자') · 수요 등급 **S/A/B/C**(=rarity legendary/epic/rare/common, 스팩은 '스팩') · 단계 표기 청약 중/청약 예정/상장 예정/상장 완료.

## 구조

```
scripts/  fetchIpos.mjs (하이브리드 오케스트레이터) · lib/ dart·kind·source38 · syncEmoji.mjs(3D 이모지 동기화)
src/
  data/   classes · ranks · relics(100종, UI명 '투자 카드') · quests · achievements · emojiSet(자동 생성)
          ipos.json(+public/ 런타임 서빙) · loadIpos(번들 폴백 + useIpos/useDataTimestamp/useDataStatus) · mockIpos
  lib/    calc(단계·가챠·등급/결과 메타) · format(날짜·금액·경쟁률 표기) · useToday · theme · usePullToRefresh · refresh
          juice(진동·콘페티·토스트) · native(스플래시·상태바·뒤로가기[웹 popstate 포함]·onResume) · backStack · share
  store.ts  zustand: setSubscription/cancelSubscription(증거금 에스크로)·settleReal·toggleWatch·recentSearches·setTheme·pullRelic(fresh)
  nav.ts    스택 페이지 라우팅(push/close, 닫힘 애니메이션 후 제거)
  ui/       디자인 시스템: Page·Sheet/Confirm·kit(StockLogo·StagePill·GradeChip·Segmented·ChipTabs·Switch·MenuRow·Progress·Empty·CountUp)·Emoji·Toast·TabScreen·icons
  screens/  Home · CalendarTab · Lounge · MyTab (하단 탭)
  pages/    IpoDetail · Search · Settings(+Licenses) · Collections(도감·카드도감·업적·모의청약 내역·상장 결과)
  sheets/   InfoSheets(수요 등급·용어·확률·등급 사다리) · ProfileSheets(투자 성향·칭호)
  overlays/ Overlays(정산 결과·카드 뽑기)
  components/ IpoRow(종목 행 공통) · TabBar
  styles/   tokens · base · components · screens · responsive (.css)
public/emoji/  Fluent Emoji 3D webp(코드에서 쓰는 것만, ~130개 · 약 0.7MB)
```

## 핵심 도메인 규칙 (반드시 준수)

1. **정보 만인 평등 · 순수 실력** — 시즌 자산엔 성향(클래스)·카드·RPG 영향 없음(배정·손익 순수). **방향은 단방향**: 게임(RPG)은 시즌 자산을 읽어 배율로만 씀(√(총자산÷1천만), 0.5–3배). 성향=RPG 전투 패시브, 카드=도감 보너스(전체 스탯 등급별 1/2/4/8%)+효과(xpMult→공격력%, goldMult→골드%).
2. **베팅** — 실전은 청약 중인 종목만. 다가오는은 정보 전용.
3. **등급** — 수요 중심(기관 수요예측·통합 청약경쟁률·의무보유확약) + 공모금액 보조 + 초대형 페널티, 스팩=common. 임의값 금지.
4. **가상청약 에스크로** — 시즌 자산(실력·시즌리셋) ≠ 골드(게임·영속). 청약 시 증거금(50%) 차감 → 상장 전 수정 시 차액 환불, **상장 당일 잠금**, 상장+1일 정산.
5. **투자자 등급 = 최고 돌파 스테이지** (2.0~, 경험치 레벨 대체) — 개미 0 · 불개미 20 · 슈퍼개미 50 · 큰손 100 · 슈퍼큰손 150 · 공모왕 200. `rankInfo(rpg.best)`. XP/level 필드는 저장만 유지(표시·판정 미사용).
7. **라운지 RPG 밸런스**(`src/game/balance.ts`, 시뮬레이션 튜닝: 스테이지 50≈15분·100≈1시간·150≈20시간·200≈수백 시간) — 몬스터 HP 40·1.12^(s-1)·ATK 6·1.11^(s-1)·골드 4·1.12^(s-1), 10의 배수=보스(HP×4·ATK×1.4·골드×8). 영웅 능력치 선형+10레벨마다 ×2, 강화비 ×1.13/레벨. 받는 피해=ATK²/(ATK+DEF). 패배→이전 스테이지 파밍, 자동 재도전 10마리. 방치 보상 최대 8시간·효율 50%(스테이지 진행 없음). **보상 스케일** `rewardScale(best)=1.12^(best-1)`을 출석·퀘스트·정산 골드·업적 골드·카드 뽑기 비용/중복 환불에 공통 적용.
6. **가상머니 전용** — 실거래 미실행.

## 메모 / 함정

- 단계는 `computeStage(ipo, 오늘)` 동적 계산. 상장 **D-day 이후**만 '상장 대기'에서 숨김.
- **런타임 데이터**: `useIpos()`(useSyncExternalStore) — 번들로 즉시 표시 후 `VITE_DATA_URL`‖`/ipos.json` fetch해 더 최신(`generatedAt`)이면 교체. 실패 시 번들 유지. `useDataTimestamp()`=갱신 시각.
- **게임 엔진**: `game/engine.ts` 앱 전역 루프(50ms, `document.hidden`이면 정지 → 복귀 시 `computeOffline`) · 렌더는 `game/Battle.tsx`(라운지 탭 활성일 때만 rAF) · 도트 원본 `game/sprites.ts`(16×16 자체 제작, 기사+몬스터 9종+보스) · 스토어 `rpg`(lv·stage·best·farming·lastSeen…), persist v4 migrate(1.x 레벨×150 골드 보상).
- **테마/디자인**: 새 색은 반드시 토큰 변수(`var(--surface)`, `var(--text-3)` …) — 하드코딩 금지(예외: 카드 뽑기 연출의 고정 다크 배경). 숫자는 `.num`(고정폭). 새 이모지를 코드에 쓰면 `npm run emoji`(없으면 시스템 글리프로 폴백). 페이지는 `nav.push({k:…})`, 시트는 조건부 렌더 `<Sheet onClose>`(내부에서 닫힘 애니메이션 후 onClose). 상태바 색=`lib/native.ts THEME_BG`(= `--bg`). **반응형**(`styles/responsive.css`): 600px~(펼친 폴드·태블릿) 전체 폭+탭 화면 좌우 2열(`ui/kit` `Cols`/`Col` — 폰에선 `display: contents`라 순서 그대로, 좌측 묶음→우측 묶음 순서=폰 순서가 되게 배치) · 탭 콘텐츠 최대 960px, 스택 페이지 본문 680px · `Col sticky`는 세로 600px 이상일 때만 · 360px 미만은 `--gutter` 16px.
- **투자 카드 가챠**(100종): 천장=미보유 확정, 등급별 확률 고정. 중복=스택 없이 골드 환불(최대 100G). 100종 완성 시 뽑기 잠금.
- **UI 용어**: 화면 표기는 '투자 성향'(코드 식별자는 `chosenClass`/`CLASSES`). 문구는 해요체·짧게(토스트 '…했어요').
- **스토어 persist v3**: v2→v3 migrate(`darkMode`→`theme`, 기존 사용자 테마 유지). 신규 필드 `watchlist`·`recentSearches`. persist 키 `ct-save-v6` 유지(사용자 데이터 보존).
- **알림 기능 제거됨**(새 공모주 푸시=Firebase 의존이라 제외). 진동 토글·데이터 새로고침으로 대체. `notify.ts` 없음.
- **데이터 파이프라인(2026-07 고도화)**: fetchIpos가 이전 ipos.json과 **머지** — ①id 영속화(이름 기준 기존 id 유지, n→k 전환 방지) ②필드 보존(38 이탈해도 수익률·지표 유지) ③아카이브(유니버스 밖: 상장완료+ticker 400일 · 상장예정/최근 7일 청약은 소스 일시실패 대비 보존, 최대300건) ④정합성 가드(상장일≤청약마감=모순→대체/null · 확정가는 확정플래그와 같은 소스에서 선택[래칫 방지] · 청약 시작·종료는 `pickSchedule`로 한 소스에서 쌍 선택+범위 5일 초과/역전 폐기[독립 폴백發 06/19~08/05 짬뽕 방지]) ⑤신규 필드 ticker·market(코스피/코스닥)·demandForecastDate ⑥데이터 무변경이면 파일 미기록(cron 노이즈 커밋 방지) ⑦DART 키 부재=호출 시점 실패(38+KIND 폴백 동작) ⑧38(source38.mjs) UA를 실브라우저 UA로 통일(구 자체식별 UA `ttasangroad/…`가 38.co.kr 차단 유발 의심 — GH Actions에서만 며칠간 조용히 실패, "머지로 이전값 보존"과 맞물려 결과가 매번 동일해 "변경없음"으로 굳어버림. KIND는 애초 정상 UA라 안 걸림) ⑨38 o=nw·o=k 둘 다 0건이면 명시적 throw(부분실패는 기존처럼 graceful, 완전실패만 CI를 실패로 표시해 조용한 장기 정체 방지). `npm run build`의 prebuild가 데이터 자동 갱신(실패해도 soft-fail). 2회 실행 멱등 검증됨. **2026-10-13 확인: UA 수정 후 cron 정상 복구**(최신 데이터 10/12·57건, 149커밋 연속).
- **백그라운드 복귀 갱신**: native resume + visibilitychange 양쪽에서 refreshIpos() (generatedAt 가드로 중복 무해).
- **네이티브(모바일)**: `lib/native.ts`(스플래시·상태바·뒤로가기), `lib/backStack.ts`(오버레이는 `useBackClose(onClose)`로 등록 → 뒤로가기가 위에서부터 닫음). 모든 네이티브 호출은 `Capacitor.isNativePlatform()`+try/catch 가드(웹=no-op).
- **릴리스 빌드**: `gradlew bundleRelease` → 서명 AAB(출시본 vc12·1.0.0 → **2.0.0 / vc14 빌드 완료(2026-10-13, 반응형 포함·업로드 대기)**, 다음은 vc15 · 앱 내 표기 `pages/Settings.tsx APP_VERSION`과 일치시킬 것 · R8 minify on). 산출물=`GooglePlay 산출물/ipohero-v2.0.0-vc14.aab`(+mapping, gitignore). 키=`android/app/release.keystore`+`keystore.properties`(gitignore, **백업 필수**, pw=`../_myToken_.md`). **android/는 gitignore → 재생성·클라우드용 커스텀 사본·설정값·복원 순서는 [`native-patches/README.md`](native-patches/README.md)** (커스텀 `NavigationBarAppearancePlugin`·`MainActivity`·proguard 포함).
- 에뮬레이터 검증 완료(아이콘·뒤로가기·테마·데이터).
- **경로**: 2026-06 OneDrive→로컬 이전 `~/Desktop/JH/Eous/IPO-hero`(`JH/Eous/` 구조째 이동 → `../eous-landing`·`../_myToken_.md` 유효). 기존 OneDrive 동기화발 Vite 워처 누락 문제는 해소됨.

## 클라우드 세션 메모 (2026-10-13 이전 준비)

- 클라우드는 GitHub 클론만 보임 → **로컬 전용**: `android/`(키스토어·SDK), `OpenAPIkey.txt`·`cloudflare-token.txt`, `GooglePlay 산출물/`, `../_myToken_.md`, `../eous-landing/`(git repo 아님).
- 클라우드에서 가능: 웹 UI·데이터 스크립트(`DART_API_KEY`=GitHub Secret)·tsc/build·문서. **AAB 서명 빌드·실기기 검증은 로컬 PC에서만**.
- 데이터 파일(`public/ipos.json`·`src/data/ipos.json`)은 cron이 계속 커밋 → 작업 전 `git pull --rebase`, 충돌 시 원격본 채택 후 `npm run data`로 재생성.
- 커밋 메시지는 한국어, 푸시는 묶어서(글로벌 규칙).

## 관련 (별도 폴더/세션)

- **랜딩페이지**: `../eous-landing/` → **app.eous.cc**(Cloudflare Pages). 여러 앱 허브. 공모주 히어로 카드 포함. 자체 CLAUDE_CONTEXT.md 있음.
- **CF/시크릿**: 개인 CF 토큰=`cloudflare-token.txt`(gitignore). 전체 토큰 금고=`../_myToken_.md`.

## 추후

**Play Store 출시 완료**(사용자 확인 2026-10-13, appId `cc.eous.ipohero`). 이후 업데이트는 versionCode를 12 초과로 +1 하고 versionName은 사용자와 정하며(출시 전 1.0.0 고정 규칙은 해제), 업로드용 mapping 함께 제출. 방침=PRIVACY.md·`app.eous.cc/ipo-hero-privacy`. · **증권사별 배정 비교**(증권사별 실시간 경쟁률 소스 미확보 → 보류) · Pretendard는 이미 번들 · 시즌 랭킹(백엔드)
