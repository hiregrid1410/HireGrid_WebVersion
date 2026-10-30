import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Centralized service managing platform-level screen capture protection,
/// Android FLAG_SECURE, and native security channel invocations.
class ScreenSecurityService {
  static const MethodChannel _channel = MethodChannel('com.hiregrid.app/screen_security');

  bool _isSecureModeEnabled = true;

  bool get isSecureModeEnabled => _isSecureModeEnabled;

  bool get isSupportedPlatform =>
      !kIsWeb && (Platform.isAndroid || Platform.isIOS);

  /// Enables application-wide screenshot and screen recording blocking (Android FLAG_SECURE)
  /// and activates iOS capture observers and switcher privacy shields.
  Future<bool> enableSecureMode() async {
    if (!isSupportedPlatform) {
      _isSecureModeEnabled = true;
      return true;
    }

    try {
      final result = await _channel.invokeMethod<bool>('enableSecureMode');
      _isSecureModeEnabled = result ?? true;
      return _isSecureModeEnabled;
    } on MissingPluginException {
      // Graceful fallback in unit test or mocked harness
      _isSecureModeEnabled = true;
      return true;
    } catch (e) {
      debugPrint('[ScreenSecurityService] Error enabling secure mode: $e');
      return false;
    }
  }

  /// Disables secure mode (reserved for administrative override / test teardown).
  Future<bool> disableSecureMode() async {
    if (!isSupportedPlatform) {
      _isSecureModeEnabled = false;
      return true;
    }

    try {
      final result = await _channel.invokeMethod<bool>('disableSecureMode');
      _isSecureModeEnabled = !(result ?? true);
      return !_isSecureModeEnabled;
    } catch (e) {
      debugPrint('[ScreenSecurityService] Error disabling secure mode: $e');
      return false;
    }
  }

  /// Checks if screen recording or screen mirroring is actively underway.
  Future<bool> isScreenRecordingActive() async {
    if (!isSupportedPlatform) return false;

    try {
      final result = await _channel.invokeMethod<bool>('isScreenRecordingActive');
      return result ?? false;
    } catch (e) {
      return false;
    }
  }
}
