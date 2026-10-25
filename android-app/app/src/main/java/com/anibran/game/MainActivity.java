package com.anibran.game;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;

public final class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(21, 22, 43));
        getWindow().setNavigationBarColor(Color.rgb(21, 22, 43));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(245, 246, 251));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);\n        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if (host != null && (
                        host.equalsIgnoreCase("wa.me") ||
                        host.equalsIgnoreCase("api.whatsapp.com") ||
                        host.equalsIgnoreCase("whatsapp.com") ||
                        host.equalsIgnoreCase("www.whatsapp.com") ||
                        host.equalsIgnoreCase("instagram.com") ||
                        host.equalsIgnoreCase("www.instagram.com"))) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                        return true;
                    } catch (ActivityNotFoundException exception) {
                        return false;
                    }
                }
                return false;
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        setContentView(webView);

        if (savedInstanceState == null) {
            webView.loadUrl("file:///android_asset/www/index.html");
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) {
            webView.saveState(outState);
        }
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        if (webView.canGoBack()) {
            webView.goBack();
            return;
        }
        webView.evaluateJavascript(
            "(function(){var s=document.getElementById('game-screen');" +
            "if(s && !s.hidden){var b=s.querySelector('[data-action=\"home\"]');" +
            "if(b){b.click();return 'home';}}return 'exit';})()",
            value -> {
                if ("\"exit\"".equals(value)) {
                    MainActivity.super.onBackPressed();
                }
            }
        );
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
