package com.pvp.player.extractor

import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.util.regex.Pattern

data class StreamResult(
    val success: Boolean,
    val title: String,
    val playUrl: String,
    val isHls: Boolean = false,
    val durationStr: String = "--:--",
    val error: String? = null
)

object StreamResolver {

    // Known advertising and tracker network domains to block
    private val AD_BLOCKING_DOMAINS = setOf(
        "doubleclick.net", "googleadservices.com", "googlesyndication.com",
        "adnxs.com", "ads.google.com", "pagead2.googlesyndication.com",
        "adservice.google.com", "adform.net", "rubiconproject.com",
        "criteo.com", "advertising.com", "analytics.google.com",
        "scorecardresearch.com", "hotjar.com", "segment.io"
    )

    // Tracking query parameter keys to strip
    private val TRACKING_PARAMS = setOf(
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "fbclid", "gclid", "gclsrc", "dclid", "msclkid", "ref", "source", "feature"
    )

    fun cleanUrl(rawUrl: String): String {
        return try {
            val trimmed = rawUrl.trim()
            val uri = java.net.URI(trimmed)
            val host = uri.host?.lowercase() ?: ""
            for (blocked in AD_BLOCKING_DOMAINS) {
                if (host == blocked || host.endsWith(".$blocked")) {
                    return ""
                }
            }

            val query = uri.rawQuery ?: return trimmed
            val pairs = query.split("&")
            val filtered = pairs.filter { pair ->
                val key = pair.substringBefore("=").lowercase()
                !TRACKING_PARAMS.contains(key)
            }
            val newQuery = if (filtered.isEmpty()) null else filtered.joinToString("&")
            val newUri = java.net.URI(uri.scheme, uri.rawAuthority, uri.rawPath, newQuery, uri.rawFragment)
            newUri.toString()
        } catch (_: Exception) {
            rawUrl.trim()
        }
    }

    suspend fun resolveStream(rawUrl: String): StreamResult = withContext(Dispatchers.IO) {
        val cleaned = cleanUrl(rawUrl)
        if (cleaned.isBlank()) {
            return@withContext StreamResult(
                success = false,
                title = "Blocked",
                playUrl = "",
                error = "URL was blocked by ad-filter."
            )
        }

        val lower = cleaned.lowercase()

        // 1. Direct Media Files (.mp4, .m3u8, .webm, .mkv, .mov, etc.)
        if (lower.contains(".mp4") || lower.contains(".m3u8") || lower.contains(".webm") ||
            lower.contains(".mkv") || lower.contains(".mov") || lower.contains(".ts")) {
            val filename = cleaned.substringAfterLast('/').substringBefore('?')
            val isHls = lower.contains(".m3u8")
            return@withContext StreamResult(
                success = true,
                title = Uri.decode(filename).ifBlank { "Direct Stream" },
                playUrl = cleaned,
                isHls = isHls
            )
        }

        // 2. YouTube Links (youtube.com, youtu.be)
        if (lower.contains("youtube.com") || lower.contains("youtu.be")) {
            val ytResult = resolveYouTubeStream(cleaned)
            if (ytResult != null) {
                return@withContext ytResult
            }
        }

        // 3. Telegram Links
        if (lower.contains("t.me/") || lower.contains("telegram.me/")) {
            val tgResult = resolveTelegramStream(cleaned)
            if (tgResult != null) {
                return@withContext tgResult
            }
        }

        // 4. Default / Generic Stream
        val title = cleaned.substringAfterLast('/').substringBefore('?')
        StreamResult(
            success = true,
            title = if (title.isNotBlank()) Uri.decode(title) else "Online Stream",
            playUrl = cleaned,
            isHls = lower.contains("m3u8")
        )
    }

    private fun resolveYouTubeStream(url: String): StreamResult? {
        val videoId = extractYouTubeVideoId(url) ?: return null
        // VideoLAN LibVLC natively handles YouTube URLs via its builtin demuxer,
        // or direct https://www.youtube.com/watch?v=ID MRL:
        val cleanWatchUrl = "https://www.youtube.com/watch?v=$videoId"
        return StreamResult(
            success = true,
            title = "YouTube Video ($videoId)",
            playUrl = cleanWatchUrl,
            isHls = false
        )
    }

    private fun extractYouTubeVideoId(url: String): String? {
        val patterns = listOf(
            "(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/|youtube\\.com\\/shorts\\/)([a-zA-Z0-9_-]{11})",
            "v=([a-zA-Z0-9_-]{11})"
        )
        for (p in patterns) {
            val m = Pattern.compile(p).matcher(url)
            if (m.find()) {
                return m.group(1)
            }
        }
        return null
    }

    private fun resolveTelegramStream(url: String): StreamResult? {
        return try {
            val m = Pattern.compile("t\\.me\\/(?:c\\/\\d+\\/|)([a-zA-Z0-9_]+)\\/(\\d+)").matcher(url)
            if (!m.find()) return null
            val username = m.group(1)
            val msgId = m.group(2)
            val embedUrl = "https://t.me/$username/$msgId?embed=1"

            val conn = URL(embedUrl).openConnection() as HttpURLConnection
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Android; Mobile)")
            conn.connectTimeout = 6000
            conn.readTimeout = 6000
            val html = conn.inputStream.bufferedReader().use { it.readText() }

            val videoMatcher = Pattern.compile("<video[^>]+src=[\"']([^\"']+)[\"']").matcher(html)
            if (videoMatcher.find()) {
                val streamUrl = videoMatcher.group(1)?.replace("&amp;", "&") ?: return null
                return StreamResult(
                    success = true,
                    title = "Telegram: @$username/$msgId",
                    playUrl = streamUrl,
                    isHls = false
                )
            }
            null
        } catch (_: Exception) {
            null
        }
    }
}
