package com.pvp.player.player

import android.app.PictureInPictureParams
import android.content.Context
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Rational
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.pvp.player.R
import com.pvp.player.data.HistoryDbHelper
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.util.VLCVideoLayout
import kotlin.math.abs

class VLCPlayerActivity : AppCompatActivity() {

    private lateinit var vlcVideoLayout: VLCVideoLayout
    private lateinit var libVLC: LibVLC
    private lateinit var mediaPlayer: MediaPlayer

    // UI Elements
    private lateinit var bufferingProgress: ProgressBar
    private lateinit var topControls: LinearLayout
    private lateinit var centerControls: LinearLayout
    private lateinit var bottomControls: LinearLayout
    private lateinit var gestureHud: LinearLayout
    private lateinit var gestureIcon: ImageView
    private lateinit var gestureText: TextView
    private lateinit var txtVideoTitle: TextView
    private lateinit var txtCurrentTime: TextView
    private lateinit var txtTotalTime: TextView
    private lateinit var txtSpeedLabel: TextView
    private lateinit var playerSeekBar: SeekBar
    private lateinit var btnPlayPause: ImageButton

    // State Variables
    private var streamUrl: String = ""
    private var streamTitle: String = "Online Stream"
    private var isControlsVisible = true
    private var isSeeking = false
    private var currentSpeed = 1.0f

    // Audio & Brightness
    private lateinit var audioManager: AudioManager
    private var maxVolume = 1
    private var touchStartX = 0f
    private var touchStartY = 0f
    private var isLeftTouch = false
    private var isDragging = false

    private val hideHandler = Handler(Looper.getMainLooper())
    private val hideRunnable = Runnable { hideControls() }

    private val progressHandler = Handler(Looper.getMainLooper())
    private val progressRunnable = object : Runnable {
        override fun run() {
            updatePlaybackProgress()
            progressHandler.postDelayed(this, 500)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Make window fullscreen & keep screen on
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.activity_player)

        streamUrl = intent.getStringExtra("EXTRA_URL") ?: ""
        streamTitle = intent.getStringExtra("EXTRA_TITLE") ?: "Online Stream"

        if (streamUrl.isBlank()) {
            Toast.makeText(this, "No valid stream URL provided", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        initViews()
        initAudioAndBrightness()
        initLibVLC()
        startPlayback()

        // Save to local history
        HistoryDbHelper(this).addHistory(streamUrl, streamTitle)
    }

    private fun initViews() {
        vlcVideoLayout = findViewById(R.id.vlcVideoLayout)
        bufferingProgress = findViewById(R.id.bufferingProgress)
        topControls = findViewById(R.id.topControls)
        centerControls = findViewById(R.id.centerControls)
        bottomControls = findViewById(R.id.bottomControls)
        gestureHud = findViewById(R.id.gestureHud)
        gestureIcon = findViewById(R.id.gestureIcon)
        gestureText = findViewById(R.id.gestureText)
        txtVideoTitle = findViewById(R.id.txtVideoTitle)
        txtCurrentTime = findViewById(R.id.txtCurrentTime)
        txtTotalTime = findViewById(R.id.txtTotalTime)
        txtSpeedLabel = findViewById(R.id.txtSpeedLabel)
        playerSeekBar = findViewById(R.id.playerSeekBar)
        btnPlayPause = findViewById(R.id.btnPlayPause)

        txtVideoTitle.text = streamTitle

        findViewById<ImageButton>(R.id.btnBack).setOnClickListener { finish() }
        btnPlayPause.setOnClickListener { togglePlayPause() }
        findViewById<ImageButton>(R.id.btnReplay10).setOnClickListener { seekRelative(-10000) }
        findViewById<ImageButton>(R.id.btnForward10).setOnClickListener { seekRelative(10000) }

        findViewById<ImageButton>(R.id.btnAudioTracks).setOnClickListener { showAudioTracksDialog() }
        findViewById<ImageButton>(R.id.btnSubtitles).setOnClickListener { showSubtitlesDialog() }
        findViewById<ImageButton>(R.id.btnSpeed).setOnClickListener { cycleSpeed() }

        playerSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser && mediaPlayer.length > 0) {
                    val targetMs = (mediaPlayer.length * (progress / 1000.0f)).toLong()
                    txtCurrentTime.text = formatTime(targetMs)
                }
            }

            override fun onStartTrackingTouch(seekBar: SeekBar?) {
                isSeeking = true
                cancelHideControls()
            }

            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                if (mediaPlayer.length > 0) {
                    val pos = (playerSeekBar.progress / 1000.0f)
                    mediaPlayer.position = pos
                }
                isSeeking = false
                resetHideControlsTimer()
            }
        })

        setupTouchGestures()
    }

    private fun initAudioAndBrightness() {
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    }

    private fun initLibVLC() {
        val args = ArrayList<String>().apply {
            add("--no-video-title-show")
            add("--no-sub-autodetect-file")
            add("--avcodec-hw=any")
            add("--network-caching=2500")
            add("--live-caching=2500")
            add("--quiet")
        }
        libVLC = LibVLC(this, args)
        mediaPlayer = MediaPlayer(libVLC)
        mediaPlayer.attachViews(vlcVideoLayout, null, false, false)

        mediaPlayer.setEventListener { event ->
            when (event.type) {
                MediaPlayer.Event.Buffering -> {
                    if (event.buffering < 100f) {
                        bufferingProgress.visibility = View.VISIBLE
                    } else {
                        bufferingProgress.visibility = View.GONE
                    }
                }
                MediaPlayer.Event.Playing -> {
                    bufferingProgress.visibility = View.GONE
                    btnPlayPause.setImageResource(R.drawable.ic_pause)
                }
                MediaPlayer.Event.Paused -> {
                    btnPlayPause.setImageResource(R.drawable.ic_play)
                }
                MediaPlayer.Event.EndReached -> {
                    finish()
                }
                MediaPlayer.Event.EncounteredError -> {
                    Toast.makeText(this, "LibVLC encountered playback error.", Toast.LENGTH_SHORT).show()
                    finish()
                }
            }
        }
    }

    private fun startPlayback() {
        val media = Media(libVLC, Uri.parse(streamUrl)).apply {
            setHWDecoderEnabled(true, false)
        }
        mediaPlayer.media = media
        media.release()
        mediaPlayer.play()

        progressHandler.post(progressRunnable)
        resetHideControlsTimer()
    }

    private fun togglePlayPause() {
        if (mediaPlayer.isPlaying) {
            mediaPlayer.pause()
            btnPlayPause.setImageResource(R.drawable.ic_play)
            cancelHideControls()
        } else {
            mediaPlayer.play()
            btnPlayPause.setImageResource(R.drawable.ic_pause)
            resetHideControlsTimer()
        }
    }

    private fun seekRelative(deltaMs: Long) {
        val cur = mediaPlayer.time
        if (cur >= 0) {
            val target = (cur + deltaMs).coerceAtLeast(0)
            mediaPlayer.time = target
            showGestureHud(R.drawable.ic_forward_10, if (deltaMs > 0) "+10s" else "-10s")
        }
        resetHideControlsTimer()
    }

    private fun updatePlaybackProgress() {
        if (!isSeeking && mediaPlayer.length > 0) {
            val curTime = mediaPlayer.time
            val totalTime = mediaPlayer.length
            if (curTime >= 0 && totalTime > 0) {
                val progress = ((curTime.toFloat() / totalTime) * 1000).toInt()
                playerSeekBar.progress = progress
                txtCurrentTime.text = formatTime(curTime)
                txtTotalTime.text = formatTime(totalTime)
            }
        }
    }

    private fun cycleSpeed() {
        val speeds = listOf(0.75f, 1.0f, 1.25f, 1.5f, 2.0f)
        val nextIdx = (speeds.indexOf(currentSpeed) + 1) % speeds.size
        currentSpeed = speeds[nextIdx]
        mediaPlayer.rate = currentSpeed
        txtSpeedLabel.text = "${currentSpeed}x"
        showGestureHud(R.drawable.ic_settings, "Speed: ${currentSpeed}x")
        resetHideControlsTimer()
    }

    private fun showAudioTracksDialog() {
        val tracks = mediaPlayer.audioTracks ?: run {
            Toast.makeText(this, "No audio tracks detected", Toast.LENGTH_SHORT).show()
            return
        }
        val items = tracks.map { it.name ?: "Track ${it.id}" }.toTypedArray()
        val curTrack = mediaPlayer.audioTrack
        val checkedIdx = tracks.indexOfFirst { it.id == curTrack }

        AlertDialog.Builder(this)
            .setTitle("Audio Track")
            .setSingleChoiceItems(items, checkedIdx) { dialog, which ->
                mediaPlayer.audioTrack = tracks[which].id
                dialog.dismiss()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showSubtitlesDialog() {
        val subs = mediaPlayer.spuTracks ?: run {
            Toast.makeText(this, "No subtitles detected", Toast.LENGTH_SHORT).show()
            return
        }
        val items = subs.map { it.name ?: "Sub ${it.id}" }.toTypedArray()
        val curSub = mediaPlayer.spuTrack
        val checkedIdx = subs.indexOfFirst { it.id == curSub }

        AlertDialog.Builder(this)
            .setTitle("Subtitles")
            .setSingleChoiceItems(items, checkedIdx) { dialog, which ->
                mediaPlayer.spuTrack = subs[which].id
                dialog.dismiss()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // -----------------------------------------------------------------
    // Touch Gestures (Brightness / Volume / Seeking)
    // -----------------------------------------------------------------
    private fun setupTouchGestures() {
        val gestureDetector = GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
                toggleControls()
                return true
            }

            override fun onDoubleTap(e: MotionEvent): Boolean {
                val screenWidth = resources.displayMetrics.widthPixels
                if (e.x > screenWidth / 2) {
                    seekRelative(10000)
                } else {
                    seekRelative(-10000)
                }
                return true
            }
        })

        vlcVideoLayout.setOnTouchListener { _, event ->
            if (gestureDetector.onTouchEvent(event)) {
                return@setOnTouchListener true
            }

            val screenWidth = resources.displayMetrics.widthPixels
            val screenHeight = resources.displayMetrics.heightPixels

            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    touchStartX = event.x
                    touchStartY = event.y
                    isLeftTouch = event.x < screenWidth / 2
                    isDragging = false
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaY = touchStartY - event.y
                    val deltaX = event.x - touchStartX

                    if (abs(deltaY) > 40 && abs(deltaY) > abs(deltaX)) {
                        isDragging = true
                        val fraction = deltaY / (screenHeight * 0.75f)

                        if (isLeftTouch) {
                            // Brightness Adjustment (Left half)
                            adjustBrightness(fraction)
                        } else {
                            // Volume Adjustment (Right half)
                            adjustVolume(fraction)
                        }
                    }
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (isDragging) {
                        hideHandler.postDelayed({ gestureHud.visibility = View.GONE }, 1000)
                        isDragging = false
                    }
                }
            }
            true
        }
    }

    private fun adjustVolume(fraction: Float) {
        val current = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        val delta = (fraction * maxVolume).toInt()
        val target = (current + delta).coerceIn(0, maxVolume)
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, target, 0)

        val percent = ((target.toFloat() / maxVolume) * 100).toInt()
        showGestureHud(R.drawable.ic_volume, "Volume: $percent%")
    }

    private fun adjustBrightness(fraction: Float) {
        val lp = window.attributes
        var current = lp.screenBrightness
        if (current < 0) current = 0.5f
        val target = (current + fraction).coerceIn(0.05f, 1.0f)
        lp.screenBrightness = target
        window.attributes = lp

        val percent = (target * 100).toInt()
        showGestureHud(R.drawable.ic_settings, "Brightness: $percent%")
    }

    private fun showGestureHud(iconRes: Int, text: String) {
        gestureIcon.setImageResource(iconRes)
        gestureText.text = text
        gestureHud.visibility = View.VISIBLE
    }

    private fun toggleControls() {
        if (isControlsVisible) {
            hideControls()
        } else {
            showControls()
        }
    }

    private fun showControls() {
        topControls.visibility = View.VISIBLE
        centerControls.visibility = View.VISIBLE
        bottomControls.visibility = View.VISIBLE
        isControlsVisible = true
        resetHideControlsTimer()
    }

    private fun hideControls() {
        topControls.visibility = View.GONE
        centerControls.visibility = View.GONE
        bottomControls.visibility = View.GONE
        isControlsVisible = false
    }

    private fun resetHideControlsTimer() {
        cancelHideControls()
        hideHandler.postDelayed(hideRunnable, 3500)
    }

    private fun cancelHideControls() {
        hideHandler.removeCallbacks(hideRunnable)
    }

    private fun formatTime(ms: Long): String {
        val totalSec = ms / 1000
        val h = totalSec / 3600
        val m = (totalSec % 3600) / 60
        val s = totalSec % 60
        return if (h > 0) String.format("%02d:%02d:%02d", h, m, s) else String.format("%02d:%02d", m, s)
    }

    override fun onPause() {
        super.onPause()
        if (mediaPlayer.isPlaying) {
            mediaPlayer.pause()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        progressHandler.removeCallbacks(progressRunnable)
        hideHandler.removeCallbacks(hideRunnable)
        mediaPlayer.stop()
        mediaPlayer.detachViews()
        mediaPlayer.release()
        libVLC.release()
    }
}
