package com.flightscreen.tv;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final String PREFS_NAME = "flightscreen_tv_prefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String BUNDLED_ASSET_URL = "file:///android_asset/index.html";

    private WebView webView;
    private View errorLayout;
    private TextView errorDetail;
    private View remoteHint;
    private SharedPreferences prefs;

    private long lastBackPressTime = 0;
    private long centerKeyDownTime = 0;
    private boolean centerLongPressTriggered = false;
    private boolean isToolbarMode = false;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private final Runnable centerLongPressRunnable = new Runnable() {
        @Override
        public void run() {
            centerLongPressTriggered = true;
            if (!isToolbarMode) {
                enterToolbarMode();
            } else {
                exitToolbarMode();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Desk Monitor Mode: Keep the TV screen persistently awake without timing out
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        webView = findViewById(R.id.web_view);
        errorLayout = findViewById(R.id.error_layout);
        errorDetail = findViewById(R.id.error_detail);
        remoteHint = findViewById(R.id.remote_hint);

        Button btnRetry = findViewById(R.id.btn_retry);
        Button btnConfig = findViewById(R.id.btn_config_url);

        btnRetry.setOnClickListener(v -> reloadCurrentUrl());
        btnConfig.setOnClickListener(v -> showServerUrlDialog());

        setupWebView();
        applyFullscreen();

        // Fade out hint banner after 7 seconds
        mainHandler.postDelayed(() -> {
            if (remoteHint != null) {
                remoteHint.animate().alpha(0f).setDuration(1200).withEndAction(() -> remoteHint.setVisibility(View.GONE));
            }
        }, 7000);

        loadConfiguredUrl();
    }

    private void applyFullscreen() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyFullscreen();
        }
    }

    private void setupWebView() {
        // Hardware acceleration layer for smooth Leaflet rendering & rotation
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        // Allows local HTML in assets to directly fetch live ADS-B without CORS restrictions
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " FlightScreenTV/1.0 (Chromecast)");

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                errorLayout.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    showError("Unable to connect to: " + request.getUrl().toString());
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                isToolbarMode = false;
                injectRemoteBridgeScript();
            }
        });
    }

    private void loadConfiguredUrl() {
        String savedUrl = prefs.getString(KEY_SERVER_URL, null);
        if (!TextUtils.isEmpty(savedUrl)) {
            webView.loadUrl(savedUrl.trim());
        } else {
            // Default: Bundled Standalone Live TV Radar with Dark OSM map
            webView.loadUrl(BUNDLED_ASSET_URL);
        }
    }

    private void reloadCurrentUrl() {
        errorLayout.setVisibility(View.GONE);
        loadConfiguredUrl();
    }

    private void showError(String message) {
        if (errorLayout != null) {
            errorLayout.setVisibility(View.VISIBLE);
            if (errorDetail != null) {
                errorDetail.setText(message);
            }
        }
    }

    private void injectRemoteBridgeScript() {
        String js = "(function() {" +
                "  if (!window._tvInjected) {" +
                "    window._tvInjected = true;" +
                "    console.log('[FlightScreenTV] Remote bridge active');" +
                "  }" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    private void panRadar(int dx, int dy) {
        String js = "(function() {" +
                "  if (window.tvBridge && typeof window.tvBridge.pan === 'function') {" +
                "    window.tvBridge.pan(" + dx + ", " + dy + ");" +
                "  } else if (window._leafletMap && typeof window._leafletMap.panBy === 'function') {" +
                "    window._leafletMap.panBy([" + dx + ", " + dy + "]);" +
                "  } else {" +
                "    window.scrollBy(" + dx + ", " + dy + ");" +
                "  }" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    private void snapHome() {
        String js = "(function() {" +
                "  if (window.tvBridge && typeof window.tvBridge.snapHome === 'function') {" +
                "    window.tvBridge.snapHome();" +
                "  } else {" +
                "    var b = document.querySelector('[data-home]') || document.querySelector('button[title*=\"home\" i]');" +
                "    if (b) b.click();" +
                "  }" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    private void selectAircraftOrTarget() {
        webView.evaluateJavascript("window.tvBridge && window.tvBridge.selectNext && window.tvBridge.selectNext();", null);
    }

    private void zoomIn() {
        webView.evaluateJavascript("window.tvBridge && window.tvBridge.zoomIn && window.tvBridge.zoomIn();", null);
    }

    private void zoomOut() {
        webView.evaluateJavascript("window.tvBridge && window.tvBridge.zoomOut && window.tvBridge.zoomOut();", null);
    }

    private void toggleMapStyle() {
        webView.evaluateJavascript("window.tvBridge && window.tvBridge.toggleMap && window.tvBridge.toggleMap();", null);
    }

    private void cyclePresetStation() {
        webView.evaluateJavascript("window.tvBridge && window.tvBridge.cycleStation && window.tvBridge.cycleStation();", null);
    }

    private void deselectActive() {
        String js = "(function() {" +
                "  if (window.tvBridge && typeof window.tvBridge.deselect === 'function') {" +
                "    window.tvBridge.deselect();" +
                "  } else {" +
                "    var escEvt = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true });" +
                "    document.dispatchEvent(escEvt);" +
                "  }" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    private void enterToolbarMode() {
        isToolbarMode = true;
        webView.evaluateJavascript("window.tvBridge && window.tvBridge.enterToolbarMode && window.tvBridge.enterToolbarMode();", null);
    }

    private void exitToolbarMode() {
        isToolbarMode = false;
        webView.evaluateJavascript("window.tvBridge && window.tvBridge.exitToolbarMode && window.tvBridge.exitToolbarMode();", null);
    }

    private void navigateToolbar(int dir) {
        webView.evaluateJavascript("window.tvBridge && window.tvBridge.navigateToolbar && window.tvBridge.navigateToolbar(" + dir + ");", null);
    }

    private void clickToolbarFocused() {
        webView.evaluateJavascript("window.tvBridge && window.tvBridge.clickFocused && window.tvBridge.clickFocused();", null);
    }

    public void showServerUrlDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert);
        LayoutInflater inflater = LayoutInflater.from(this);
        View dialogView = inflater.inflate(R.layout.dialog_server_url, null);
        builder.setView(dialogView);

        EditText editUrl = dialogView.findViewById(R.id.edit_server_url);
        String currentUrl = prefs.getString(KEY_SERVER_URL, "");
        if (!TextUtils.isEmpty(currentUrl)) {
            editUrl.setText(currentUrl);
        }

        builder.setPositiveButton(R.string.btn_save, (dialog, which) -> {
            String input = editUrl.getText().toString().trim();
            if (!TextUtils.isEmpty(input)) {
                if (!input.startsWith("http://") && !input.startsWith("https://")) {
                    input = "http://" + input;
                }
                prefs.edit().putString(KEY_SERVER_URL, input).apply();
                webView.loadUrl(input);
                Toast.makeText(MainActivity.this, "Connecting to: " + input, Toast.LENGTH_SHORT).show();
            }
        });

        builder.setNeutralButton(R.string.btn_reset_demo, (dialog, which) -> {
            prefs.edit().remove(KEY_SERVER_URL).apply();
            webView.loadUrl(BUNDLED_ASSET_URL);
            Toast.makeText(MainActivity.this, "Loaded Standalone Live TV Radar", Toast.LENGTH_SHORT).show();
        });

        builder.setNegativeButton(R.string.btn_cancel, null);

        AlertDialog dialog = builder.create();
        dialog.show();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        int action = event.getAction();

        if (action == KeyEvent.ACTION_DOWN) {
            switch (keyCode) {
                case KeyEvent.KEYCODE_DPAD_UP:
                    if (isToolbarMode) {
                        exitToolbarMode();
                    } else {
                        panRadar(0, -110);
                    }
                    return true;

                case KeyEvent.KEYCODE_DPAD_DOWN:
                    if (!isToolbarMode) {
                        panRadar(0, 110);
                    }
                    return true;

                case KeyEvent.KEYCODE_DPAD_LEFT:
                    if (isToolbarMode) {
                        navigateToolbar(-1);
                    } else {
                        panRadar(-110, 0);
                    }
                    return true;

                case KeyEvent.KEYCODE_DPAD_RIGHT:
                    if (isToolbarMode) {
                        navigateToolbar(1);
                    } else {
                        panRadar(110, 0);
                    }
                    return true;

                case KeyEvent.KEYCODE_DPAD_CENTER:
                case KeyEvent.KEYCODE_ENTER:
                    if (event.getRepeatCount() == 0) {
                        event.startTracking();
                        centerKeyDownTime = System.currentTimeMillis();
                        centerLongPressTriggered = false;
                        mainHandler.removeCallbacks(centerLongPressRunnable);
                        mainHandler.postDelayed(centerLongPressRunnable, 400);
                    } else if (!centerLongPressTriggered && (event.isLongPress() || (System.currentTimeMillis() - centerKeyDownTime >= 380))) {
                        centerLongPressTriggered = true;
                        mainHandler.removeCallbacks(centerLongPressRunnable);
                        if (!isToolbarMode) {
                            enterToolbarMode();
                        } else {
                            exitToolbarMode();
                        }
                    }
                    return true;

                // Mute button on remotes that support passing KEYCODE_MUTE / KEYCODE_VOLUME_MUTE
                case KeyEvent.KEYCODE_VOLUME_MUTE:
                case KeyEvent.KEYCODE_MUTE:
                    toggleMapStyle();
                    Toast.makeText(this, "Toggled Map Style", Toast.LENGTH_SHORT).show();
                    return true;

                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                case KeyEvent.KEYCODE_MEDIA_PLAY:
                case KeyEvent.KEYCODE_MEDIA_PAUSE:
                    snapHome();
                    return true;

                case KeyEvent.KEYCODE_MENU:
                case KeyEvent.KEYCODE_INFO:
                case KeyEvent.KEYCODE_SETTINGS:
                    showServerUrlDialog();
                    return true;

                case KeyEvent.KEYCODE_GUIDE:
                case KeyEvent.KEYCODE_CHANNEL_UP:
                    cyclePresetStation();
                    return true;

                case KeyEvent.KEYCODE_BACK:
                    if (errorLayout.getVisibility() == View.VISIBLE) {
                        errorLayout.setVisibility(View.GONE);
                        webView.loadUrl(BUNDLED_ASSET_URL);
                        return true;
                    }
                    if (isToolbarMode) {
                        exitToolbarMode();
                        return true;
                    }
                    deselectActive();
                    long now = System.currentTimeMillis();
                    if (now - lastBackPressTime < 2000) {
                        finish();
                    } else {
                        lastBackPressTime = now;
                        Toast.makeText(this, "Press BACK again to exit", Toast.LENGTH_SHORT).show();
                    }
                    return true;
            }
        } else if (action == KeyEvent.ACTION_UP) {
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
                mainHandler.removeCallbacks(centerLongPressRunnable);
                if (!centerLongPressTriggered && (event.getFlags() & KeyEvent.FLAG_CANCELED_LONG_PRESS) == 0) {
                    if (isToolbarMode) {
                        clickToolbarFocused();
                    } else {
                        selectAircraftOrTarget();
                    }
                }
                return true;
            } else if (keyCode == KeyEvent.KEYCODE_BACK) {
                return true;
            }
        }

        return super.dispatchKeyEvent(event);
    }

    @Override
    public boolean onKeyLongPress(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
            if (!centerLongPressTriggered) {
                mainHandler.removeCallbacks(centerLongPressRunnable);
                centerLongPressTriggered = true;
                if (!isToolbarMode) {
                    enterToolbarMode();
                } else {
                    exitToolbarMode();
                }
            }
            return true;
        }
        return super.onKeyLongPress(keyCode, event);
    }
}
