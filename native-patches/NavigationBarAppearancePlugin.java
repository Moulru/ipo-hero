package cc.eous.ipohero;

import android.view.View;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// 하단 시스템 네비게이션 바(뒤로가기·홈·최근앱) 아이콘 색상 제어.
// @capacitor/status-bar는 상태바만 다루고 네비게이션 바는 건드리지 않아 자체 추가.
@CapacitorPlugin(name = "NavigationBarAppearance")
public class NavigationBarAppearancePlugin extends Plugin {

    @PluginMethod
    public void setLight(PluginCall call) {
        boolean light = call.getBoolean("light", true);
        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            View decorView = window.getDecorView();
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
            controller.setAppearanceLightNavigationBars(light);
        });
        call.resolve();
    }
}
