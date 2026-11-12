package com.pos.mobile.launcher

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LauncherLayoutStoreTest {
    @Test
    fun defaultHomeHasNextActionAndToday() {
        val layout = LauncherLayoutStore.defaultLayout()
        assertEquals(listOf(WidgetRegistry.NEXT_ACTION, WidgetRegistry.TODAY), layout.homeWidgets().map { it.typeId })
        assertEquals(listOf(WidgetRegistry.SERVER, WidgetRegistry.TRADING_BOT), layout.developerWidgets().map { it.typeId })
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
}

class WidgetRegistryTest {
    @Test
    fun homePickerIsTheTwoWidgets() {
        assertEquals(
            listOf("Next Action", "Today"),
            WidgetRegistry.picker(WidgetPlacement.HOME).map { it.title },
        )
        assertEquals(
            listOf("Server", "Trading bot"),
            WidgetRegistry.picker(WidgetPlacement.DEVELOPER).map { it.title },
        )
    }
}
