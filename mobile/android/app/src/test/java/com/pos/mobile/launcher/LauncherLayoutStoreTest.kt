package com.pos.mobile.launcher

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LauncherLayoutStoreTest {
    @Test
    fun defaultHomeHasNextActionAndToday() {
        val layout = LauncherLayoutStore.defaultLayout()
        assertEquals(listOf(WidgetRegistry.NEXT_ACTION, WidgetRegistry.TODAY), layout.homeWidgets().map { it.typeId })
        assertEquals(listOf(WidgetRegistry.PIPELINE, WidgetRegistry.SERVER), layout.developerWidgets().map { it.typeId })
    }

    @Test
    fun migratesTradingBotSampleSlotToLivePipeline() {
        val raw = """
            {"schema":1,"widgets":[
              {"instanceId":"home-next","typeId":"next_action","placement":"HOME","order":0},
              {"instanceId":"home-today","typeId":"today_glance","placement":"HOME","order":1},
              {"instanceId":"dev-server","typeId":"server","placement":"DEVELOPER","order":0},
              {"instanceId":"dev-bot","typeId":"trading_bot","placement":"DEVELOPER","order":1}
            ],"favorites":[],"sawFavoritesPrompt":false}
        """.trimIndent()
        val layout = LauncherLayoutStore.parse(raw)
        assertEquals(LauncherLayoutStore.SCHEMA, layout.schema)
        assertEquals(listOf(WidgetRegistry.PIPELINE, WidgetRegistry.SERVER), layout.developerWidgets().map { it.typeId })
    }

    @Test
    fun unknownSchemaFallsBackToDefault() {
        val layout = LauncherLayoutStore.parse("""{"schema":99,"widgets":[]}""")
        assertEquals(LauncherLayoutStore.SCHEMA, layout.schema)
        assertEquals(2, layout.homeWidgets().size)
    }

    @Test
    fun roundTripKeepsFavoritesAndCapsHome() {
        val raw = """
            {"schema":1,"sawFavoritesPrompt":true,"favorites":[{"packageName":"com.openai.chatgpt","className":"Main","userSerial":0,"label":"ChatGPT"}],"widgets":[
              {"instanceId":"a","typeId":"next_action","placement":"HOME","order":0},
              {"instanceId":"b","typeId":"today_glance","placement":"HOME","order":1},
              {"instanceId":"c","typeId":"next_action","placement":"HOME","order":2},
              {"instanceId":"d","typeId":"server","placement":"DEVELOPER","order":0}
            ]}
        """.trimIndent()
        val layout = LauncherLayoutStore.parse(raw)
        assertEquals(2, layout.homeWidgets().size)
        assertEquals("a", layout.homeWidgets()[0].instanceId)
        assertEquals("ChatGPT", layout.favorites.single().label)
        assertTrue(layout.sawFavoritesPrompt)
        val again = LauncherLayoutStore.parse(layout.toJson().toString())
        assertEquals(layout.homeWidgets().map { it.instanceId }, again.homeWidgets().map { it.instanceId })
    }

    @Test
    fun skipsBlankTypeIds() {
        val layout = LauncherLayoutStore.parse(
            """{"schema":1,"widgets":[{"instanceId":"x","typeId":"","placement":"HOME","order":0},{"instanceId":"y","typeId":"today_glance","placement":"HOME","order":1}]}""",
        )
        assertEquals(listOf("today_glance"), layout.homeWidgets().map { it.typeId })
    }
}

class InstalledAppsSearchTest {
    @Test
    fun prefixRanksAheadOfContains() {
        assertEquals(0, InstalledApps.matchRank("ChatGPT", "com.openai.chatgpt", "cha"))
        assertEquals(1, InstalledApps.matchRank("Voice Chat", "com.example.voice", "cha"))
        assertEquals(2, InstalledApps.matchRank("Notes", "com.openai.chatgpt.notes", "chatgpt"))
        assertEquals(null, InstalledApps.matchRank("Maps", "com.google.android.apps.maps", "wallet"))
    }

    @Test
    fun blankQueryMatchesEverything() {
        assertEquals(0, InstalledApps.matchRank("Wallet", "com.google.android.apps.walletnfcrel", "  "))
    }

    @Test
    fun cursorAndSpotifyMatchByName() {
        assertEquals(0, InstalledApps.matchRank("Cursor", "com.anysphere.cursor", "cur"))
        assertEquals(0, InstalledApps.matchRank("Spotify", "com.spotify.music", "spo"))
    }
}

class DockAppsTest {
    @Test
    fun dockHasWalletChatGptCursorAndSpotify() {
        assertEquals("Wallet", InstalledApps.WALLET_APP.label)
        assertEquals("ChatGPT", InstalledApps.CHATGPT_APP.label)
        assertEquals("Cursor", InstalledApps.CURSOR_APP.label)
        assertEquals("Spotify", InstalledApps.SPOTIFY_APP.label)
        assertTrue(InstalledApps.CURSOR_APP.packages.contains("com.anysphere.cursor"))
        assertTrue(InstalledApps.SPOTIFY_APP.packages.contains("com.spotify.music"))
        assertEquals(DockMark.WALLET, InstalledApps.WALLET_APP.mark)
        assertEquals(DockMark.CHAT, InstalledApps.CHATGPT_APP.mark)
        assertEquals(DockMark.CURSOR, InstalledApps.CURSOR_APP.mark)
        assertEquals(DockMark.SPOTIFY, InstalledApps.SPOTIFY_APP.mark)
    }
}

class RecentAppsTest {
    @Test
    fun mergeKeepsNewestAndDropsOlderDuplicates() {
        val first = RecentEntry("com.instagram.android", "Main", "Instagram", 10)
        val later = RecentEntry("com.instagram.android", "Main", "Instagram", 40)
        val other = RecentEntry("com.spotify.music", "Main", "Spotify", 30)
        val ranked = RecentApps.merge(listOf(first, other), listOf(later))
        assertEquals(listOf("Instagram", "Spotify"), ranked.map { it.label })
        assertEquals(40L, ranked.first().atMs)
    }

    @Test
    fun parseRoundTripSkipsBlankPackages() {
        val parsed = RecentApps.parse("""[{"packageName":"com.openai.chatgpt","className":"Main","label":"ChatGPT","atMs":9},{"packageName":"","label":"Nope"}]""")
        assertEquals(listOf("ChatGPT"), parsed.map { it.label })
    }
}

class WidgetRegistryTest {
    @Test
    fun homePickerIsTheTwoWidgets() {
        assertEquals(
            listOf("Next Action", "Today"),
            WidgetRegistry.picker(WidgetPlacement.HOME).map { it.title },
        )
        assertEquals(
            listOf("Pipeline", "Server"),
            WidgetRegistry.picker(WidgetPlacement.DEVELOPER).map { it.title },
        )
    }
}

class PipelineStatusLabelTest {
    @Test
    fun mapsKnownStatuses() {
        assertEquals("Succeeded", PipelineStatusProvider.statusLabel("succeeded"))
        assertEquals("Running", PipelineStatusProvider.statusLabel("running"))
        assertEquals("Failed", PipelineStatusProvider.statusLabel("failed"))
    }
}

