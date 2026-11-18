package app.maxfit.tracker;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // MaxFit's own plugin (update, save, share) must be registered before the bridge starts.
        registerPlugin(MaxFitNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
