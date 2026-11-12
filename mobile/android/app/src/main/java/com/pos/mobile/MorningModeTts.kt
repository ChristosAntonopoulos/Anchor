package com.pos.mobile

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

object MorningModeTts : TextToSpeech.OnInitListener {
    @Volatile
    private var engine: TextToSpeech? = null

    @Volatile
    private var ready = false

    fun ensure(context: Context) {
        if (engine != null) return
        engine = TextToSpeech(context.applicationContext, this)
    }

    override fun onInit(status: Int) {
        ready = status == TextToSpeech.SUCCESS
        if (!ready) return
        val greek = Locale("el", "GR")
        val result = engine?.setLanguage(greek)
        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
            engine?.language = Locale.getDefault()
        }
        engine?.setSpeechRate(0.92f)
        engine?.setPitch(0.96f)
    }

    fun speak(text: String) {
        if (text.isBlank() || !ready) return
        engine?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "morning-${text.hashCode()}")
    }

    fun stop() {
        engine?.stop()
    }

    fun shutdown() {
        engine?.stop()
        engine?.shutdown()
        engine = null
        ready = false
    }
}
