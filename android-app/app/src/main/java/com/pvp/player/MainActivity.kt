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
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private var pendingUrl: String? = null
    private var isAppReady = false
    private var lastCheckedClip = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        setupFullscreen()
        setupWebView()

        // Handle incoming video share intent (from YouTube, Instagram, etc.)
        handleIntent(intent)

        // Load the VLC Player
        loadPlayer()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    override fun onResume() {
        super.onResume()
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
                        webView.evaluateJavascript("if (typeof checkClipboardForVideoUrl === 'function') checkClipboardForVideoUrl();", null)
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
        // Load the embedded VLC single-page web app
        val targetUrl = "file:///android_asset/www/index.html"
        webView.loadUrl(targetUrl)
    }

    fun loadUrlInPlayer(videoUrl: String) {
        // Safe JSON encoding to completely eliminate Javascript injection risks
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

    private fun setupFullscreen() {
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

    @SuppressLint("SetJavaScriptEnabled")
    @Suppress("DEPRECATION")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true // Required for local assets: file:///android_asset/www/
            allowContentAccess = false // Prevent content provider data leakage
            allowFileAccessFromFileURLs = false // Prevent JS from accessing arbitrary local storage
            allowUniversalAccessFromFileURLs = false // Prevent cross-origin access from file URLs
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportMultipleWindows(false)
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                // Allow local assets and local server
                if (url.startsWith("file:///android_asset/") || url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
                    return false
                }
                // Open external links safely in system browser to prevent hijacking player WebView
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
        }

        // Add JavaScript interface for native Android features
        webView.addJavascriptInterface(PVPBridge(this), "PVPNative")
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            moveTaskToBack(true)
        }
    }

    override fun onDestroy() {
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
