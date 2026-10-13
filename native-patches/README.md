# android/ 커스텀 사본 (네이티브 복원용)

`android/`는 gitignore(`npx cap add android`로 생성)라 클라우드 세션·새 PC에는 없다.
**여기 있는 파일이 "생성 직후 덮어써야 하는" 커스텀 전부.** (시크릿 없음 — 키스토어·비밀번호는 절대 커밋 금지)

## 복원 순서
1. `npm install && npm run build && npx cap add android`
2. 이 폴더의 파일을 복사
   - `NavigationBarAppearancePlugin.java`, `MainActivity.java` → `android/app/src/main/java/cc/eous/ipohero/`
   - `proguard-rules.append.pro` 내용을 `android/app/proguard-rules.pro` 끝에 추가
3. 빌드 설정 재적용 (아래 표)
4. `npx @capacitor/assets generate --android` (아이콘·스플래시, 소스=`assets/`)
5. 서명 설정(로컬 전용) → `npx cap sync android` → `android\gradlew.bat -p android bundleRelease`

## 빌드 설정값 (재적용 대상)
| 파일 | 값 |
|---|---|
| `android/variables.gradle` | minSdk 24(Play 자동 보호 요건) · compileSdk 36 · targetSdk 36 |
| `android/build.gradle` | AGP `com.android.tools.build:gradle:8.9.1` |
| `android/gradle/wrapper/gradle-wrapper.properties` | `gradle-8.11.1-all.zip` |
| `android/app/build.gradle` defaultConfig | applicationId `cc.eous.ipohero` · versionName `2.0.0`(2.0 대규모 업데이트 — 웹 `APP_VERSION`과 동일) · **versionCode는 빌드마다 +1(출시본 12 → 현재 빌드 14)** |
| `android/app/build.gradle` buildTypes.release | `minifyEnabled true` + `proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'` |
| JDK | 17 |

## 서명 (로컬 전용 — 클라우드에서 불가)
- `android/app/build.gradle` 상단에서 `rootProject.file("keystore.properties")`를 읽고 `signingConfigs.release`에 `storeFile`/`storePassword`/`keyAlias`/`keyPassword`를 연결, release 빌드에 `signingConfig signingConfigs.release` 지정.
- `android/keystore.properties` 키 4개: `storeFile`(=`release.keystore`) · `storePassword` · `keyAlias`(=`ipohero`) · `keyPassword`. 값은 `../_myToken_.md` 참고.
- 키스토어 `android/app/release.keystore`는 **분실 시 업데이트 불가 — 별도 백업 필수**.

## 커스텀 네이티브 플러그인이 하는 일
`NavigationBarAppearancePlugin`(JS 이름 `NavigationBarAppearance`)은 하단 시스템 네비게이션 바 아이콘 밝기를 앱 테마(라이트/다크)에 맞춘다. `@capacitor/status-bar`는 상태바만 제어하기 때문. JS 쪽은 `src/lib/native.ts`의 `applyStatusBar()`에서 호출한다. `MainActivity`는 **`super.onCreate()` 이전에** `registerPlugin(...)`을 호출해야 한다.

## 클라우드 세션 제약
- 가능: 웹 앱(`npm run dev/build`) · 데이터 스크립트(`npm run data`, 키는 GitHub Secret `DART_API_KEY`) · tsc · 문서 · git.
- 불가(로컬 PC 전용): AAB 서명 빌드(키스토어·Android SDK/JDK17), 실기기·에뮬레이터 검증, `GooglePlay 산출물/`(gitignore).
