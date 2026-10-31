package expo.modules.phoneunlock

import android.app.Activity
import android.os.Bundle
import android.view.View

class UnlockPopupActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    Notifications.cancelPrompt(this)
    setContentView(R.layout.unlock_popup)
    setFinishOnTouchOutside(true)
    bind(R.id.noReason, UnlockChoices.NO_REASON)
    bind(R.id.task, UnlockChoices.TASK)
    bind(R.id.message, UnlockChoices.MESSAGE)
  }

  private fun bind(id: Int, choice: String) {
    findViewById<View>(id).setOnClickListener {
      UnlockPrompter.record(this, choice)
      finish()
    }
  }
}
