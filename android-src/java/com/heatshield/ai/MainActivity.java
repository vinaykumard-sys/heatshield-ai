package com.heatshield.ai;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.InputStream;

public class MainActivity extends Activity {

    private static final int PERMISSION_REQUEST_LOCATION = 1001;
    private static final String APP_URL = "file:///android_asset/www/index.html";
    private static final String FALLBACK_URL = "file:///android_asset/www/index.html";
    private static final int SPLASH_TIMEOUT_MS = 2500;

    private WebView mWebView;
    private FrameLayout mContainer;
    private LinearLayout mSplashLayout;
    private GeolocationPermissions.Callback mGeoCallback;
    private String mGeoOrigin;
    private long mLastBackPressTime = 0;
    private final Handler mSplashHandler = new Handler(Looper.getMainLooper());
    private final Runnable mSplashWatchdog = new Runnable() {
        @Override
        public void run() {
            dismissSplash();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Hardware acceleration enabled
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        // Immersive status and navigation bar styling
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#060D1E"));
            window.setNavigationBarColor(Color.parseColor("#060D1E"));
        }

        // Root container
        mContainer = new FrameLayout(this);
        mContainer.setBackgroundColor(Color.parseColor("#060D1E"));
        setContentView(mContainer, new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // Initialize WebView
        initWebView();

        // Build Splash screen
        createSplashScreen();

        // Load application or process initial deep link redirect
        if (getIntent() != null && getIntent().getData() != null) {
            handleDeepLink(getIntent());
        } else {
            mWebView.loadUrl(APP_URL);
        }

        // Check runtime location permission upfront for smooth UX
        requestLocationPermissionsIfNeeded();
    }

    private void initWebView() {
        mWebView = new WebView(this);
        mWebView.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        mWebView.setBackgroundColor(Color.parseColor("#060D1E"));
        mWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
        }

        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Dynamically obtain package version information from AndroidManifest
        String currentVersionName = "1.6.0";
        int currentVersionCode = 10;
        try {
            android.content.pm.PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            if (pInfo.versionName != null && pInfo.versionName.trim().length() > 0) {
                currentVersionName = pInfo.versionName.trim();
            }
            currentVersionCode = pInfo.versionCode;
        } catch (Exception ignored) {}
        final String finalVersionName = currentVersionName;
        final int finalVersionCode = currentVersionCode;

        // Expose synchronous Native Bridge Interface for immediate version detection
        mWebView.addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public String getVersion() { return finalVersionName; }
            @android.webkit.JavascriptInterface
            public int getVersionCode() { return finalVersionCode; }
            @android.webkit.JavascriptInterface
            public boolean isNative() { return true; }
        }, "HeatShieldNative");

        // Custom User-Agent suffix for HeatShield AI Native App
        String defaultUA = settings.getUserAgentString();
        settings.setUserAgentString((defaultUA != null ? defaultUA : "") + " HeatShieldApp/" + finalVersionName + " (Android; versionCode " + finalVersionCode + ")");

        // Set DownloadListener to handle downloads via system intent
        mWebView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setData(Uri.parse(url));
                startActivity(i);
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "Opening download...", Toast.LENGTH_SHORT).show();
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                mGeoOrigin = origin;
                mGeoCallback = callback;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                        requestPermissions(
                            new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                            PERMISSION_REQUEST_LOCATION
                        );
                        return;
                    }
                }
                callback.invoke(origin, true, true);
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress >= 90) {
                    dismissSplash();
                }
            }

            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                android.util.Log.d("HeatShieldJS", (consoleMessage.message() != null ? consoleMessage.message() : "") + " -- line " + consoleMessage.lineNumber());
                return true;
            }
        });

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url == null) return false;

                // Handle APK or /downloads/ URL downloads via system intent
                if (url.endsWith(".apk") || url.contains("/downloads/")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setData(Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Opening download...", Toast.LENGTH_SHORT).show();
                        return false;
                    }
                }

                // Handle OAuth / external authentication providers in system browser
                // Google explicitly blocks internal WebViews with 403 (disallowed_useragent)
                if (isOAuthOrExternalAuthUrl(url)) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        intent.addCategory(Intent.CATEGORY_BROWSABLE);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Opening external browser...", Toast.LENGTH_SHORT).show();
                        return true;
                    }
                }

                // Handle phone dialing (tel:)
                if (url.startsWith("tel:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            startActivity(intent);
                            return true;
                        } catch (Exception ex) {
                            Toast.makeText(MainActivity.this, "Calling unavailable", Toast.LENGTH_SHORT).show();
                            return true;
                        }
                    }
                }

                // Handle map coordinate views (geo:)
                if (url.startsWith("geo:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Map application not found", Toast.LENGTH_SHORT).show();
                        return true;
                    }
                }

                // Handle email composition (mailto:)
                if (url.startsWith("mailto:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_SENDTO, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }

                // Handle SMS (sms:)
                if (url.startsWith("sms:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }

                if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) {
                    return false;
                }

                // Handle external intent schemes: whatsapp:, intent:, etc.
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && request != null && request.getUrl() != null) {
                    return shouldOverrideUrlLoading(view, request.getUrl().toString());
                }
                return super.shouldOverrideUrlLoading(view, request);
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && request != null && request.getUrl() != null) {
                    Uri uri = request.getUrl();
                    String path = uri.getPath();
                    if (path != null) {
                        String cleanPath = path;
                        if (cleanPath.startsWith("/android_asset/www/")) {
                            cleanPath = cleanPath.substring("/android_asset/www/".length());
                        } else if (cleanPath.startsWith("/android_asset/")) {
                            cleanPath = cleanPath.substring("/android_asset/".length());
                        } else if (cleanPath.startsWith("/")) {
                            cleanPath = cleanPath.substring(1);
                        }
                        if (cleanPath.startsWith("_expo/") || cleanPath.startsWith("assets/") || cleanPath.equals("favicon.ico") || cleanPath.equals("manifest.json") || cleanPath.equals("index.html")) {
                            try {
                                String assetPath = "www/" + cleanPath;
                                InputStream is = getAssets().open(assetPath);
                                String mime = "application/octet-stream";
                                if (cleanPath.endsWith(".js")) mime = "application/javascript";
                                else if (cleanPath.endsWith(".css")) mime = "text/css";
                                else if (cleanPath.endsWith(".png")) mime = "image/png";
                                else if (cleanPath.endsWith(".svg")) mime = "image/svg+xml";
                                else if (cleanPath.endsWith(".json")) mime = "application/json";
                                else if (cleanPath.endsWith(".ttf")) mime = "font/ttf";
                                else if (cleanPath.endsWith(".html")) mime = "text/html";
                                return new WebResourceResponse(mime, "UTF-8", is);
                            } catch (Exception ignored) {}
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                view.evaluateJavascript(
                    "window.__HEATSHIELD_NATIVE_APP__ = true; " +
                    "window.__HEATSHIELD_NATIVE_VERSION__ = '" + finalVersionName + "'; " +
                    "window.__HEATSHIELD_NATIVE_VERSION_CODE__ = " + finalVersionCode + ";",
                    null
                );
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript(
                    "window.__HEATSHIELD_NATIVE_APP__ = true; " +
                    "window.__HEATSHIELD_NATIVE_VERSION__ = '" + finalVersionName + "'; " +
                    "window.__HEATSHIELD_NATIVE_VERSION_CODE__ = " + finalVersionCode + ";",
                    null
                );
                dismissSplash();
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                dismissSplash();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && request != null && request.isForMainFrame()) {
                    dismissSplash();
                }
            }
        });

        mContainer.addView(mWebView);
    }

    private void createSplashScreen() {
        mSplashLayout = new LinearLayout(this);
        mSplashLayout.setOrientation(LinearLayout.VERTICAL);
        mSplashLayout.setGravity(Gravity.CENTER);
        mSplashLayout.setBackgroundColor(Color.parseColor("#060D1E"));
        mSplashLayout.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // Brand Title
        TextView titleView = new TextView(this);
        titleView.setText("HEATSHIELD AI");
        titleView.setTextColor(Color.WHITE);
        titleView.setTextSize(26);
        titleView.setGravity(Gravity.CENTER);
        titleView.setTypeface(null, android.graphics.Typeface.BOLD);
        titleView.setLetterSpacing(0.08f);
        mSplashLayout.addView(titleView);

        // Subtitle
        TextView subView = new TextView(this);
        subView.setText("Smart Urban Heat Safety & Resilience");
        subView.setTextColor(Color.parseColor("#38BDF8"));
        subView.setTextSize(13);
        subView.setGravity(Gravity.CENTER);
        subView.setPadding(0, 10, 0, 36);
        mSplashLayout.addView(subView);

        // Indeterminate progress bar
        ProgressBar spinner = new ProgressBar(this);
        mSplashLayout.addView(spinner);

        mContainer.addView(mSplashLayout);

        // Failsafe watchdog timer (max 2500ms) to guarantee dismissSplash() runs even if WebView events fail
        mSplashHandler.postDelayed(mSplashWatchdog, SPLASH_TIMEOUT_MS);
    }

    private void dismissSplash() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (mSplashHandler != null && mSplashWatchdog != null) {
                    mSplashHandler.removeCallbacks(mSplashWatchdog);
                }
                if (isFinishing()) return;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1 && isDestroyed()) return;

                if (mSplashLayout != null && mSplashLayout.getVisibility() == View.VISIBLE) {
                    AlphaAnimation fadeOut = new AlphaAnimation(1.0f, 0.0f);
                    fadeOut.setDuration(400);
                    fadeOut.setAnimationListener(new Animation.AnimationListener() {
                        @Override
                        public void onAnimationStart(Animation animation) {}

                        @Override
                        public void onAnimationEnd(Animation animation) {
                            if (mSplashLayout != null) {
                                mSplashLayout.setVisibility(View.GONE);
                                mContainer.removeView(mSplashLayout);
                                mSplashLayout = null;
                            }
                        }

                        @Override
                        public void onAnimationRepeat(Animation animation) {}
                    });
                    mSplashLayout.startAnimation(fadeOut);
                }
            }
        });
    }

    private void requestLocationPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                    PERMISSION_REQUEST_LOCATION
                );
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_LOCATION) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (mGeoCallback != null && mGeoOrigin != null) {
                mGeoCallback.invoke(mGeoOrigin, granted, true);
                mGeoCallback = null;
                mGeoOrigin = null;
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
            return;
        }

        long currentTime = System.currentTimeMillis();
        if (currentTime - mLastBackPressTime < 2000) {
            super.onBackPressed();
        } else {
            mLastBackPressTime = currentTime;
            Toast.makeText(this, "Press back again to exit HeatShield AI", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mWebView != null) {
            mWebView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) {
            mWebView.onPause();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    /**
     * Detects OAuth authentication URLs and identity provider authorization endpoints.
     * These must be launched in the default system browser rather than inside an internal WebView.
     */
    private boolean isOAuthOrExternalAuthUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.contains("accounts.google.com")
            || lower.contains("supabase.co/auth/v1/authorize")
            || lower.contains("/auth/v1/authorize")
            || lower.contains("accounts.youtube.com")
            || lower.contains("appleid.apple.com")
            || lower.contains("github.com/login/oauth");
    }

    /**
     * Intercepts deep link intents (e.g. 'heatshield://' scheme or '/auth/callback' host links)
     * and forwards the authentication parameters, tokens, or codes to mWebView.
     */
    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        Uri uri = intent.getData();
        if (uri == null) return;

        String scheme = uri.getScheme();
        String host = uri.getHost();
        String path = uri.getPath();

        // 1. Custom scheme: heatshield:// (e.g. heatshield://auth/callback?code=... or heatshield://callback...)
        if ("heatshield".equalsIgnoreCase(scheme)) {
            String query = uri.getEncodedQuery();
            String fragment = uri.getEncodedFragment();
            StringBuilder redirectUrl = new StringBuilder("file:///android_asset/www/index.html");
            if (query != null && !query.isEmpty()) {
                redirectUrl.append("?").append(query);
            }
            if (fragment != null && !fragment.isEmpty()) {
                redirectUrl.append("#").append(fragment);
            }

            if (mWebView != null) {
                mWebView.loadUrl(redirectUrl.toString());
            }
            dismissSplash();
            return;
        }

        // 2. Web callback: https://heatshield-ai-eight.vercel.app/auth/callback
        if ("https".equalsIgnoreCase(scheme) && "heatshield-ai-eight.vercel.app".equalsIgnoreCase(host) && path != null && path.contains("/auth/callback")) {
            String query = uri.getEncodedQuery();
            String fragment = uri.getEncodedFragment();
            StringBuilder redirectUrl = new StringBuilder("file:///android_asset/www/index.html");
            if (query != null && !query.isEmpty()) {
                redirectUrl.append("?").append(query);
            }
            if (fragment != null && !fragment.isEmpty()) {
                redirectUrl.append("#").append(fragment);
            }

            if (mWebView != null) {
                mWebView.loadUrl(redirectUrl.toString());
            }
            dismissSplash();
            return;
        }

        // 3. Fallback for other app URLs within domain
        if (uri.toString().startsWith("https://heatshield-ai-eight.vercel.app")) {
            if (mWebView != null) {
                mWebView.loadUrl(uri.toString());
            }
            dismissSplash();
        }
    }

    @Override
    protected void onDestroy() {
        if (mSplashHandler != null && mSplashWatchdog != null) {
            mSplashHandler.removeCallbacks(mSplashWatchdog);
        }
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }
}
