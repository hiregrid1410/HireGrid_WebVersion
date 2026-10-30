import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'screen_security_provider.dart';
import 'security_watermark.dart';

/// Reusable security container for sensitive screens.
///
/// Features:
/// 1. Synchronously validates and enforces Android FLAG_SECURE.
/// 2. Listens to screen recording events and covers the view with a
///    blocking privacy shield overlay if recording is detected.
/// 3. Listens to screenshot attempt events and presents an in-app security alert.
/// 4. Renders a dynamic, repeated diagonal watermark with user identification
///    and timestamp using non-blocking [IgnorePointer].
class SecureScreenWrapper extends ConsumerStatefulWidget {
  final Widget child;
  final String screenTitle;
  final bool isSensitive;
  final bool enableWatermark;
  final double watermarkOpacity;

  const SecureScreenWrapper({
    super.key,
    required this.child,
    this.screenTitle = 'Protected Screen',
    this.isSensitive = true,
    this.enableWatermark = true,
    this.watermarkOpacity = 0.12,
  });

  @override
  ConsumerState<SecureScreenWrapper> createState() => _SecureScreenWrapperState();
}

class _SecureScreenWrapperState extends ConsumerState<SecureScreenWrapper> {
  StreamSubscription? _screenshotSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.isSensitive) {
        ref.read(screenSecurityServiceProvider).enableSecureMode();
      }
      _listenToScreenshotAttempts();
    });
  }

  void _listenToScreenshotAttempts() {
    final monitor = ref.read(screenCaptureMonitorProvider);
    _screenshotSubscription?.cancel();
    _screenshotSubscription = monitor.onScreenshotAttempted.listen((event) {
      if (mounted) {
        _showScreenshotWarningSnackBar();
      }
    });
  }

  void _showScreenshotWarningSnackBar() {
    ScaffoldMessenger.of(context).removeCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFFDC2626), // Alert Red
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: const Row(
          children: [
            Icon(Icons.shield_outlined, color: Colors.white, size: 22),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Security Notice: Screen captures are prohibited on HireGrid secure screens.',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  void dispose() {
    _screenshotSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isRecordingActive = ref.watch(isScreenRecordingActiveProvider).valueOrNull ?? false;
    final watermarkText = ref.watch(dynamicWatermarkTextProvider);

    return Stack(
      children: [
        // 1. Primary Child View
        widget.child,

        // 2. Dynamic Semi-Transparent Watermark (if enabled)
        if (widget.enableWatermark && !isRecordingActive)
          Positioned.fill(
            child: SecurityWatermark(
              text: watermarkText,
              opacity: widget.watermarkOpacity,
            ),
          ),

        // 3. Screen Recording Blocker Overlay
        if (isRecordingActive)
          Positioned.fill(
            child: _ScreenRecordingPrivacyShield(
              screenTitle: widget.screenTitle,
            ),
          ),
      ],
    );
  }
}

class _ScreenRecordingPrivacyShield extends StatelessWidget {
  final String screenTitle;

  const _ScreenRecordingPrivacyShield({required this.screenTitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF0F172A), // Secure Midnight Slate
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFDC2626).withValues(alpha: 0.15),
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFFDC2626).withValues(alpha: 0.4),
                  width: 2,
                ),
              ),
              child: const Icon(
                Icons.videocam_off_rounded,
                size: 56,
                color: Color(0xFFEF4444),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Screen Recording Detected',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Screen recording is restricted for security reasons.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFFCBD5E1),
                fontSize: 15,
                fontWeight: FontWeight.w600,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: Text(
                'Assessment questions, answers, and sensitive credentials are confidential under HireGrid Security Policy.\n\nPlease stop screen recording or mirroring to resume $screenTitle.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
