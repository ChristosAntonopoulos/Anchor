package expo.modules.distractionguard

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Button
import android.widget.TextView

class CooldownActivity : Activity() {
  private val handler = Handler(Looper.getMainLooper())
  private val tick = object : Runnable {
    override fun run() {
      updateRemaining()
      handler.postDelayed(this, 1000L)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.cooldown_screen)

    findViewById<Button>(R.id.btnBackToWork).setOnClickListener {
      val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
      home.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      startActivity(home)
      finish()
    }
    findViewById<Button>(R.id.btnNeedAccess).setOnClickListener {
      val open = Intent(Intent.ACTION_VIEW).apply {
        data = android.net.Uri.parse("pos://more/distraction-guard?bypass=1")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        startActivity(open)
      } catch (_: Exception) {
      }
      finish()
    }
    findViewById<Button>(R.id.btnOpenSettings).setOnClickListener {
      val open = Intent(Intent.ACTION_VIEW).apply {
        data = android.net.Uri.parse("pos://more/distraction-guard")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        startActivity(open)
      } catch (_: Exception) {
      }
      finish()
    }

    updateRemaining()
    handler.post(tick)
  }

  private fun updateRemaining() {
    val cycle = GuardPrefs.cycle(this) ?: return
    val ms = PolicyEngine.remainingCooldownMs(
      cycle,
      System.currentTimeMillis(),
      GuardPrefs.elapsedRealtime()
    )
    val totalSec = (ms / 1000L).toInt()
    val m = totalSec / 60
    val s = totalSec % 60
    findViewById<TextView>(R.id.remaining).text = String.format("%d:%02d", m, s)
    if (ms <= 0) finish()
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    super.onDestroy()
  }
}
