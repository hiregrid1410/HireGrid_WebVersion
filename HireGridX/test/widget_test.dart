import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hiregridx/main.dart';

void main() {
  testWidgets('App launches successfully to splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: HireGridXApp(),
      ),
    );
    expect(find.byType(HireGridXApp), findsOneWidget);
    // Pump past the 2.2s splash timer so no timers are pending
    await tester.pumpAndSettle(const Duration(seconds: 3));
  });
}
