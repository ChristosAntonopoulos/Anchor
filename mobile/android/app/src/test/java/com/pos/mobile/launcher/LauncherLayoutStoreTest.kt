package com.pos.mobile.launcher

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LauncherLayoutStoreTest {
    @Test
    fun defaultHomeHasNextActionAndToday() {
        val layout = LauncherLayoutStore.defaultLayout()
        assertEquals(listOf(WidgetRegistry.NEXT_ACTION, WidgetRegistry.TODAY), layout.homeWidgets().map { it.typeId })
        assertEquals(listOf(WidgetRegistry.PIPELINE, WidgetRegistry.CLUSTER), layout.developerWidgets().map { it.typeId })
    }

    @Test
    fun migratesTradingBotAndServerToLiveDeveloperCards() {
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
        assertEquals(listOf(WidgetRegistry.PIPELINE, WidgetRegistry.CLUSTER), layout.developerWidgets().map { it.typeId })
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
    fun dockHasPhoneWalletChatGptCursorAndSpotify() {
        assertEquals("Phone", InstalledApps.PHONE_APP.label)
        assertEquals("Wallet", InstalledApps.WALLET_APP.label)
        assertEquals("ChatGPT", InstalledApps.CHATGPT_APP.label)
        assertEquals("Cursor", InstalledApps.CURSOR_APP.label)
        assertEquals("Spotify", InstalledApps.SPOTIFY_APP.label)
        assertTrue(InstalledApps.PHONE_APP.packages.contains("com.google.android.dialer"))
        assertTrue(InstalledApps.PHONE_APP.packages.contains("com.android.dialer"))
        assertTrue(InstalledApps.CURSOR_APP.packages.contains("com.anysphere.cursor"))
        assertTrue(InstalledApps.SPOTIFY_APP.packages.contains("com.spotify.music"))
        assertEquals(DockMark.PHONE, InstalledApps.PHONE_APP.mark)
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
            listOf("Pipeline", "Cluster", "Server"),
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

class K8sWidgetParseTest {
    @Test
    fun parsesWidgetPayload() {
        val json = org.json.JSONObject(
            """
            {
              "status":"attention",
              "headline":"1 app needs attention",
              "generatedAt":"2026-11-13T16:00:00.000Z",
              "partial":false,
              "notes":[],
              "cluster":{"status":"healthy","nodesReady":3,"nodesTotal":3},
              "counts":{"appsHealthy":4,"appsDegraded":1,"appsOffline":0,"appsStarting":0,"podsRunning":12,"podsWithProblems":1,"deploymentsReady":5,"deploymentsTotal":6},
              "apps":[{"name":"pos-api","namespace":"pos","appKey":"pos-api","status":"Healthy","ready":"1/1","panelPath":"/apps/pos-api"}],
              "highlights":[{"severity":"warning","kind":"pod","name":"botsystem-api","namespace":"botsystem","status":"CrashLoop","detail":"Restarting","logsPath":"/api/pods/x/logs","panelPath":"/pods/x"}]
            }
            """.trimIndent(),
        )
        val snap = K8sWidgetSnapshot.fromJson(json)
        assertEquals("attention", snap.status)
        assertEquals(3, snap.nodesReady)
        assertEquals(4, snap.healthyCount())
        assertEquals(1, snap.problemsCount())
        assertEquals("pos-api", snap.apps.single().name)
        assertEquals("/api/pods/x/logs", snap.highlights.single().logsPath)
        assertTrue(snap.countsLine().contains("Nodes 3/3"))
        assertEquals("Attention", K8sStatusProvider.statusLabel("attention"))
        assertEquals("Critical", K8sStatusProvider.statusLabel("critical"))
    }

    @Test
    fun notDeployedPlaceholder() {
        val snap = K8sWidgetSnapshot.notDeployed()
        assertTrue(snap.notDeployed)
        assertEquals("unknown", snap.status)
    }

    @Test
    fun mapsAppsAndOverviewFallback() {
        val apps = org.json.JSONObject(
            """
            {
              "lastUpdated":"2026-11-13T17:00:00.0000000Z",
              "summary":{"total":3,"healthy":1,"degraded":0,"offline":2,"starting":0,"unknown":0},
              "apps":[
                {"appKey":"ok","displayName":"Ok App","namespace":"ok","userStatus":"Healthy","isSystem":false,"readyPods":1,"totalPods":1,"primaryUrl":null,"statusReason":""},
                {"appKey":"agrotrack","displayName":"Agrotrack","namespace":"agrotrack-backend","userStatus":"Offline","isSystem":false,"readyPods":0,"totalPods":1,"primaryUrl":null,"statusReason":"CrashLoopBackOff: restarting"},
                {"appKey":"worker","displayName":"Worker","namespace":"botsystem","userStatus":"Offline","isSystem":false,"readyPods":0,"totalPods":0,"primaryUrl":null,"statusReason":"Component worker is not fully ready."}
              ]
            }
            """.trimIndent(),
        )
        val overview = org.json.JSONObject(
            """
            {
              "healthStatus":"Warning",
              "totalNodes":1,
              "readyNodes":0,
              "runningPods":10,
              "failedPods":0,
              "pendingPods":0,
              "nodeStatusBreakdown":{"True":1},
              "lastUpdated":"2026-11-13T17:00:00.0000000Z"
            }
            """.trimIndent(),
        )
        val snap = K8sWidgetSnapshot.fromAppsAndOverview(apps, overview, includeSystem = false)
        assertEquals("critical", snap.status)
        assertEquals("2 apps offline", snap.headline)
        assertEquals(1, snap.nodesReady)
        assertEquals(1, snap.nodesTotal)
        assertEquals(1, snap.appsHealthy)
        assertEquals(2, snap.appsOffline)
        assertEquals(2, snap.problemsCount())
        assertTrue(snap.countsLine().contains("Nodes 1/1"))
        assertEquals("Agrotrack", snap.highlights.first().name)
        assertEquals("CrashLoopBackOff", snap.highlights.first().detail)
        assertEquals("/apps/agrotrack", snap.highlights.first().panelPath)
        assertTrue(!snap.notDeployed)
    }
}

