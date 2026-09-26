package com.pvp.player.ui

import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.pvp.player.R
import com.pvp.player.data.HistoryDbHelper
import com.pvp.player.data.StreamHistoryItem
import com.pvp.player.extractor.StreamResolver
import com.pvp.player.player.VLCPlayerActivity
import kotlinx.coroutines.launch

class HomeActivity : AppCompatActivity() {

    private lateinit var editStreamUrl: EditText
    private lateinit var btnPastePlay: Button
    private lateinit var btnDirectStream: Button
    private lateinit var cardClipboard: LinearLayout
    private lateinit var txtClipboardUrl: TextView
    private lateinit var btnClipboardStream: Button
    private lateinit var btnDismissClipboard: ImageButton
    private lateinit var historyContainer: LinearLayout
    private lateinit var txtEmptyHistory: TextView
    private lateinit var btnClearHistory: TextView

    private lateinit var dbHelper: HistoryDbHelper
    private var detectedClipboardUrl = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        dbHelper = HistoryDbHelper(this)

        initViews()
        handleIncomingIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIncomingIntent(it) }
    }

    override fun onResume() {
        super.onResume()
        checkClipboard()
        loadHistory()
    }

    private fun initViews() {
        editStreamUrl = findViewById(R.id.editStreamUrl)
        btnPastePlay = findViewById(R.id.btnPastePlay)
        btnDirectStream = findViewById(R.id.btnDirectStream)
        cardClipboard = findViewById(R.id.cardClipboard)
        txtClipboardUrl = findViewById(R.id.txtClipboardUrl)
        btnClipboardStream = findViewById(R.id.btnClipboardStream)
        btnDismissClipboard = findViewById(R.id.btnDismissClipboard)
        historyContainer = findViewById(R.id.historyContainer)
        txtEmptyHistory = findViewById(R.id.txtEmptyHistory)
        btnClearHistory = findViewById(R.id.btnClearHistory)

        btnPastePlay.setOnClickListener {
            val clipText = getClipboardText()
            if (clipText.isNotBlank()) {
                editStreamUrl.setText(clipText)
                startStream(clipText)
            } else {
                Toast.makeText(this, "Clipboard is empty or does not contain a URL", Toast.LENGTH_SHORT).show()
            }
        }

        btnDirectStream.setOnClickListener {
            val url = editStreamUrl.text.toString().trim()
            if (url.isNotBlank()) {
                startStream(url)
            } else {
                Toast.makeText(this, "Please enter a video URL", Toast.LENGTH_SHORT).show()
            }
        }

        btnClipboardStream.setOnClickListener {
            if (detectedClipboardUrl.isNotBlank()) {
                cardClipboard.visibility = View.GONE
                editStreamUrl.setText(detectedClipboardUrl)
                startStream(detectedClipboardUrl)
            }
        }

        btnDismissClipboard.setOnClickListener {
            cardClipboard.visibility = View.GONE
        }

        btnClearHistory.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle("Clear Stream History")
                .setMessage("Are you sure you want to clear your local streaming history?")
                .setPositiveButton("Clear") { _, _ ->
                    dbHelper.clearAll()
                    loadHistory()
                }
                .setNegativeButton("Cancel", null)
                .show()
        }

        findViewById<ImageButton>(R.id.btnSettings).setOnClickListener {
            showSettingsDialog()
        }
    }

    private fun handleIncomingIntent(intent: Intent) {
        val action = intent.action
        val type = intent.type

        if (Intent.ACTION_SEND == action && type != null) {
            if ("text/plain" == type) {
                val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                if (!sharedText.isNullOrBlank()) {
                    val extractedUrl = extractUrl(sharedText)
                    if (extractedUrl.isNotBlank()) {
                        editStreamUrl.setText(extractedUrl)
                        startStream(extractedUrl)
                    }
                }
            }
        } else if (Intent.ACTION_VIEW == action) {
            val data: Uri? = intent.data
            if (data != null) {
                val url = data.toString()
                editStreamUrl.setText(url)
                startStream(url)
            }
        }
    }

    private fun extractUrl(text: String): String {
        val parts = text.split("\\s+".toRegex())
        for (p in parts) {
            if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("t.me/") || p.startsWith("magnet:")) {
                return p.trim()
            }
        }
        return text.trim()
    }

    private fun checkClipboard() {
        val text = getClipboardText()
        if (text.isNotBlank() && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("t.me/"))) {
            if (text != detectedClipboardUrl) {
                detectedClipboardUrl = text
                txtClipboardUrl.text = text
                cardClipboard.visibility = View.VISIBLE
            }
        } else {
            cardClipboard.visibility = View.GONE
        }
    }

    private fun getClipboardText(): String {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        if (clipboard.hasPrimaryClip()) {
            val item = clipboard.primaryClip?.getItemAt(0)
            val text = item?.text?.toString()?.trim() ?: ""
            return text
        }
        return ""
    }

    private fun startStream(url: String) {
        lifecycleScope.launch {
            Toast.makeText(this@HomeActivity, "⚡ Resolving stream and filtering ads...", Toast.LENGTH_SHORT).show()
            val result = StreamResolver.resolveStream(url)
            if (result.success && result.playUrl.isNotBlank()) {
                val playerIntent = Intent(this@HomeActivity, VLCPlayerActivity::class.java).apply {
                    putExtra("EXTRA_URL", result.playUrl)
                    putExtra("EXTRA_TITLE", result.title)
                }
                startActivity(playerIntent)
            } else {
                Toast.makeText(this@HomeActivity, result.error ?: "Unable to resolve stream.", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun loadHistory() {
        historyContainer.removeAllViews()
        val items = dbHelper.getRecentHistory(20)

        if (items.isEmpty()) {
            txtEmptyHistory.visibility = View.VISIBLE
            btnClearHistory.visibility = View.GONE
        } else {
            txtEmptyHistory.visibility = View.GONE
            btnClearHistory.visibility = View.VISIBLE

            val inflater = LayoutInflater.from(this)
            for (item in items) {
                val itemView = inflater.inflate(android.R.layout.simple_list_item_2, historyContainer, false)
                val text1 = itemView.findViewById<TextView>(android.R.id.text1)
                val text2 = itemView.findViewById<TextView>(android.R.id.text2)

                text1.text = "▶ " + item.title
                text1.setTextColor(0xFFFFFFFF.toInt())
                text1.textSize = 14f

                text2.text = item.url
                text2.setTextColor(0xFF888888.toInt())
                text2.textSize = 11f

                itemView.setOnClickListener {
                    editStreamUrl.setText(item.url)
                    startStream(item.url)
                }
                historyContainer.addView(itemView)
            }
        }
    }

    private fun showSettingsDialog() {
        val options = arrayOf(
            "Default Video Quality: Auto (Best)",
            "Hardware Acceleration: Direct Surface (Direct3D/OpenGL)",
            "Privacy Mode: Strict (Zero external telemetry)",
            "Ad Blocking: Enabled (Active)"
        )
        AlertDialog.Builder(this)
            .setTitle("PVP Streamer Settings")
            .setItems(options, null)
            .setPositiveButton("Done", null)
            .show()
    }
}
