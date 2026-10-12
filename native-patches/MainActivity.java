package cc.eous.ipohero;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NavigationBarAppearancePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
