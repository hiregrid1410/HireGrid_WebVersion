import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hiregridx/core/security/screen_security_service.dart';
import 'package:hiregridx/core/security/screen_capture_monitor.dart';
import 'package:hiregridx/core/security/security_watermark.dart';
import 'package:hiregridx/core/security/screen_security_provider.dart';
import 'package:hiregridx/core/security/secure_screen_wrapper.dart';
import 'package:hiregridx/data/models/user_model.dart';
import 'package:hiregridx/providers/app_providers.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ScreenSecurityService Unit Tests', () {
    test('ScreenSecurityService handles initialization & safe defaults', () async {
      final service = ScreenSecurityService();

      expect(service.isSecureModeEnabled, true);

      final enabled = await service.enableSecureMode();
      expect(enabled, true);
      expect(service.isSecureModeEnabled, true);

      final disabled = await service.disableSecureMode();
      expect(disabled, true);
      expect(service.isSecureModeEnabled, false);

      final reEnabled = await service.enableSecureMode();
      expect(reEnabled, true);
      expect(service.isSecureModeEnabled, true);

      final isRecording = await service.isScreenRecordingActive();
      expect(isRecording, false);
    });
  });

  group('ScreenCaptureMonitor Unit Tests', () {
    test('ScreenCaptureMonitor exposes streams and disposes cleanly', () async {
      final monitor = ScreenCaptureMonitor();

      expect(monitor.onScreenRecordingChanged, isNotNull);
      expect(monitor.onScreenshotAttempted, isNotNull);

      expect(() => monitor.dispose(), returnsNormally);
    });
  });

  group('SecurityWatermark Widget Tests', () {
    testWidgets('SecurityWatermark renders with IgnorePointer to ensure zero touch blocking', (tester) async {
      bool buttonPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Stack(
              children: [
                Center(
                  child: ElevatedButton(
                    onPressed: () => buttonPressed = true,
                    child: const Text('Sensitive Content Button'),
                  ),
                ),
                const Positioned.fill(
                  child: SecurityWatermark(
                    text: 'Test User (ID: usr_1234) • 30/10/2026 • HireGrid Confidential',
                    opacity: 0.12,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Verify the IgnorePointer inside SecurityWatermark has ignoring = true
      final watermarkFinder = find.byType(SecurityWatermark);
      expect(watermarkFinder, findsOneWidget);

      final internalIgnorePointer = find.descendant(
        of: watermarkFinder,
        matching: find.byType(IgnorePointer),
      );
      expect(internalIgnorePointer, findsOneWidget);

      final IgnorePointer ignorePointer = tester.widget(internalIgnorePointer);
      expect(ignorePointer.ignoring, true);

      // Tap through the watermark onto the button
      await tester.tap(find.text('Sensitive Content Button'));
      await tester.pump();

      expect(buttonPressed, true, reason: 'Watermark must not block touch events');
    });
  });

  group('dynamicWatermarkTextProvider Tests', () {
    testWidgets('Watermark provider formats user identification without leaking email or phone', (tester) async {
      const mockUser = UserModel(
        id: 'usr_abc123xyz987',
        name: 'Alexander Turing',
        email: 'alex.private@corp.internal',
        branch: 'Computer Science',
        semester: 'Semester 7',
        totalXp: 1200,
        currentStreak: 5,
        currentRank: 42,
      );

      late String watermarkText;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            currentUserProvider.overrideWith((ref) => MockCurrentUserNotifier(mockUser)),
          ],
          child: MaterialApp(
            home: Consumer(
              builder: (context, ref, _) {
                watermarkText = ref.watch(dynamicWatermarkTextProvider);
                return Text(watermarkText);
              },
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Must include Name, truncated ID, and HireGrid Confidential branding
      expect(watermarkText, contains('Alexander Turing'));
      expect(watermarkText, contains('ID: usr_abc1'));
      expect(watermarkText, contains('HireGrid Confidential'));

      // Crucial: Must NEVER leak private email address or phone numbers
      expect(watermarkText.contains('alex.private@corp.internal'), false);
      expect(watermarkText.contains('@'), false);
    });
  });

  group('SecureScreenWrapper Integration Tests', () {
    testWidgets('Renders normal child screen and watermark when recording is inactive', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SecureScreenWrapper(
              screenTitle: 'Confidential Exam',
              enableWatermark: true,
              child: Scaffold(
                body: Center(
                  child: Text('Confidential Question 1: What is polymorphism?'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Normal content is visible
      expect(find.text('Confidential Question 1: What is polymorphism?'), findsOneWidget);
      expect(find.byType(SecurityWatermark), findsOneWidget);

      // Recording overlay is NOT present
      expect(find.text('Screen Recording Detected'), findsNothing);
    });

    testWidgets('Instantly conceals content and displays Privacy Shield overlay when recording is active', (tester) async {
      final recordingStreamController = StreamController<bool>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            isScreenRecordingActiveProvider.overrideWith((ref) => recordingStreamController.stream),
          ],
          child: const MaterialApp(
            home: SecureScreenWrapper(
              screenTitle: 'Assessment Exam',
              enableWatermark: true,
              child: Scaffold(
                body: Center(
                  child: Text('Top Secret Assessment Question'),
                ),
              ),
            ),
          ),
        ),
      );

      // Initial state with false
      recordingStreamController.add(false);
      await tester.pump();
      await tester.pump();

      // Initially no recording overlay
      expect(find.text('Top Secret Assessment Question'), findsOneWidget);
      expect(find.text('Screen Recording Detected'), findsNothing);

      // Screen recording begins
      recordingStreamController.add(true);
      await tester.pump();
      await tester.pump();

      // Privacy overlay immediately obscures sensitive content
      expect(find.text('Screen Recording Detected'), findsOneWidget);
      expect(find.text('Screen recording is restricted for security reasons.'), findsOneWidget);
      expect(find.textContaining('Please stop screen recording or mirroring to resume Assessment Exam.'), findsOneWidget);

      // Screen recording stops
      recordingStreamController.add(false);
      await tester.pump();
      await tester.pump();

      // Content immediately restored
      expect(find.text('Screen Recording Detected'), findsNothing);
      expect(find.text('Top Secret Assessment Question'), findsOneWidget);

      await recordingStreamController.close();
    });
  });
}

class MockCurrentUserNotifier extends StateNotifier<AsyncValue<UserModel?>>
    implements CurrentUserNotifier {
  MockCurrentUserNotifier(UserModel user) : super(AsyncValue.data(user));

  @override
  Future<void> loadUser() async {}

  @override
  void setUser(UserModel user) {
    state = AsyncValue.data(user);
  }

  @override
  void clearUser() {
    state = const AsyncValue.data(null);
  }

  @override
  Future<void> updateProfile({required String name, required String branch, required String semester}) async {}
}
