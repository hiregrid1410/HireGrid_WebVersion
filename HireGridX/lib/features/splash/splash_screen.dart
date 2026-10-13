import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../providers/app_providers.dart';
import '../../core/network/api_config.dart';
import 'package:dio/dio.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _triggerWarmUp();
    _checkSessionAndNavigate();
  }

  /// Fire-and-forget lightweight request to wake up Render + Neon compute in parallel
  void _triggerWarmUp() {
    unawaited(
      Dio(
        BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      ).get('/branches/active').catchError((_) {
        // Silent catch: just a warm-up ping
        return Response(requestOptions: RequestOptions(path: '/branches/active'));
      }),
    );
  }

  Future<void> _checkSessionAndNavigate() async {
    // Parallelize local token read and short minimum splash time
    final results = await Future.wait([
      ref.read(tokenStorageProvider).readToken(),
      Future.delayed(const Duration(milliseconds: 1200)),
    ]);

    if (!mounted) return;

    final token = results[0] as String?;
    if (token != null && token.isNotEmpty) {
      // Warm up user profile in background
      ref.read(currentUserProvider.notifier).loadUser();
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.bgBase,
      body: Center(
        child: HireGridLogo(
          size: 72,
          showText: true,
          subtitle: null,
        ),
      ),
    );
  }
}
