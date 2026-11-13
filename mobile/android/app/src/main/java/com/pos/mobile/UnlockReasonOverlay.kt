package com.pos.mobile

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.text.InputFilter
import android.text.InputType
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import java.util.concurrent.atomic.AtomicBoolean

object UnlockReasonOverlay {
    private const val TAG = "UnlockReasonOverlay"
    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var overlayView: View? = null

    @Volatile
    private var activePrompt: PhoneUnlockPrompt? = null

    val isShowing: Boolean
        get() = overlayView != null

    fun show(host: Context, unlockTime: Long): Boolean {
        if (overlayView != null) {
            return true
        }
        if (windowTypeFor(host) == null) {
            return false
        }
        if (Looper.myLooper() == Looper.getMainLooper()) {
            return showOnMain(host, unlockTime)
        }
        mainHandler.post { showOnMain(host, unlockTime) }
        return true
    }

    fun hide() {
        hideForSystemDismissal()
    }

    fun hideForSystemDismissal() {
        mainHandler.post { hideOnMain(PhoneUnlockPrompt.STATUS_DISMISSED) }
    }

    fun hideForInterruption() {
        mainHandler.post { hideOnMain(PhoneUnlockPrompt.STATUS_INTERRUPTED) }
    }

    private fun showOnMain(host: Context, unlockTime: Long): Boolean {
        if (overlayView != null) {
            return true
        }
        val windowType = windowTypeFor(host) ?: return false
        val windowContext = host.applicationContext
        PhoneLock.clearPending(windowContext)
        val prompt = PhoneUnlockStore.createPending(windowContext, unlockTime)
        val form = UnlockReasonFormView(windowContext, prompt) { hideOnMain(null) }
        val windowManager = windowContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        // Leave the bottom gesture / Home swipe strip uncovered so open-apps and home
        // still work while the unlock answer overlay is up.
        val bottomGap = OverlayGestureInsets.bottomGapPx(windowContext, windowManager)
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            OverlayGestureInsets.windowHeightPx(windowManager, bottomGap),
            windowType,
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 0
            title = "POS Unlock prompt"
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }
        return try {
            windowManager.addView(form, params)
            overlayView = form
            activePrompt = prompt
            form.requestFocus()
            android.util.Log.d(TAG, "Unlock overlay shown ${prompt.id} bottomGap=$bottomGap")
            true
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not show unlock overlay", error)
            PhoneUnlockStore.resolve(
                context = windowContext,
                prompt = prompt,
                status = PhoneUnlockPrompt.STATUS_INTERRUPTED,
                action = null,
                intentionCode = null,
                triggerCode = null,
                feelingCode = null,
                note = null,
                contextExpanded = false,
                submissionPath = null,
                putDownExecution = null,
            )
            false
        }
    }

    private fun hideOnMain(pendingOutcome: String?) {
        val view = overlayView ?: return
        val prompt = activePrompt
        try {
            val windowManager = view.context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            windowManager.removeView(view)
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not hide unlock overlay", error)
        }
        overlayView = null
        activePrompt = null
        if (pendingOutcome != null && prompt?.status == PhoneUnlockPrompt.STATUS_PENDING) {
            PhoneUnlockStore.resolve(
                context = view.context,
                prompt = prompt,
                status = pendingOutcome,
                action = null,
                intentionCode = null,
                triggerCode = null,
                feelingCode = null,
                note = null,
                contextExpanded = prompt.contextExpanded,
                submissionPath = null,
                putDownExecution = null,
            )
        }
    }

    private fun windowTypeFor(host: Context): Int? {
        val canOverlay = Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
            Settings.canDrawOverlays(host)
        if (!canOverlay) {
            return null
        }
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }
    }
}

private class UnlockReasonFormView(
    context: Context,
    private val prompt: PhoneUnlockPrompt,
    private val dismiss: () -> Unit,
) : LinearLayout(context) {
    private val density = resources.displayMetrics.density
    private val submitting = AtomicBoolean(false)
    private var intention: String? = null
    private var trigger: String? = null
    private var feeling: String? = null
    private var contextExpanded = false
    private val noteField: EditText
    private val contextSection: LinearLayout
    private val continueButton: TextView
    private val addContextButton: TextView
    private val addContextHelper: TextView
    private val noteLabel: TextView
    private val intentionRows = mutableMapOf<String, View>()
    private val triggerChips = mutableMapOf<String, TextView>()
    private val feelingChips = mutableMapOf<String, TextView>()
    private val currentBlockCard: LinearLayout
    private val currentBlockTitle: TextView
    private val currentBlockTime: TextView
    private val currentBlockItems: LinearLayout
    private val currentBlockHint: TextView
    private val statsCard: LinearLayout
    private val todayCountView: TextView
    private val mostOftenView: TextView
    private var usualIntention: String? = null
    private val pauseBanner: LinearLayout
    private val pauseCount: TextView
    private val pauseCaption: TextView
    private val mainHandler = Handler(Looper.getMainLooper())
    private var pauseRemaining = 0
    private var pauseIntention: String? = null
    private var pauseRunnable: Runnable? = null
    private var pendingSubmit: (() -> Unit)? = null

    init {
        orientation = VERTICAL
        gravity = Gravity.CENTER
        isFocusable = true
        isFocusableInTouchMode = true
        descendantFocusability = FOCUS_AFTER_DESCENDANTS
        setBackgroundColor(Color.parseColor("#F2151D1B"))
        // Bottom gesture strip is left outside the overlay window; only pad for content.
        setPadding(dp(16), dp(24), dp(16), dp(16))
        applyImeInsets()

        val scroll = ScrollView(context).apply {
            isFillViewport = true
            descendantFocusability = ViewGroup.FOCUS_BEFORE_DESCENDANTS
            isFocusableInTouchMode = true
        }
        val card = LinearLayout(context).apply {
            orientation = VERTICAL
            background = rounded(Color.parseColor("#1E2925"), dp(20))
            setPadding(dp(18), dp(22), dp(18), dp(18))
        }

        card.addView(text(R.string.unlock_title, Color.parseColor("#EAF0EB"), 22f, true, Gravity.CENTER))
        card.addView(text(R.string.unlock_subtitle, Color.parseColor("#B4C1BA"), 15f, false, Gravity.CENTER).apply {
            setPadding(0, dp(6), 0, dp(10))
        })

        todayCountView = TextView(context).apply {
            setTextColor(Color.parseColor("#A4CDBB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            setTypeface(typeface, Typeface.BOLD)
        }
        mostOftenView = TextView(context).apply {
            setTextColor(Color.parseColor("#B4C1BA"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            setPadding(0, dp(2), 0, 0)
            visibility = GONE
        }
        statsCard = LinearLayout(context).apply {
            orientation = VERTICAL
            background = rounded(Color.parseColor("#26332D"), dp(14))
            setPadding(dp(12), dp(10), dp(12), dp(10))
            addView(todayCountView)
            addView(mostOftenView)
            val params = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
            params.bottomMargin = dp(10)
            layoutParams = params
        }
        card.addView(statsCard)

        currentBlockTitle = TextView(context).apply {
            setTextColor(Color.parseColor("#EAF0EB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            setTypeface(typeface, Typeface.BOLD)
        }
        currentBlockTime = TextView(context).apply {
            setTextColor(Color.parseColor("#B4C1BA"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            setPadding(0, dp(2), 0, 0)
        }
        currentBlockItems = LinearLayout(context).apply {
            orientation = VERTICAL
            setPadding(0, dp(6), 0, 0)
            visibility = GONE
        }
        currentBlockHint = TextView(context).apply {
            text = context.getString(R.string.unlock_open_block)
            setTextColor(Color.parseColor("#A4CDBB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            setPadding(0, dp(8), 0, 0)
        }
        currentBlockCard = LinearLayout(context).apply {
            orientation = VERTICAL
            background = roundedStroke(Color.parseColor("#26332D"), Color.parseColor("#A4CDBB"), dp(14))
            setPadding(dp(12), dp(10), dp(12), dp(10))
            visibility = GONE
            isClickable = true
            isFocusable = true
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
            setOnClickListener { openScheduledWork() }
            addView(text(R.string.unlock_now, Color.parseColor("#A4CDBB"), 11f, true, Gravity.START).apply {
                letterSpacing = 0.08f
            })
            addView(currentBlockTitle)
            addView(currentBlockTime)
            addView(currentBlockItems)
            addView(currentBlockHint)
            val params = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
            params.bottomMargin = dp(14)
            layoutParams = params
        }
        card.addView(currentBlockCard)
        bindCurrentBlock(CurrentBlockStore.read(context))
        PhoneUnlockApi.enqueueCurrentBlockRefresh(context) { snapshot ->
            post { if (isAttachedToWindow) bindCurrentBlock(snapshot) }
        }

        pauseCount = TextView(context).apply {
            setTextColor(Color.parseColor("#A4CDBB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER
        }
        pauseCaption = TextView(context).apply {
            setTextColor(Color.parseColor("#EAF0EB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            gravity = Gravity.CENTER
            setPadding(0, dp(4), 0, 0)
        }
        pauseBanner = LinearLayout(context).apply {
            orientation = VERTICAL
            gravity = Gravity.CENTER
            background = rounded(Color.parseColor("#293F34"), dp(14))
            setPadding(dp(12), dp(12), dp(12), dp(12))
            visibility = GONE
            isClickable = true
            isFocusable = true
            setOnClickListener { cancelPause() }
            addView(pauseCount)
            addView(pauseCaption)
            addView(text(R.string.unlock_pause_cancel, Color.parseColor("#B4C1BA"), 12f, false, Gravity.CENTER).apply {
                setPadding(0, dp(6), 0, 0)
            })
            val params = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
            params.bottomMargin = dp(12)
            layoutParams = params
        }
        card.addView(pauseBanner)

        INTENTIONS.chunked(2).forEach { pair ->
            val row = LinearLayout(context).apply {
                orientation = HORIZONTAL
            }
            pair.forEach { item ->
                val cell = intentionCard(item)
                intentionRows[item.code] = cell
                val params = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f).apply {
                    marginEnd = dp(6)
                    bottomMargin = dp(6)
                }
                row.addView(cell, params)
            }
            if (pair.size == 1) {
                row.addView(View(context), LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
            }
            card.addView(row, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
        }
        bindStats(PhoneUnlockStore.summary(context))

        addContextButton = actionText(R.string.unlock_add_context, Color.parseColor("#A4CDBB")).apply {
            contentDescription = "${context.getString(R.string.unlock_add_context)}. ${context.getString(R.string.unlock_add_context_helper)}"
            setOnClickListener { expandContext() }
        }
        addContextHelper = text(R.string.unlock_add_context_helper, Color.parseColor("#B4C1BA"), 12f, false, Gravity.CENTER)
        card.addView(addContextButton)
        card.addView(addContextHelper)

        contextSection = LinearLayout(context).apply {
            orientation = VERTICAL
            visibility = GONE
            setPadding(0, dp(8), 0, 0)
        }
        contextSection.addView(text(R.string.unlock_context_helper, Color.parseColor("#B4C1BA"), 13f, false, Gravity.START).apply {
            setPadding(0, 0, 0, dp(10))
        })
        contextSection.addView(text(R.string.unlock_trigger_question, Color.parseColor("#EAF0EB"), 14f, true, Gravity.START).apply {
            setPadding(0, 0, 0, dp(6))
        })
        addChipRows(contextSection, TRIGGERS, triggerChips) { code -> toggleTrigger(code) }

        contextSection.addView(text(R.string.unlock_feeling_question, Color.parseColor("#EAF0EB"), 14f, true, Gravity.START).apply {
            setPadding(0, dp(12), 0, dp(6))
        })
        addChipRows(contextSection, FEELINGS, feelingChips) { code -> toggleFeeling(code) }

        noteLabel = text(R.string.unlock_note_label_none, Color.parseColor("#EAF0EB"), 14f, true, Gravity.START).apply {
            setPadding(0, dp(12), 0, dp(6))
        }
        noteField = EditText(context).apply {
            hint = context.getString(R.string.unlock_note_placeholder_optional)
            setHintTextColor(Color.parseColor("#B4C1BA"))
            setTextColor(Color.parseColor("#EAF0EB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            setBackground(rounded(Color.parseColor("#26332D"), dp(12)))
            setPadding(dp(12), dp(12), dp(12), dp(12))
            minHeight = dp(88)
            gravity = Gravity.TOP or Gravity.START
            inputType = InputType.TYPE_CLASS_TEXT or
                InputType.TYPE_TEXT_FLAG_MULTI_LINE or
                InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
            imeOptions = EditorInfo.IME_ACTION_DONE
            filters = arrayOf(InputFilter.LengthFilter(200))
            importantForAutofill = IMPORTANT_FOR_AUTOFILL_NO
            isFocusable = true
            isFocusableInTouchMode = true
        }
        contextSection.addView(noteLabel)
        contextSection.addView(noteField)

        continueButton = filledButton(R.string.unlock_continue).apply {
            visibility = GONE
            setOnClickListener {
                beginOrSubmit(
                    status = PhoneUnlockPrompt.STATUS_ANSWERED,
                    action = PhoneUnlockPrompt.ACTION_CONTINUE,
                    path = PhoneUnlockPrompt.PATH_CONTEXT,
                    keepContext = true,
                )
            }
        }
        contextSection.addView(continueButton)
        card.addView(contextSection)

        card.addView(outlineButton(R.string.unlock_put_phone_down).apply {
            setOnClickListener { putPhoneDown() }
        })
        card.addView(actionText(R.string.unlock_check_in_offer, Color.parseColor("#A4CDBB")).apply {
            contentDescription = context.getString(R.string.unlock_check_in_offer)
            setOnClickListener {
                submit(
                    status = PhoneUnlockPrompt.STATUS_ANSWERED,
                    action = PhoneUnlockPrompt.ACTION_CONTINUE,
                    path = if (contextExpanded) PhoneUnlockPrompt.PATH_CONTEXT else PhoneUnlockPrompt.PATH_DIRECT,
                    keepContext = contextExpanded,
                    openCheckIn = true,
                )
            }
        })
        card.addView(actionText(R.string.unlock_skip, Color.parseColor("#B4C1BA")).apply {
            setOnClickListener {
                cancelPause()
                submit(
                    status = PhoneUnlockPrompt.STATUS_SKIPPED,
                    action = PhoneUnlockPrompt.ACTION_SKIP,
                    path = PhoneUnlockPrompt.PATH_DIRECT,
                    keepContext = false,
                )
            }
        })

        scroll.addView(
            card,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        )
        addView(scroll, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    }

    override fun onDetachedFromWindow() {
        cancelPause()
        super.onDetachedFromWindow()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
            cancelPause()
            submit(
                status = PhoneUnlockPrompt.STATUS_DISMISSED,
                action = null,
                path = null,
                keepContext = false,
            )
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    private fun expandContext() {
        contextExpanded = true
        prompt.contextExpanded = true
        PhoneUnlockStore.update(context, prompt)
        contextSection.visibility = VISIBLE
        continueButton.visibility = VISIBLE
        addContextButton.visibility = GONE
        addContextHelper.visibility = GONE
        refreshIntentionRows()
    }

    private fun toggleTrigger(code: String) {
        trigger = if (trigger == code) null else code
        refreshChips(triggerChips, trigger, announceCode = code)
    }

    private fun toggleFeeling(code: String) {
        feeling = if (feeling == code) null else code
        refreshChips(feelingChips, feeling, announceCode = code)
    }

    private fun onIntention(code: String) {
        if (contextExpanded) {
            cancelPause()
            intention = if (intention == code) null else code
            refreshIntentionRows()
            refreshNoteCopy()
            intentionRows[code]?.announceForAccessibility(
                intentionRows[code]?.contentDescription
            )
            return
        }
        if (pauseIntention == code) {
            cancelPause()
            return
        }
        intention = code
        beginOrSubmit(
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            action = PhoneUnlockPrompt.ACTION_CONTINUE,
            path = PhoneUnlockPrompt.PATH_QUICK,
            keepContext = false,
        )
    }

    private fun beginOrSubmit(
        status: String,
        action: String?,
        path: String?,
        keepContext: Boolean,
        putDownExecution: String? = null,
        openCheckIn: Boolean = false,
        lockAfter: Boolean = false,
        openWork: Boolean = false,
    ) {
        if (
            !openWork &&
            action == PhoneUnlockPrompt.ACTION_CONTINUE &&
            PhoneUnlockResolution.needsPause(intention)
        ) {
            startPause {
                submit(status, action, path, keepContext, putDownExecution, openCheckIn, lockAfter, openWork)
            }
            return
        }
        submit(status, action, path, keepContext, putDownExecution, openCheckIn, lockAfter, openWork)
    }

    private fun openScheduledWork() {
        cancelPause()
        intention = "specific_task"
        refreshIntentionRows()
        beginOrSubmit(
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            action = PhoneUnlockPrompt.ACTION_CONTINUE,
            path = PhoneUnlockPrompt.PATH_QUICK,
            keepContext = false,
            openWork = true,
        )
    }

    private fun launchApp() {
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            context.startActivity(launch)
        }
    }

    private fun startPause(then: () -> Unit) {
        cancelPause(clearIntention = false)
        pauseIntention = intention
        pendingSubmit = then
        pauseRemaining = PhoneUnlockResolution.PAUSE_SECONDS
        pauseBanner.visibility = VISIBLE
        refreshIntentionRows()
        updatePauseCopy()
        pauseBanner.announceForAccessibility(pauseCaption.text)
        val tick = object : Runnable {
            override fun run() {
                pauseRemaining -= 1
                if (pauseRemaining <= 0) {
                    val next = pendingSubmit
                    cancelPause(clearIntention = false)
                    next?.invoke()
                    return
                }
                updatePauseCopy()
                mainHandler.postDelayed(this, 1000)
            }
        }
        pauseRunnable = tick
        mainHandler.postDelayed(tick, 1000)
    }

    private fun updatePauseCopy() {
        pauseCount.text = pauseRemaining.toString()
        val label = when (pauseIntention) {
            "social_check" -> context.getString(R.string.unlock_pause_social, pauseRemaining)
            else -> context.getString(R.string.unlock_pause_automatic, pauseRemaining)
        }
        pauseCaption.text = label
        pauseBanner.contentDescription = "${context.getString(R.string.unlock_pause_title)}. $label. ${context.getString(R.string.unlock_pause_cancel)}"
    }

    private fun cancelPause(clearIntention: Boolean = true) {
        pauseRunnable?.let { mainHandler.removeCallbacks(it) }
        pauseRunnable = null
        pendingSubmit = null
        pauseRemaining = 0
        pauseBanner.visibility = GONE
        if (clearIntention) {
            pauseIntention = null
        }
        if (clearIntention && !contextExpanded) {
            intention = null
            refreshIntentionRows()
        }
    }

    private fun putPhoneDown() {
        cancelPause()
        val execution = PhoneLock.prepare(context)
        submit(
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            action = PhoneUnlockPrompt.ACTION_PUT_DOWN,
            path = PhoneUnlockPrompt.PATH_DIRECT,
            keepContext = contextExpanded,
            putDownExecution = execution,
            lockAfter = true,
        )
    }

    private fun bindCurrentBlock(snapshot: CurrentBlockSnapshot?) {
        if (snapshot == null) {
            currentBlockCard.visibility = GONE
            return
        }
        currentBlockTitle.text = snapshot.title
        val range = snapshot.timeRange()
        currentBlockTime.text = range ?: ""
        currentBlockTime.visibility = if (range == null) GONE else VISIBLE
        currentBlockItems.removeAllViews()
        val visibleItems = snapshot.items.take(5)
        if (visibleItems.isEmpty()) {
            currentBlockItems.visibility = GONE
        } else {
            currentBlockItems.visibility = VISIBLE
            visibleItems.forEach { item ->
                currentBlockItems.addView(TextView(context).apply {
                    text = if (item.completed) "✓  ${item.title}" else "○  ${item.title}"
                    setTextColor(if (item.completed) Color.parseColor("#B4C1BA") else Color.parseColor("#EAF0EB"))
                    setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
                    setPadding(0, dp(3), 0, 0)
                })
            }
            val extra = snapshot.items.size - visibleItems.size
            if (extra > 0) {
                currentBlockItems.addView(TextView(context).apply {
                    text = "+$extra more"
                    setTextColor(Color.parseColor("#B4C1BA"))
                    setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
                    setPadding(0, dp(3), 0, 0)
                })
            }
        }
        currentBlockCard.visibility = VISIBLE
        currentBlockCard.contentDescription = buildString {
            append(context.getString(R.string.unlock_now))
            append(". ")
            append(snapshot.title)
            if (range != null) {
                append(". ")
                append(range)
            }
            visibleItems.forEach { item ->
                append(". ")
                append(item.title)
            }
            append(". ")
            append(context.getString(R.string.unlock_open_block))
        }
    }

    private fun bindStats(stats: UnlockStats) {
        usualIntention = stats.mostCommonIntention
        val countLabel = if (stats.todayCount == 1) {
            context.getString(R.string.unlock_today_count_one, stats.todayCount)
        } else {
            context.getString(R.string.unlock_today_count_other, stats.todayCount)
        }
        todayCountView.text = countLabel
        val usualLabel = stats.mostCommonIntention?.let { code ->
            if (code == "pay") {
                context.getString(R.string.unlock_intention_pay)
            } else {
                INTENTIONS.find { it.code == code }?.let { context.getString(it.label) }
            }
        }
        if (usualLabel == null) {
            mostOftenView.visibility = GONE
            statsCard.contentDescription = countLabel
        } else {
            val line = context.getString(R.string.unlock_most_often, usualLabel)
            mostOftenView.text = line
            mostOftenView.visibility = VISIBLE
            statsCard.contentDescription = "$countLabel. $line"
        }
        refreshIntentionRows()
    }

    private fun submit(
        status: String,
        action: String?,
        path: String?,
        keepContext: Boolean,
        putDownExecution: String? = null,
        openCheckIn: Boolean = false,
        lockAfter: Boolean = false,
        openWork: Boolean = false,
    ) {
        cancelPause(clearIntention = false)
        if (!submitting.compareAndSet(false, true)) {
            return
        }
        val skip = action == PhoneUnlockPrompt.ACTION_SKIP
        val decision = PhoneUnlockResolution.fromUserChoice(
            skip = skip,
            keepContext = keepContext,
            contextExpanded = contextExpanded,
            intention = intention,
            trigger = trigger,
            feeling = feeling,
            note = noteField.text?.toString(),
            action = action,
            status = status,
            path = path,
            putDownExecution = putDownExecution,
        )
        PhoneUnlockStore.resolve(
            context = context,
            prompt = prompt,
            status = decision.status,
            action = decision.action,
            intentionCode = decision.intentionCode,
            triggerCode = decision.triggerCode,
            feelingCode = decision.feelingCode,
            note = decision.note,
            contextExpanded = decision.contextExpanded,
            submissionPath = decision.submissionPath,
            putDownExecution = decision.putDownExecution,
        )
        if (openCheckIn) {
            PhoneUnlockStore.setPendingCheckInOffer(context, prompt.id)
            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launch != null) {
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                context.startActivity(launch)
            }
        }
        if (openWork) {
            val snapshot = CurrentBlockStore.read(context)
            val blockId = snapshot?.id?.trim().orEmpty().ifEmpty { "current" }
            PhoneUnlockStore.setPendingWorkBlock(context, blockId)
            launchApp()
        }
        dismiss()
        if (lockAfter) {
            mainHandler.post { PhoneLock.complete(context) }
        }
    }

    private fun intentionCard(item: IntentionItem): View {
        val card = LinearLayout(context).apply {
            orientation = VERTICAL
            gravity = Gravity.START
            background = rounded(Color.parseColor("#26332D"), dp(14))
            setPadding(dp(10), dp(10), dp(10), dp(10))
            minimumHeight = dp(88)
            isClickable = true
            isFocusable = true
            contentDescription = "${context.getString(item.label)}. ${context.getString(item.support)}"
            setOnClickListener { onIntention(item.code) }
            bindPressedState(this, Color.parseColor("#26332D"), Color.parseColor("#293F34"), dp(14))
        }
        val icon = TextView(context).apply {
            text = item.icon
            setTextColor(Color.parseColor("#A4CDBB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            gravity = Gravity.START
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
            setPadding(0, 0, 0, dp(6))
        }
        card.addView(icon)
        card.addView(text(item.label, Color.parseColor("#EAF0EB"), 14f, true, Gravity.START).apply {
            setLineSpacing(0f, 1.05f)
        })
        card.addView(text(item.support, Color.parseColor("#B4C1BA"), 11f, false, Gravity.START).apply {
            setPadding(0, dp(3), 0, 0)
            setLineSpacing(0f, 1.1f)
        })
        card.addView(TextView(context).apply {
            text = context.getString(R.string.unlock_most_often_badge)
            setTextColor(Color.parseColor("#A4CDBB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            setPadding(0, dp(4), 0, 0)
            visibility = GONE
            tag = "usual"
        })
        return card
    }

    private fun refreshIntentionRows() {
        INTENTIONS.forEach { item ->
            val row = intentionRows[item.code] ?: return@forEach
            val selected = intention == item.code
            row.background = rounded(
                if (selected) Color.parseColor("#293F34") else Color.parseColor("#26332D"),
                dp(14)
            )
            val usual = item.code == usualIntention
            (row.findViewWithTag<TextView>("usual"))?.visibility = if (usual) VISIBLE else GONE
            row.contentDescription = buildString {
                append(context.getString(item.label))
                append(". ")
                append(context.getString(item.support))
                if (usual) {
                    append(". ")
                    append(context.getString(R.string.unlock_most_often_badge))
                }
                if (selected) {
                    append(". ")
                    append(context.getString(R.string.unlock_selected))
                }
            }
        }
    }

    private fun refreshNoteCopy() {
        val copy = when (intention) {
            "specific_task" -> R.string.unlock_note_label_specific_task to R.string.unlock_note_placeholder_specific_task
            "connection" -> R.string.unlock_note_label_connection to R.string.unlock_note_placeholder_connection
            "intentional_break" -> R.string.unlock_note_label_intentional_break to R.string.unlock_note_placeholder_intentional_break
            "social_check" -> R.string.unlock_note_label_social_check to R.string.unlock_note_placeholder_social_check
            "pay" -> R.string.unlock_note_label_pay to R.string.unlock_note_placeholder_pay
            "automatic_check" -> R.string.unlock_note_label_automatic_check to R.string.unlock_note_placeholder_automatic_check
            "spotify" -> R.string.unlock_note_label_spotify to R.string.unlock_note_placeholder_spotify
            "other" -> R.string.unlock_note_label_other to R.string.unlock_note_placeholder_optional
            else -> R.string.unlock_note_label_none to R.string.unlock_note_placeholder_optional
        }
        noteLabel.setText(copy.first)
        noteField.setHint(copy.second)
    }

    private fun addChipRows(
        parent: LinearLayout,
        items: List<ChipItem>,
        map: MutableMap<String, TextView>,
        onTap: (String) -> Unit,
    ) {
        items.chunked(2).forEach { pair ->
            val row = LinearLayout(context).apply {
                orientation = HORIZONTAL
            }
            pair.forEach { item ->
                val chip = TextView(context).apply {
                    text = context.getString(item.label)
                    setTextColor(Color.parseColor("#EAF0EB"))
                    setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
                    gravity = Gravity.CENTER
                    background = rounded(Color.parseColor("#26332D"), dp(18))
                    setPadding(dp(10), dp(10), dp(10), dp(10))
                    minimumHeight = dp(48)
                    isClickable = true
                    isFocusable = true
                    contentDescription = context.getString(item.label)
                    setOnClickListener { onTap(item.code) }
                }
                map[item.code] = chip
                val params = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f).apply {
                    marginEnd = dp(6)
                    bottomMargin = dp(6)
                }
                row.addView(chip, params)
            }
            if (pair.size == 1) {
                row.addView(View(context), LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
            }
            parent.addView(row)
        }
    }

    private fun refreshChips(map: Map<String, TextView>, selected: String?, announceCode: String? = null) {
        map.forEach { (code, chip) ->
            val isSelected = code == selected
            chip.background = rounded(
                if (isSelected) Color.parseColor("#293F34") else Color.parseColor("#26332D"),
                dp(18)
            )
            chip.setTextColor(if (isSelected) Color.parseColor("#A4CDBB") else Color.parseColor("#EAF0EB"))
            chip.contentDescription = buildString {
                append(chip.text)
                if (isSelected) {
                    append(". ")
                    append(context.getString(R.string.unlock_selected))
                }
            }
            if (code == announceCode) {
                chip.announceForAccessibility(chip.contentDescription)
            }
        }
    }

    private fun filledButton(label: Int): TextView {
        return TextView(context).apply {
            text = context.getString(label)
            setTextColor(Color.parseColor("#152B23"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER
            background = rounded(Color.parseColor("#A4CDBB"), dp(14))
            setPadding(dp(14), dp(14), dp(14), dp(14))
            minimumHeight = dp(48)
            isClickable = true
            isFocusable = true
            val params = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
            params.topMargin = dp(12)
            layoutParams = params
        }
    }

    private fun outlineButton(label: Int): TextView {
        return TextView(context).apply {
            text = context.getString(label)
            setTextColor(Color.parseColor("#A4CDBB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            gravity = Gravity.CENTER
            background = roundedStroke(Color.parseColor("#293F34"), Color.parseColor("#A4CDBB"), dp(14))
            setPadding(dp(14), dp(14), dp(14), dp(14))
            minimumHeight = dp(48)
            isClickable = true
            isFocusable = true
            val params = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
            params.topMargin = dp(12)
            layoutParams = params
        }
    }

    private fun actionText(label: Int, color: Int): TextView {
        return TextView(context).apply {
            text = context.getString(label)
            setTextColor(color)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(12), dp(8), dp(8))
            minimumHeight = dp(48)
            isClickable = true
            isFocusable = true
        }
    }

    private fun text(label: Int, color: Int, size: Float, bold: Boolean, gravity: Int): TextView {
        return TextView(context).apply {
            setText(label)
            setTextColor(color)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, size)
            this.gravity = gravity
            if (bold) {
                setTypeface(typeface, Typeface.BOLD)
            }
        }
    }

    private fun rounded(color: Int, radius: Int): GradientDrawable {
        return GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius.toFloat()
        }
    }

    private fun roundedStroke(fill: Int, stroke: Int, radius: Int): GradientDrawable {
        return GradientDrawable().apply {
            setColor(fill)
            setStroke(dp(1), stroke)
            cornerRadius = radius.toFloat()
        }
    }

    private fun bindPressedState(view: View, idle: Int, pressed: Int, radius: Int) {
        view.setOnTouchListener { target, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> target.background = rounded(pressed, radius)
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (target !in intentionRows.values) {
                        target.background = rounded(idle, radius)
                    } else {
                        refreshIntentionRows()
                    }
                }
            }
            false
        }
    }

    private fun applyImeInsets() {
        setOnApplyWindowInsetsListener { view, insets ->
            // Keyboard only — nav/gesture bottom is already excluded from the window height.
            val imeBottom = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                insets.getInsets(WindowInsets.Type.ime()).bottom
            } else {
                @Suppress("DEPRECATION")
                insets.systemWindowInsetBottom
            }
            view.setPadding(dp(16), dp(24), dp(16), dp(16) + imeBottom)
            insets
        }
    }

    private fun dp(value: Int) = (value * density).toInt()

    private data class IntentionItem(val code: String, val label: Int, val support: Int, val icon: String)
    private data class ChipItem(val code: String, val label: Int)

    companion object {
        private val INTENTIONS = listOf(
            IntentionItem("specific_task", R.string.unlock_intention_specific_task, R.string.unlock_intention_specific_task_support, "✓"),
            IntentionItem("connection", R.string.unlock_intention_connection, R.string.unlock_intention_connection_support, "◎"),
            IntentionItem("intentional_break", R.string.unlock_intention_intentional_break, R.string.unlock_intention_intentional_break_support, "♪"),
            IntentionItem("social_check", R.string.unlock_intention_social_check, R.string.unlock_intention_social_check_support, "☰"),
            IntentionItem("automatic_check", R.string.unlock_intention_automatic_check, R.string.unlock_intention_automatic_check_support, "↻"),
            IntentionItem("spotify", R.string.unlock_intention_spotify, R.string.unlock_intention_spotify_support, "♫"),
            IntentionItem("other", R.string.unlock_intention_other, R.string.unlock_intention_other_support, "+"),
        )
        private val TRIGGERS = listOf(
            ChipItem("notification", R.string.unlock_trigger_notification),
            ChipItem("task_cue", R.string.unlock_trigger_task_cue),
            ChipItem("boredom_waiting", R.string.unlock_trigger_boredom_waiting),
            ChipItem("difficult_moment", R.string.unlock_trigger_difficult_moment),
            ChipItem("connection_need", R.string.unlock_trigger_connection_need),
            ChipItem("curiosity_updates", R.string.unlock_trigger_curiosity_updates),
            ChipItem("habit_no_clear_cue", R.string.unlock_trigger_habit_no_clear_cue),
            ChipItem("other", R.string.unlock_trigger_other),
            ChipItem("unsure", R.string.unlock_trigger_unsure),
        )
        private val FEELINGS = listOf(
            ChipItem("calm", R.string.unlock_feeling_calm),
            ChipItem("bored", R.string.unlock_feeling_bored),
            ChipItem("stressed", R.string.unlock_feeling_stressed),
            ChipItem("low", R.string.unlock_feeling_low),
            ChipItem("lonely", R.string.unlock_feeling_lonely),
            ChipItem("restless", R.string.unlock_feeling_restless),
            ChipItem("tired", R.string.unlock_feeling_tired),
            ChipItem("okay", R.string.unlock_feeling_okay),
            ChipItem("other", R.string.unlock_feeling_other),
            ChipItem("unsure", R.string.unlock_feeling_unsure),
        )
    }
}
