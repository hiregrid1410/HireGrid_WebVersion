import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hiregridx/data/models/device_model.dart';
import 'package:hiregridx/features/notifications/notifications_screen.dart';
import 'package:hiregridx/providers/app_providers.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Notifications Unit & Widget Tests', () {
    test('NotificationModel parses json and copyWith correctly', () {
      final notif = NotificationModel.fromJson({
        'id': 'notif_1',
        'title': 'TCS Challenge Live',
        'message': 'Round 1 is open for 48 hours.',
        'type': 'mission',
        'isRead': false,
      });

      expect(notif.id, 'notif_1');
      expect(notif.title, 'TCS Challenge Live');
      expect(notif.isRead, false);
      expect(notif.type, 'mission');

      final updated = notif.copyWith(isRead: true);
      expect(updated.id, 'notif_1');
      expect(updated.isRead, true);
    });

    testWidgets('NotificationsScreen renders filter tabs and list', (tester) async {
      SharedPreferences.setMockInitialValues({});

      final mockNotifs = [
        const NotificationModel(
          id: 'n1',
          title: 'TCS NQT Assessment Live',
          message: 'Complete by Sunday 11:59 PM',
          timeAgo: '2h ago',
          type: 'mission',
          isRead: false,
        ),
        const NotificationModel(
          id: 'n2',
          title: 'Day 3 Spaced Revision Due',
          message: 'Review Object-Oriented Programming',
          timeAgo: '5h ago',
          type: 'revision_day3',
          topicId: 'top_oop',
          isRead: true,
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            notificationsListProvider.overrideWith((ref) async => mockNotifs),
          ],
          child: const MaterialApp(
            home: NotificationsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check AppBar
      expect(find.text('Notifications'), findsOneWidget);

      // Check filter chips
      expect(find.text('All'), findsOneWidget);
      expect(find.text('Unread'), findsOneWidget);
      expect(find.text('Missions'), findsOneWidget);
      expect(find.text('Revisions'), findsOneWidget);

      // Check notification items rendered
      expect(find.text('TCS NQT Assessment Live'), findsOneWidget);
      expect(find.text('Day 3 Spaced Revision Due'), findsOneWidget);
    });
  });
}
