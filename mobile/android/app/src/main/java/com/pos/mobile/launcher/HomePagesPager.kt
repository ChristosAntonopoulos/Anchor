package com.pos.mobile.launcher

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Context
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import kotlin.math.abs

/**
 * Exactly two full-width pages with a quiet snap.
 *
 * Spatial order: Developer | Home (start on Home).
 * Finger swipe right → Developer; finger swipe left → Home.
 *
 * Intercepts horizontal drags itself (do not rely on HSV OnTouchListener —
 * child ScrollViews would steal those events and never page-switch).
 */
class HomePagesPager(
    context: Context,
    private val homePage: View,
    private val developerPage: View,
    private val onPageChanged: (developer: Boolean) -> Unit,
) : FrameLayout(context) {
    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
    private val strip = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
    private val scroller = object : HorizontalScrollView(context) {
        // Pager parent owns paging; never intercept here.
        override fun onInterceptTouchEvent(ev: MotionEvent): Boolean = false
        override fun onTouchEvent(ev: MotionEvent): Boolean = false
    }.apply {
        isFillViewport = true
        isHorizontalScrollBarEnabled = false
        overScrollMode = OVER_SCROLL_NEVER
        isSmoothScrollingEnabled = false
        addView(strip, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT))
    }

    private var pageWidth = 0
    private var downX = 0f
    private var downY = 0f
    private var downScroll = 0
    private var draggingPage = false
    private var decided = false
    private var animator: ValueAnimator? = null
    private var developer = false

    val showingDeveloper: Boolean
        get() = developer

    /** True while a horizontal page drag is in progress — Home must not open Recents. */
    val isPaging: Boolean
        get() = draggingPage

    init {
        addView(scroller, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        // Developer first so a rightward finger swipe reveals it from Home.
        strip.addView(sizedPage(developerPage))
        strip.addView(sizedPage(homePage))
    }

    fun showHome(animated: Boolean = true) = settleTo(developer = false, animated)

    fun showDeveloper(animated: Boolean = true) = settleTo(developer = true, animated)

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w <= 0) return
        pageWidth = w
        (developerPage.layoutParams as LinearLayout.LayoutParams).width = w
        (homePage.layoutParams as LinearLayout.LayoutParams).width = w
        strip.layoutParams = LayoutParams(w * 2, LayoutParams.MATCH_PARENT)
        developerPage.requestLayout()
        homePage.requestLayout()
        strip.requestLayout()
        post { scroller.scrollTo(if (developer) 0 else w, 0) }
    }

    override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                animator?.cancel()
                downX = ev.x
                downY = ev.y
                downScroll = scroller.scrollX
                draggingPage = false
                decided = false
                return false
            }
            MotionEvent.ACTION_MOVE -> {
                if (decided) return draggingPage
                val dx = ev.x - downX
                val dy = ev.y - downY
                if (abs(dx) <= touchSlop && abs(dy) <= touchSlop) return false
                decided = true
                if (abs(dx) > abs(dy)) {
                    draggingPage = true
                    parent?.requestDisallowInterceptTouchEvent(true)
                    return true
                }
                draggingPage = false
                return false
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                draggingPage = false
                decided = false
                return false
            }
        }
        return false
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                animator?.cancel()
                downX = event.x
                downY = event.y
                downScroll = scroller.scrollX
                draggingPage = true
                decided = true
                parent?.requestDisallowInterceptTouchEvent(true)
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                if (!draggingPage) return false
                val dx = event.x - downX
                val width = pageWidth.coerceAtLeast(1)
                val target = (downScroll - dx).toInt().coerceIn(0, width)
                scroller.scrollTo(target, 0)
                return true
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                if (!draggingPage) return false
                draggingPage = false
                decided = false
                parent?.requestDisallowInterceptTouchEvent(false)
                val dx = event.x - downX
                val width = pageWidth.coerceAtLeast(1)
                val moved = abs(dx) > touchSlop
                val goDeveloper = when {
                    moved && dx > 0 -> true   // finger right → Developer
                    moved && dx < 0 -> false  // finger left → Home
                    else -> scroller.scrollX < width / 2
                }
                settleTo(goDeveloper, animated = true)
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    private fun sizedPage(page: View): View {
        page.layoutParams = LinearLayout.LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT,
        )
        return page
    }

    private fun settleTo(developer: Boolean, animated: Boolean) {
        val width = pageWidth
        if (width <= 0) {
            this.developer = developer
            onPageChanged(developer)
            return
        }
        val target = if (developer) 0 else width
        animator?.cancel()
        if (!animated || abs(scroller.scrollX - target) < 2) {
            scroller.scrollTo(target, 0)
            commitPage(developer)
            return
        }
        val start = scroller.scrollX
        animator = ValueAnimator.ofInt(start, target).apply {
            duration = (220L + abs(target - start) / 4L).coerceIn(180L, 320L)
            interpolator = DecelerateInterpolator(1.4f)
            addUpdateListener { scroller.scrollTo(it.animatedValue as Int, 0) }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    commitPage(developer)
                }
            })
            start()
        }
    }

    private fun commitPage(developer: Boolean) {
        val changed = this.developer != developer
        this.developer = developer
        if (changed) onPageChanged(developer)
    }
}

/** Vertical scroll that yields clear horizontal drags to [HomePagesPager]. */
class PageScrollView(context: Context) : android.widget.ScrollView(context) {
    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
    private var downX = 0f
    private var downY = 0f
    private var lockedVertical = false

    init {
        isFillViewport = true
        overScrollMode = OVER_SCROLL_NEVER
    }

    override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                downX = ev.x
                downY = ev.y
                lockedVertical = false
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = abs(ev.x - downX)
                val dy = abs(ev.y - downY)
                if (!lockedVertical && dx > touchSlop && dx > dy) {
                    return false
                }
                if (dy > touchSlop && dy > dx) {
                    lockedVertical = true
                }
            }
        }
        return super.onInterceptTouchEvent(ev)
    }
}
