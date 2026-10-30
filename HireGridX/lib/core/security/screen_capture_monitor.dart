import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class ScreenshotEvent {
  final DateTime timestamp;
  final String source;

  const ScreenshotEvent({
    required this.timestamp,
    required this.source,
  });

  @override
  String toString() => 'ScreenshotEvent(timestamp: $timestamp, source: $source)';
}

/// Listens to native event streams for active screen recording changes
/// and hardware screenshot attempt events.
class ScreenCaptureMonitor {
  static const EventChannel _recordingEventChannel =
      EventChannel('com.hiregrid.app/screen_recording_events');
  static const EventChannel _screenshotEventChannel =
      EventChannel('com.hiregrid.app/screenshot_events');

  StreamController<bool>? _recordingController;
  StreamSubscription? _nativeRecordingSubscription;

  StreamController<ScreenshotEvent>? _screenshotController;
  StreamSubscription? _nativeScreenshotSubscription;

  bool _isDisposed = false;

  bool get isSupportedPlatform =>
      !kIsWeb && (Platform.isAndroid || Platform.isIOS);

  /// Broadcast stream indicating whether screen recording / mirroring is active.
  Stream<bool> get onScreenRecordingChanged {
    _recordingController ??= StreamController<bool>.broadcast(
      onListen: _startRecordingListener,
      onCancel: _stopRecordingListener,
    );
    return _recordingController!.stream;
  }

  /// Broadcast stream emitting whenever a screenshot attempt is detected.
  Stream<ScreenshotEvent> get onScreenshotAttempted {
    _screenshotController ??= StreamController<ScreenshotEvent>.broadcast(
      onListen: _startScreenshotListener,
      onCancel: _stopScreenshotListener,
    );
    return _screenshotController!.stream;
  }

  void _startRecordingListener() {
    if (!isSupportedPlatform) return;

    _nativeRecordingSubscription?.cancel();
    _nativeRecordingSubscription = _recordingEventChannel
        .receiveBroadcastStream()
        .listen(
      (dynamic data) {
        if (_isDisposed) return;
        final isRecording = data is bool ? data : (data == true);
        _recordingController?.add(isRecording);
      },
      onError: (dynamic error) {
        debugPrint('[ScreenCaptureMonitor] Recording event error: $error');
      },
    );
  }

  void _stopRecordingListener() {
    _nativeRecordingSubscription?.cancel();
    _nativeRecordingSubscription = null;
  }

  void _startScreenshotListener() {
    if (!isSupportedPlatform) return;

    _nativeScreenshotSubscription?.cancel();
    _nativeScreenshotSubscription = _screenshotEventChannel
        .receiveBroadcastStream()
        .listen(
      (dynamic data) {
        if (_isDisposed) return;
        DateTime time = DateTime.now();
        String source = 'platform_event';
        if (data is Map) {
          final ts = data['timestamp'];
          if (ts is int) {
            time = DateTime.fromMillisecondsSinceEpoch(ts);
          }
          source = data['source']?.toString() ?? 'platform_event';
        }
        _screenshotController?.add(ScreenshotEvent(timestamp: time, source: source));
      },
      onError: (dynamic error) {
        debugPrint('[ScreenCaptureMonitor] Screenshot event error: $error');
      },
    );
  }

  void _stopScreenshotListener() {
    _nativeScreenshotSubscription?.cancel();
    _nativeScreenshotSubscription = null;
  }

  void dispose() {
    _isDisposed = true;
    _stopRecordingListener();
    _stopScreenshotListener();
    _recordingController?.close();
    _screenshotController?.close();
  }
}
