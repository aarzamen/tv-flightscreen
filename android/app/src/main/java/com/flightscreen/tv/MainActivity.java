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
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

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
                injectRemoteBridgeScript();
            }
        });
    }

    private void loadConfiguredUrl() {
        String savedUrl = prefs.getString(KEY_SERVER_URL, null);
        if (!TextUtils.isEmpty(savedUrl)) {
            webView.loadUrl(savedUrl.trim());
        } else {
            // Default: Bundled Standalone Live TV Radar (direct Wi-Fi, no computer needed!)
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
        String js = "(function() {" +
                "  if (window.tvBridge && typeof window.tvBridge.selectNext === 'function') {" +
                "    window.tvBridge.selectNext();" +
                "  } else {" +
                "    var target = document.activeElement;" +
                "    if (target && typeof target.click === 'function') target.click();" +
                "  }" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    private void cyclePresetStation() {
        String js = "(function() {" +
                "  if (window.tvBridge && typeof window.tvBridge.cycleStation === 'function') {" +
                "    window.tvBridge.cycleStation();" +
                "  }" +
                "})();";
        webView.evaluateJavascript(js, null);
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
                    panRadar(0, -90);
                    return true;
                case KeyEvent.KEYCODE_DPAD_DOWN:
                    panRadar(0, 90);
                    return true;
                case KeyEvent.KEYCODE_DPAD_LEFT:
                    panRadar(-90, 0);
                    return true;
                case KeyEvent.KEYCODE_DPAD_RIGHT:
                    panRadar(90, 0);
                    return true;

                case KeyEvent.KEYCODE_DPAD_CENTER:
                case KeyEvent.KEYCODE_ENTER:
                    selectAircraftOrTarget();
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
        }

        return super.dispatchKeyEvent(event);
    }
}
