package expo.modules.distractionguard

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.CountDownTimer
import android.widget.Button
import android.widget.TextView

class OpeningFrictionActivity : Activity() {
  private var timer: CountDownTimer? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.opening_friction)

    val pauseSeconds = intent.getIntExtra("pauseSeconds", 5).coerceIn(0, 10)
    val countdown = findViewById<TextView>(R.id.countdown)
    val btnReturn = findViewById<Button>(R.id.btnReturn)
    val btnContinue = findViewById<Button>(R.id.btnContinue)
    val btnIntentional = findViewById<Button>(R.id.btnIntentional)

    btnReturn.isEnabled = true
    btnContinue.isEnabled = pauseSeconds == 0
    btnIntentional.isEnabled = true

    if (pauseSeconds > 0) {
      timer = object : CountDownTimer(pauseSeconds * 1000L, 250L) {
        override fun onTick(millisUntilFinished: Long) {
          val s = ((millisUntilFinished + 999) / 1000).toInt()
          countdown.text = "$s"
        }

        override fun onFinish() {
          countdown.text = ""
          btnContinue.isEnabled = true
        }
      }.start()
    } else {
      countdown.text = ""
    }

    val pkg = intent.getStringExtra("packageName") ?: ""

    btnReturn.setOnClickListener {
      GuardPrefs.appendFrictionEvent(
        this,
        org.json.JSONObject()
          .put("type", "opening_friction_result")
          .put("result", "return")
          .put("packageName", pkg)
          .put("atMs", System.currentTimeMillis())
      )
      val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
      home.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      startActivity(home)
      finish()
    }
    btnContinue.setOnClickListener {
      GuardPrefs.appendFrictionEvent(
        this,
        org.json.JSONObject()
          .put("type", "opening_friction_result")
          .put("result", "continue")
          .put("packageName", pkg)
          .put("atMs", System.currentTimeMillis())
      )
      finish()
    }
    btnIntentional.setOnClickListener {
      GuardPrefs.appendFrictionEvent(
        this,
        org.json.JSONObject()
          .put("type", "opening_friction_result")
          .put("result", "intentional")
          .put("packageName", pkg)
          .put("atMs", System.currentTimeMillis())
      )
      val open = Intent(Intent.ACTION_VIEW).apply {
        data = android.net.Uri.parse("pos://more/distraction-guard?intentional=1")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        startActivity(open)
      } catch (_: Exception) {
      }
      finish()
    }
  }

  override fun onDestroy() {
    timer?.cancel()
    super.onDestroy()
  }
}
