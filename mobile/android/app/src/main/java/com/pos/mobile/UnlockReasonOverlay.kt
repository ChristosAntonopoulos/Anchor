package com.pos.mobile

import android.content.Context
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
        val prompt = PhoneUnlockStore.createPending(windowContext, unlockTime)
        val form = UnlockReasonFormView(windowContext, prompt) { hideOnMain(null) }
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            windowType,
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
            title = "POS Unlock prompt"
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }
        return try {
            val windowManager = windowContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            windowManager.addView(form, params)
            overlayView = form
            activePrompt = prompt
            form.requestFocus()
            android.util.Log.d(TAG, "Unlock overlay shown ${prompt.id}")
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

    init {
        orientation = VERTICAL
        gravity = Gravity.CENTER
        isFocusable = true
        isFocusableInTouchMode = true
        descendantFocusability = FOCUS_AFTER_DESCENDANTS
        setBackgroundColor(Color.parseColor("#F20F1419"))
        val inset = systemBottomInset()
        setPadding(dp(16), dp(24), dp(16), dp(16) + inset)
        applyImeInsets()

        val scroll = ScrollView(context).apply {
            isFillViewport = true
            descendantFocusability = ViewGroup.FOCUS_BEFORE_DESCENDANTS
            isFocusableInTouchMode = true
        }
        val card = LinearLayout(context).apply {
            orientation = VERTICAL
            background = rounded(Color.parseColor("#1E2530"), dp(20))
            setPadding(dp(18), dp(22), dp(18), dp(18))
        }

        card.addView(text(R.string.unlock_title, Color.parseColor("#E8EAED"), 22f, true, Gravity.CENTER))
        card.addView(text(R.string.unlock_subtitle, Color.parseColor("#8B95A6"), 15f, false, Gravity.CENTER).apply {
            setPadding(0, dp(6), 0, dp(14))
        })

        INTENTIONS.forEach { item ->
            val row = intentionRow(item)
            intentionRows[item.code] = row
            card.addView(row)
        }

        addContextButton = actionText(R.string.unlock_add_context, Color.parseColor("#C7E5CD")).apply {
            contentDescription = "${context.getString(R.string.unlock_add_context)}. ${context.getString(R.string.unlock_add_context_helper)}"
            setOnClickListener { expandContext() }
        }
        addContextHelper = text(R.string.unlock_add_context_helper, Color.parseColor("#8B95A6"), 12f, false, Gravity.CENTER)
        card.addView(addContextButton)
        card.addView(addContextHelper)

        contextSection = LinearLayout(context).apply {
            orientation = VERTICAL
            visibility = GONE
            setPadding(0, dp(8), 0, 0)
        }
        contextSection.addView(text(R.string.unlock_context_helper, Color.parseColor("#8B95A6"), 13f, false, Gravity.START).apply {
            setPadding(0, 0, 0, dp(10))
        })
        contextSection.addView(text(R.string.unlock_trigger_question, Color.parseColor("#E8EAED"), 14f, true, Gravity.START).apply {
            setPadding(0, 0, 0, dp(6))
        })
        addChipRows(contextSection, TRIGGERS, triggerChips) { code -> toggleTrigger(code) }

        contextSection.addView(text(R.string.unlock_feeling_question, Color.parseColor("#E8EAED"), 14f, true, Gravity.START).apply {
            setPadding(0, dp(12), 0, dp(6))
        })
        addChipRows(contextSection, FEELINGS, feelingChips) { code -> toggleFeeling(code) }

        noteLabel = text(R.string.unlock_note_label_none, Color.parseColor("#E8EAED"), 14f, true, Gravity.START).apply {
            setPadding(0, dp(12), 0, dp(6))
        }
        noteField = EditText(context).apply {
            hint = context.getString(R.string.unlock_note_placeholder_optional)
            setHintTextColor(Color.parseColor("#8B95A6"))
            setTextColor(Color.parseColor("#E8EAED"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            setBackground(rounded(Color.parseColor("#252B38"), dp(12)))
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
                submit(
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
            setOnClickListener {
                submit(
                    status = PhoneUnlockPrompt.STATUS_ANSWERED,
                    action = PhoneUnlockPrompt.ACTION_PUT_DOWN,
                    path = PhoneUnlockPrompt.PATH_DIRECT,
                    keepContext = contextExpanded,
                    putDownExecution = PhoneUnlockPrompt.PUT_DOWN_OVERLAY,
                )
            }
        })
        card.addView(actionText(R.string.unlock_skip, Color.parseColor("#8B95A6")).apply {
            setOnClickListener {
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

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
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
            intention = if (intention == code) null else code
            refreshIntentionRows()
            refreshNoteCopy()
            intentionRows[code]?.announceForAccessibility(
                intentionRows[code]?.contentDescription
            )
            return
        }
        intention = code
        submit(
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            action = PhoneUnlockPrompt.ACTION_CONTINUE,
            path = PhoneUnlockPrompt.PATH_QUICK,
            keepContext = false,
        )
    }

    private fun submit(
        status: String,
        action: String?,
        path: String?,
        keepContext: Boolean,
        putDownExecution: String? = null,
    ) {
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
        dismiss()
    }

    private fun intentionRow(item: IntentionItem): View {
        val row = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = rounded(Color.parseColor("#252B38"), dp(14))
            setPadding(dp(12), dp(10), dp(12), dp(10))
            minimumHeight = dp(48)
            isClickable = true
            isFocusable = true
            contentDescription = "${context.getString(item.label)}. ${context.getString(item.support)}"
            setOnClickListener { onIntention(item.code) }
            bindPressedState(this, Color.parseColor("#252B38"), Color.parseColor("#31443C"), dp(14))
        }
        val icon = TextView(context).apply {
            text = item.icon
            setTextColor(Color.parseColor("#C7E5CD"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            width = dp(24)
            gravity = Gravity.CENTER
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
        }
        val copy = LinearLayout(context).apply {
            orientation = VERTICAL
            setPadding(dp(8), 0, 0, 0)
        }
        copy.addView(text(item.label, Color.parseColor("#E8EAED"), 15f, true, Gravity.START))
        copy.addView(text(item.support, Color.parseColor("#8B95A6"), 12f, false, Gravity.START))
        row.addView(icon)
        row.addView(copy, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        val params = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = dp(8)
        }
        row.layoutParams = params
        return row
    }

    private fun refreshIntentionRows() {
        INTENTIONS.forEach { item ->
            val row = intentionRows[item.code] ?: return@forEach
            val selected = intention == item.code
            row.background = rounded(
                if (selected) Color.parseColor("#31443C") else Color.parseColor("#252B38"),
                dp(14)
            )
            row.contentDescription = buildString {
                append(context.getString(item.label))
                append(". ")
                append(context.getString(item.support))
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
            "automatic_check" -> R.string.unlock_note_label_automatic_check to R.string.unlock_note_placeholder_automatic_check
            "unsure" -> R.string.unlock_note_label_unsure to R.string.unlock_note_placeholder_optional
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
                    setTextColor(Color.parseColor("#E8EAED"))
                    setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
                    gravity = Gravity.CENTER
                    background = rounded(Color.parseColor("#252B38"), dp(18))
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
                if (isSelected) Color.parseColor("#31443C") else Color.parseColor("#252B38"),
                dp(18)
            )
            chip.setTextColor(if (isSelected) Color.parseColor("#C7E5CD") else Color.parseColor("#E8EAED"))
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
            setTextColor(Color.parseColor("#132E2A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER
            background = rounded(Color.parseColor("#C7E5CD"), dp(14))
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
            setTextColor(Color.parseColor("#C7E5CD"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            gravity = Gravity.CENTER
            background = roundedStroke(Color.parseColor("#31443C"), Color.parseColor("#C7E5CD"), dp(14))
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
            val bottom = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                maxOf(
                    insets.getInsets(WindowInsets.Type.ime()).bottom,
                    insets.getInsets(WindowInsets.Type.systemBars()).bottom,
                )
            } else {
                @Suppress("DEPRECATION")
                insets.systemWindowInsetBottom
            }
            view.setPadding(dp(16), dp(24), dp(16), dp(16) + bottom)
            insets
        }
    }

    private fun systemBottomInset(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            windowManager.currentWindowMetrics.windowInsets
                .getInsets(WindowInsets.Type.systemBars())
                .bottom
        } else {
            dp(16)
        }
    }

    private fun dp(value: Int) = (value * density).toInt()

    private data class IntentionItem(val code: String, val label: Int, val support: Int, val icon: String)
    private data class ChipItem(val code: String, val label: Int)

    companion object {
        private val INTENTIONS = listOf(
            IntentionItem("specific_task", R.string.unlock_intention_specific_task, R.string.unlock_intention_specific_task_support, "•"),
            IntentionItem("connection", R.string.unlock_intention_connection, R.string.unlock_intention_connection_support, "•"),
            IntentionItem("intentional_break", R.string.unlock_intention_intentional_break, R.string.unlock_intention_intentional_break_support, "•"),
            IntentionItem("automatic_check", R.string.unlock_intention_automatic_check, R.string.unlock_intention_automatic_check_support, "•"),
            IntentionItem("unsure", R.string.unlock_intention_unsure, R.string.unlock_intention_unsure_support, "•"),
            IntentionItem("other", R.string.unlock_intention_other, R.string.unlock_intention_other_support, "•"),
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
