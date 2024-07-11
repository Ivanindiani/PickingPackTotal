package com.totalwms

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

// React native navigation
import android.os.Bundle;

// React native keyboard events
import android.view.KeyEvent;
import com.github.kevinejohn.keyevent.KeyEventModule;

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "TotalWMS"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
    //RNBootSplash.init(this, R.style.BootTheme) // ⬅️ initialize the splash screen
    super.onCreate(null) // super.onCreate(null) with react-native-screens
  }


  override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    KeyEventModule.getInstance().onKeyDownEvent(keyCode, event);

    // There are 2 ways this can be done:
    //  1.  Override the default keyboard event behavior
    //    super.onKeyDown(keyCode, event);
    //    return true;

    //  2.  Keep default keyboard event behavior
    //    return super.onKeyDown(keyCode, event);

    // Using method #1 without blocking multiple

    super.onKeyDown(keyCode, event);
    return true;
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    KeyEventModule.getInstance().onKeyUpEvent(keyCode, event);

    // There are 2 ways this can be done:
    //  1.  Override the default keyboard event behavior
    //    super.onKeyUp(keyCode, event);
    //    return true;

    //  2.  Keep default keyboard event behavior
    //    return super.onKeyUp(keyCode, event);

    // Using method #1

    super.onKeyUp(keyCode, event);
    return true;
  }

  override fun onKeyMultiple(keyCode: Int, repeatCount: Int, event: KeyEvent): Boolean {
    KeyEventModule.getInstance().onKeyMultipleEvent(keyCode, repeatCount, event);
    return super.onKeyMultiple(keyCode, repeatCount, event);
  }
}
