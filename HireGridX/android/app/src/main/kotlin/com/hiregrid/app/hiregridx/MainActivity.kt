package com.hiregrid.app.hiregridx

import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val METHOD_CHANNEL = "com.hiregrid.app/screen_security"
    private val RECORDING_EVENT_CHANNEL = "com.hiregrid.app/screen_recording_events"
    private val SCREENSHOT_EVENT_CHANNEL = "com.hiregrid.app/screenshot_events"

    private var isSecureEnabled: Boolean = true
    private var recordingEventSink: EventChannel.EventSink? = null
    private var screenshotEventSink: EventChannel.EventSink? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Global Protection: Enforce Android FLAG_SECURE from startup to prevent system screenshots,
        // black out screen recordings, and obscure recent apps previews.
        enableFlagSecure()
        setupScreenshotDetection()
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, METHOD_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "enableSecureMode" -> {
                    enableFlagSecure()
                    result.success(true)
                }
                "disableSecureMode" -> {
                    disableFlagSecure()
                    result.success(true)
                }
                "isSecureModeEnabled" -> {
                    result.success(isSecureEnabled)
                }
                "isScreenRecordingActive" -> {
                    // With FLAG_SECURE, video captures on Android are forced black by the WindowManager
                    result.success(false)
                }
                else -> result.notImplemented()
            }
        }

        EventChannel(flutterEngine.dartExecutor.binaryMessenger, RECORDING_EVENT_CHANNEL).setStreamHandler(
            object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    recordingEventSink = events
                }

                override fun onCancel(arguments: Any?) {
                    recordingEventSink = null
                }
            }
        )

        EventChannel(flutterEngine.dartExecutor.binaryMessenger, SCREENSHOT_EVENT_CHANNEL).setStreamHandler(
            object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    screenshotEventSink = events
                }

                override fun onCancel(arguments: Any?) {
                    screenshotEventSink = null
                }
            }
        )
    }

    private fun setupScreenshotDetection() {
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+ ScreenCaptureCallback
            try {
                val callback = android.app.Activity.ScreenCaptureCallback {
                    runOnUiThread {
                        screenshotEventSink?.success(
                            mapOf(
                                "timestamp" to System.currentTimeMillis(),
                                "source" to "android_14_callback"
                            )
                        )
                    }
                }
                registerScreenCaptureCallback(mainExecutor, callback)
            } catch (e: Throwable) {
                // Graceful fallback for non-standard OEM builds
            }
        }
    }

    private fun enableFlagSecure() {
        runOnUiThread {
            window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
            isSecureEnabled = true
        }
    }

    private fun disableFlagSecure() {
        runOnUiThread {
            window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
            isSecureEnabled = false
        }
    }
}
