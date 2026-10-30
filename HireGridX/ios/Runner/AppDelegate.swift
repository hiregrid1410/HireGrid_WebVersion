import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private let securityChannelName = "com.hiregrid.app/screen_security"
  private let recordingEventChannelName = "com.hiregrid.app/screen_recording_events"
  private let screenshotEventChannelName = "com.hiregrid.app/screenshot_events"

  private var recordingEventSink: FlutterEventSink?
  private var screenshotEventSink: FlutterEventSink?
  private var privacyBlurView: UIVisualEffectView?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    setupScreenProtectionObservers()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    setupSecurityChannels(messenger: engineBridge.binaryMessenger)
  }

  private func setupSecurityChannels(messenger: FlutterBinaryMessenger) {
    let methodChannel = FlutterMethodChannel(name: securityChannelName, binaryMessenger: messenger)
    methodChannel.setMethodCallHandler { [weak self] (call: FlutterMethodCall, result: @escaping FlutterResult) in
      guard let self = self else {
        result(FlutterError(code: "DEALLOCATED", message: "AppDelegate deallocated", details: nil))
        return
      }

      switch call.method {
      case "enableSecureMode":
        result(true)
      case "disableSecureMode":
        result(true)
      case "isSecureModeEnabled":
        result(true)
      case "isScreenRecordingActive":
        let isCaptured = UIScreen.main.isCaptured
        result(isCaptured)
      default:
        result(FlutterMethodNotImplemented)
      }
    }

    let recordingEventChannel = FlutterEventChannel(name: recordingEventChannelName, binaryMessenger: messenger)
    recordingEventChannel.setStreamHandler(SecurityStreamHandler(
      onListen: { [weak self] sink in
        self?.recordingEventSink = sink
        sink?(UIScreen.main.isCaptured)
      },
      onCancel: { [weak self] in
        self?.recordingEventSink = nil
      }
    ))

    let screenshotEventChannel = FlutterEventChannel(name: screenshotEventChannelName, binaryMessenger: messenger)
    screenshotEventChannel.setStreamHandler(SecurityStreamHandler(
      onListen: { [weak self] sink in
        self?.screenshotEventSink = sink
      },
      onCancel: { [weak self] in
        self?.screenshotEventSink = nil
      }
    ))
  }

  private func setupScreenProtectionObservers() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleScreenCaptureChanged),
      name: UIScreen.capturedDidChangeNotification,
      object: nil
    )

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleUserDidTakeScreenshot),
      name: UIApplication.userDidTakeScreenshotNotification,
      object: nil
    )
  }

  @objc private func handleScreenCaptureChanged() {
    let isCaptured = UIScreen.main.isCaptured
    recordingEventSink?(isCaptured)
  }

  @objc private func handleUserDidTakeScreenshot() {
    screenshotEventSink?([
      "timestamp": Int64(Date().timeIntervalSince1970 * 1000),
      "source": "ios_screenshot_notification"
    ])
  }

  override func applicationWillResignActive(_ application: UIApplication) {
    super.applicationWillResignActive(application)
    addPrivacyShield()
  }

  override func applicationDidBecomeActive(_ application: UIApplication) {
    super.applicationDidBecomeActive(application)
    removePrivacyShield()
  }

  private func addPrivacyShield() {
    guard privacyBlurView == nil, let window = self.window else { return }
    let blurEffect = UIBlurEffect(style: .dark)
    let blurView = UIVisualEffectView(effect: blurEffect)
    blurView.frame = window.bounds
    blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    blurView.tag = 999111
    window.addSubview(blurView)
    window.bringSubviewToFront(blurView)
    self.privacyBlurView = blurView
  }

  private func removePrivacyShield() {
    privacyBlurView?.removeFromSuperview()
    privacyBlurView = nil
    self.window?.viewWithTag(999111)?.removeFromSuperview()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }
}

class SecurityStreamHandler: NSObject, FlutterStreamHandler {
  private let onListenBlock: (FlutterEventSink?) -> Void
  private let onCancelBlock: () -> Void

  init(onListen: @escaping (FlutterEventSink?) -> Void, onCancel: @escaping () -> Void) {
    self.onListenBlock = onListen
    self.onCancelBlock = onCancel
  }

  func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
    onListenBlock(events)
    return nil
  }

  func onCancel(withArguments arguments: Any?) -> FlutterError? {
    onCancelBlock()
    return nil
  }
}
