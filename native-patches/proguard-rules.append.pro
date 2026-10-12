# === Capacitor / WebView R8(난독화) 안전 규칙 ===
# 크래시 스택트레이스 라인 번호 보존 (mapping.txt 해독 시 유용)
-keepattributes SourceFile,LineNumberTable

# WebView의 JavaScript 인터페이스 메서드 보호
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor 코어·플러그인 보호 (리플렉션 사용 — 공식 플러그인 규칙 보강)
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public <methods>;
}
