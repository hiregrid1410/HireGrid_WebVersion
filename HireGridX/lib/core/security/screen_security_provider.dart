import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/app_providers.dart';
import 'screen_security_service.dart';
import 'screen_capture_monitor.dart';

final screenSecurityServiceProvider = Provider<ScreenSecurityService>((ref) {
  final service = ScreenSecurityService();
  service.enableSecureMode();
  return service;
});

final screenCaptureMonitorProvider = Provider<ScreenCaptureMonitor>((ref) {
  final monitor = ScreenCaptureMonitor();
  ref.onDispose(() => monitor.dispose());
  return monitor;
});

/// Stream of whether screen recording / mirroring is active
final isScreenRecordingActiveProvider = StreamProvider.autoDispose<bool>((ref) {
  final monitor = ref.watch(screenCaptureMonitorProvider);
  return monitor.onScreenRecordingChanged;
});

/// Stream of screenshot attempt events
final screenshotEventsProvider = StreamProvider.autoDispose<ScreenshotEvent>((ref) {
  final monitor = ref.watch(screenCaptureMonitorProvider);
  return monitor.onScreenshotAttempted;
});

/// Generates formatted, user-specific, non-exposing watermark text
final dynamicWatermarkTextProvider = Provider<String>((ref) {
  final userAsync = ref.watch(currentUserProvider);
  final user = userAsync.valueOrNull;

  final now = DateTime.now();
  final dateStr = '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}';

  final userName = (user != null && user.name.trim().isNotEmpty)
      ? user.name.trim()
      : 'HireGrid Student';

  final userId = (user != null && user.id.isNotEmpty)
      ? (user.id.length > 8 ? user.id.substring(0, 8) : user.id)
      : 'HGX';

  // Branding + User identification + Date without exposing sensitive email or phone
  return '$userName (ID: $userId) • $dateStr • HireGrid Confidential';
});
