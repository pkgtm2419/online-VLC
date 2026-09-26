package com.pvp.player

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var assetLoader: WebViewAssetLoader
    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null
    private var pendingUrl: String? = null
    private var isAppReady = false
    private var lastCheckedClip = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Enable modern Edge-to-Edge display for Android 12+
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        // Initialize WebViewAssetLoader for secure HTTPS local asset serving (Fixes YouTube embed Error 153)
        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        setupFullscreen()
        setupWebView()

        setupClipboardMonitoring()

        // Handle incoming video share intent (from YouTube, Instagram, etc.)
        handleIntent(intent)

        // Load the Player
        loadPlayer()
    }

    private var clipboardListener: android.content.ClipboardManager.OnPrimaryClipChangedListener? = null

    private fun setupClipboardMonitoring() {
        try {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as? android.content.ClipboardManager
            clipboardListener = android.content.ClipboardManager.OnPrimaryClipChangedListener {
                checkClipboard()
            }
            clipboard?.addPrimaryClipChangedListener(clipboardListener)
        } catch (_: Exception) {}
    }


    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }


    private var isBackgroundPlayEnabled = false

    override fun onPause() {
        super.onPause()
        if (!isBackgroundPlayEnabled) {
            webView.onPause()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        checkClipboard()
    }

    private fun checkClipboard() {
        try {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as? android.content.ClipboardManager
            if (clipboard?.hasPrimaryClip() == true) {
                val item = clipboard.primaryClip?.getItemAt(0)
                val text = item?.text?.toString()?.trim()
                if (text != null && (text.startsWith("http://") || text.startsWith("https://")) && text != lastCheckedClip) {
                    lastCheckedClip = text
                    webView.post {
                        webView.evaluateJavascript("if (typeof checkClipboardForVideo === 'function') checkClipboardForVideo();", null)
                    }
                }
            }
        } catch (_: Exception) {}
    }

    private fun extractUrlFromText(text: String?): String? {
        if (text.isNullOrBlank()) return null
        val urlPattern = Regex("https?://[^\\s<>\"]+")
        val match = urlPattern.find(text)
        if (match != null) {
            var url = match.value
            // Clean trailing punctuation attached by social media sharing (e.g. "Check this out https://youtu.be/xyz!")
            url = url.trimEnd('.', ',', ')', ']', '}', ';', '!', '?', '"', '\'')
            return url
        }
        return null
    }

    private fun handleIntent(intent: Intent?) {
        when (intent?.action) {
            Intent.ACTION_SEND -> {
                val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                    ?: intent.clipData?.getItemAt(0)?.text?.toString()
                val url = extractUrlFromText(sharedText)
                if (url != null) {
                    pendingUrl = url
                    if (isAppReady) {
                        loadUrlInPlayer(url)
                        pendingUrl = null
                    }
                }
            }
            Intent.ACTION_VIEW -> {
                intent.data?.let { uri ->
                    val url = if (uri.scheme == "pvp") {
                        uri.getQueryParameter("url")
                    } else {
                        uri.toString()
                    }
                    if (!url.isNullOrBlank()) {
                        pendingUrl = url
                        if (isAppReady) {
                            loadUrlInPlayer(url)
                            pendingUrl = null
                        }
                    }
                }
            }
        }
    }

    private fun loadPlayer() {
        progressBar.visibility = View.VISIBLE
        // Load via secure HTTPS virtual domain provided by WebViewAssetLoader
        // This grants the page a genuine HTTPS origin (https://appassets.androidplatform.net),
        // resolving YouTube Error 153 and referrer restrictions.
        val targetUrl = "https://appassets.androidplatform.net/assets/www/index.html"
        webView.loadUrl(targetUrl)
    }

    fun loadUrlInPlayer(videoUrl: String) {
        val safeJsonUrl = org.json.JSONObject.quote(videoUrl)
        val script = "if (typeof window.playVideoUrl === 'function') { " +
                "window.playVideoUrl($safeJsonUrl); " +
                "} else if (typeof window.handleStreamSubmit === 'function') { " +
                "window.handleStreamSubmit($safeJsonUrl); " +
                "}"
        webView.post {
            webView.evaluateJavascript(script, null)
        }
    }

    fun setupFullscreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        }
    }

    fun restoreSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.show(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Suppress("DEPRECATION")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportMultipleWindows(false)
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val url = request?.url ?: return null
                return assetLoader.shouldInterceptRequest(url)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                if (request == null) return false
                // CRUCIAL: Do not intercept iframe or subframe requests (e.g. YouTube embed player)
                if (!request.isForMainFrame) {
                    return false
                }
                val url = request.url.toString()
                // Allow local assets and local server
                if (url.startsWith("https://appassets.androidplatform.net/") ||
                    url.startsWith("file:///android_asset/") ||
                    url.startsWith("http://127.0.0.1") ||
                    url.startsWith("http://localhost")) {
                    return false
                }
                // Open external links clicked in top-level window safely in system browser
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                } catch (_: Exception) {}
                return true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                isAppReady = true
                if (pendingUrl != null) {
                    loadUrlInPlayer(pendingUrl!!)
                    pendingUrl = null
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                super.onShowCustomView(view, callback)
                if (customView != null) {
                    onHideCustomView()
                    return
                }
                customView = view
                customViewCallback = callback
                (window.decorView as? FrameLayout)?.addView(
                    customView,
                    FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT
                    )
                )
                webView.visibility = View.GONE
                setupFullscreen()
            }

            override fun onHideCustomView() {
                super.onHideCustomView()
                if (customView == null) return
                (window.decorView as? FrameLayout)?.removeView(customView)
                customView = null
                customViewCallback?.onCustomViewHidden()
                webView.visibility = View.VISIBLE
                restoreSystemBars()
            }
        }

        // Add JavaScript interface for native Android features
        webView.addJavascriptInterface(PVPBridge(this), "PVPNative")
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (customView != null) {
            customViewCallback?.onCustomViewHidden()
            (window.decorView as? FrameLayout)?.removeView(customView)
            customView = null
            webView.visibility = View.VISIBLE
            restoreSystemBars()
            return
        }

        webView.evaluateJavascript("(function(){ return typeof window.handleAndroidBack === 'function' ? window.handleAndroidBack() : false; })()") { res ->
            val handled = res != null && (res == "true" || res.contains("true"))
            if (!handled) {
                runOnUiThread {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        moveTaskToBack(true)
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        try {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as? android.content.ClipboardManager
            clipboardListener?.let { clipboard?.removePrimaryClipChangedListener(it) }
        } catch (_: Exception) {}
        webView.destroy()
        super.onDestroy()
    }


    /**
     * JavaScript bridge for native Android features
     */
    class PVPBridge(private val activity: MainActivity) {
        @JavascriptInterface
        fun shareUrl(url: String) {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, "Watch on PVP: $url")
            }
            activity.startActivity(Intent.createChooser(intent, "Share video"))
        }

        @JavascriptInterface
        fun triggerHaptic() {
            activity.runOnUiThread {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        activity.window.decorView.performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP)
                    } else {
                        @Suppress("DEPRECATION")
                        activity.window.decorView.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY)
                    }
                } catch (_: Exception) {}
            }
        }

        @JavascriptInterface
        fun setFullscreen(enable: Boolean) {
            activity.runOnUiThread {
                if (enable) {
                    activity.setupFullscreen()
                } else {
                    activity.restoreSystemBars()
                }
            }
        }

        @JavascriptInterface
        fun keepScreenOn(enable: Boolean) {
            activity.runOnUiThread {
                if (enable) {
                    activity.window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                } else {
                    activity.window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                }
            }
        }

        @JavascriptInterface
        fun setOrientation(landscape: Boolean) {
            activity.runOnUiThread {
                activity.requestedOrientation = if (landscape) {
                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                } else {
                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                }
            }
        }

        @JavascriptInterface
        fun setBackgroundPlay(enabled: Boolean) {
            activity.runOnUiThread {
                activity.isBackgroundPlayEnabled = enabled
            }
        }

        @JavascriptInterface
        fun onAppReady() {
            activity.runOnUiThread {
                activity.isAppReady = true
                activity.pendingUrl?.let { url ->
                    activity.loadUrlInPlayer(url)
                    activity.pendingUrl = null
                }
            }
        }
    }
}
