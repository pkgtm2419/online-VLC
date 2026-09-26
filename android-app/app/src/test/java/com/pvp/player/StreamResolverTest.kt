package com.pvp.player
 
import com.pvp.player.extractor.StreamResolver
import org.junit.Assert.*
import org.junit.Test
 
class StreamResolverTest {
 
     @Test
     fun testCleanUrlStripsTrackingParams() {
         val raw = "https://example.com/video.mp4?utm_source=twitter&utm_medium=social&id=12345"
         val cleaned = StreamResolver.cleanUrl(raw)
         assertEquals("https://example.com/video.mp4?id=12345", cleaned)
     }
 
     @Test
     fun testCleanUrlBlocksAdDomains() {
         val adUrl = "https://pagead2.googlesyndication.com/pagead/show_ads.js"
         val cleaned = StreamResolver.cleanUrl(adUrl)
         assertEquals("", cleaned)
     }
 
     @Test
     fun testCleanUrlPreservesCleanStreams() {
         val cleanUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
         val result = StreamResolver.cleanUrl(cleanUrl)
         assertEquals(cleanUrl, result)
     }
 }
