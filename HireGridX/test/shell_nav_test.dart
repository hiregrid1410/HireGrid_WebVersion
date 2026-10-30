import 'package:flutter_test/flutter_test.dart';
import 'package:hiregridx/core/router/app_router.dart';

void main() {
  test('Router initializes with correct configuration and routes', () {
    expect(appRouter, isNotNull);
    expect(appRouter.configuration.routes.isNotEmpty, isTrue);

    // Verify root locations resolve properly
    final routes = appRouter.configuration.routes;
    expect(routes.any((r) => r.toString().contains('/splash')), isTrue);
    expect(routes.any((r) => r.toString().contains('/login')), isTrue);
  });
}
