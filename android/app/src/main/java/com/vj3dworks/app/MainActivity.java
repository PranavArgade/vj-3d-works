package com.vj3dworks.app;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private RelativeLayout splashContainer;
    private ValueCallback<Uri[]> filePathCallback;
    private boolean doubleBackToExitPressedOnce = false;

    private final ActivityResultLauncher<Intent> fileChooserLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (filePathCallback != null) {
                    Uri[] results = null;
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        if (result.getData().getClipData() != null) {
                            int count = result.getData().getClipData().getItemCount();
                            results = new Uri[count];
                            for (int i = 0; i < count; i++) {
                                results[i] = result.getData().getClipData().getItemAt(i).getUri();
                            }
                        } else if (result.getData().getData() != null) {
                            results = new Uri[]{result.getData().getData()};
                        }
                    }
                    filePathCallback.onReceiveValue(results);
                    filePathCallback = null;
                }
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        splashContainer = findViewById(R.id.splashContainer);

        setupWebView();
        setupBackNavigation();

        // Load local bundled web application
        webView.loadUrl("file:///android_asset/index.html");
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);

        // Security best practices: disallow arbitrary local file and content access to prevent Play Protect flags
        settings.setDatabaseEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);

        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // JavaScript Interface for Android-specific capabilities
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if (scheme != null && (scheme.equalsIgnoreCase("tel") ||
                                       scheme.equalsIgnoreCase("mailto") ||
                                       scheme.equalsIgnoreCase("whatsapp") ||
                                       scheme.equalsIgnoreCase("intent"))) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {
                    }
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                
                // Smoothly dismiss splash screen
                if (splashContainer != null && splashContainer.getVisibility() == View.VISIBLE) {
                    splashContainer.animate()
                            .alpha(0f)
                            .setDuration(400)
                            .withEndAction(() -> splashContainer.setVisibility(View.GONE));
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    fileChooserLauncher.launch(intent);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
                return true;
            }
        });
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    if (doubleBackToExitPressedOnce) {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                        return;
                    }

                    doubleBackToExitPressedOnce = true;
                    Toast.makeText(MainActivity.this, getString(R.string.exit_confirm), Toast.LENGTH_SHORT).show();

                    new Handler(Looper.getMainLooper()).postDelayed(() -> doubleBackToExitPressedOnce = false, 2000);
                }
            }
        });
    }

    public class AndroidBridge {

        @JavascriptInterface
        public boolean isAndroidApp() {
            return true;
        }

        @JavascriptInterface
        public void printInvoice(final String html, final String jobName) {
            runOnUiThread(() -> {
                try {
                    WebView printWebView = new WebView(MainActivity.this);
                    printWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            try {
                                PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                                if (printManager != null) {
                                    String safeTitle = (jobName != null && !jobName.trim().isEmpty())
                                            ? jobName.trim()
                                            : "VJ-3D-WORKS_Invoice";
                                    PrintDocumentAdapter adapter = printWebView.createPrintDocumentAdapter(safeTitle);
                                    PrintAttributes attributes = new PrintAttributes.Builder()
                                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                                            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                            .build();
                                    printManager.print(safeTitle, adapter, attributes);
                                }
                            } catch (Exception e) {
                                Toast.makeText(MainActivity.this, "Printing error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                            }
                        }
                    });
                    printWebView.loadDataWithBaseURL("file:///android_asset/", html, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Error preparing print: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void shareText(final String title, final String text) {
            runOnUiThread(() -> {
                try {
                    Intent sendIntent = new Intent();
                    sendIntent.setAction(Intent.ACTION_SEND);
                    sendIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                    sendIntent.putExtra(Intent.EXTRA_TEXT, text);
                    sendIntent.setType("text/plain");

                    Intent shareIntent = Intent.createChooser(sendIntent, "Share VJ-3D-WORKS Invoice");
                    startActivity(shareIntent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Share error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void showToast(final String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
        }
    }
}

