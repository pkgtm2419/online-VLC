package com.pvp.player

import android.annotation.SuppressLint
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
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private var serverPort = 8000
    private var serverStarted = false
    private var pendingUrl: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        setupFullscreen()
        setupWebView()

        // Handle incoming share intent
        handleIntent(intent)

        // Start the Python FastAPI server
        startPythonServer()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        when (intent?.action) {
            Intent.ACTION_SEND -> {
                intent.getStringExtra(Intent.EXTRA_TEXT)?.let { sharedText ->
                    // Extract URL from shared text
                    val urlPattern = Regex("https?://\\S+")
                    val match = urlPattern.find(sharedText)
                    if (match != null) {
                        pendingUrl = match.value
                        if (serverStarted) {
                            loadUrlInPlayer(pendingUrl!!)
                            pendingUrl = null
                        }
                    }
                }
            }
            Intent.ACTION_VIEW -> {
                intent.data?.let { uri ->
                    if (uri.scheme == "pvp") {
                        pendingUrl = uri.getQueryParameter("url")
                        if (serverStarted && pendingUrl != null) {
                            loadUrlInPlayer(pendingUrl!!)
                            pendingUrl = null
                        }
                    }
                }
            }
        }
    }

    private fun loadUrlInPlayer(videoUrl: String) {
        val encoded = Uri.encode(videoUrl)
        webView.loadUrl("http://127.0.0.1:$serverPort/?url=$encoded")
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
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
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
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    // Server might not be ready yet, retry after delay
                    lifecycleScope.launch {
                        delay(2000)
                        if (serverStarted) {
                            view?.loadUrl("http://127.0.0.1:$serverPort/")
                        }
                    }
                }
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

        // Add JavaScript interface for native features
        webView.addJavascriptInterface(PVPBridge(this), "PVPNative")
    }

    private fun startPythonServer() {
        progressBar.visibility = View.VISIBLE

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                // Initialize Python
                if (!Python.isStarted()) {
                    Python.start(AndroidPlatform(this@MainActivity))
                }

                val py = Python.getInstance()
                val serverModule = py.getModule("pvp_server")

                // Start the server in a background thread
                Thread {
                    try {
                        serverModule.callAttr("start_server", serverPort)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }.start()

                // Wait for server to be ready
                var retries = 0
                while (retries < 30) {
                    delay(1000)
                    if (isServerReady()) {
                        break
                    }
                    retries++
                }

                withContext(Dispatchers.Main) {
                    if (isServerReady()) {
                        serverStarted = true
                        if (pendingUrl != null) {
                            loadUrlInPlayer(pendingUrl!!)
                            pendingUrl = null
                        } else {
                            webView.loadUrl("http://127.0.0.1:$serverPort/")
                        }
                    } else {
                        Toast.makeText(
                            this@MainActivity,
                            "Failed to start server. Loading offline mode...",
                            Toast.LENGTH_LONG
                        ).show()
                        // Fallback: load the static HTML directly
                        webView.loadUrl("file:///android_asset/www/index.html")
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@MainActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    webView.loadUrl("file:///android_asset/www/index.html")
                }
            }
        }
    }

    private fun isServerReady(): Boolean {
        return try {
            val url = URL("http://127.0.0.1:$serverPort/")
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 1000
            conn.readTimeout = 1000
            conn.requestMethod = "HEAD"
            val code = conn.responseCode
            conn.disconnect()
            code == 200
        } catch (e: Exception) {
            false
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            // Minimize to background instead of closing
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
        fun getDeviceInfo(): String {
            return """{"model":"${Build.MODEL}","sdk":${Build.VERSION.SDK_INT},"brand":"${Build.BRAND}"}"""
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
    }
}
