import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../data/repositories/app_repositories.dart';
import '../../providers/app_providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'jevin@example.com');
  final _passwordController = TextEditingController(text: 'password123');
  bool _isLoading = false;

  void _showDeviceApprovalDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surfaceCardElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: [
            const Icon(Icons.devices_other_rounded, color: AppColors.warning, size: 24),
            const SizedBox(width: 10),
            Text('Device Limit Reached', style: AppTextStyles.h2),
          ],
        ),
        content: Text(
          '$message\n\nA device approval request has been submitted. Please contact your Super Admin or login on your verified primary device.',
          style: AppTextStyles.bodyMd.copyWith(height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Understood', style: AppTextStyles.bodyMd.copyWith(color: AppColors.primaryGreen)),
          ),
        ],
      ),
    );
  }

  void _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please enter your email and password.', style: AppTextStyles.bodySm),
          backgroundColor: AppColors.danger,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authRepo = ref.read(authRepositoryProvider);
      final result = await authRepo.login(email, password);

      if (mounted) {
        setState(() => _isLoading = false);
        switch (result) {
          case LoginOtpRequired(:final email, :final maskedEmail, :final expiresInSeconds):
            context.push(
              '/login-otp-verify?email=${Uri.encodeComponent(email)}&maskedEmail=${Uri.encodeComponent(maskedEmail)}&expiresIn=$expiresInSeconds',
            );
          case LoginSuccess(:final user):
            ref.read(currentUserProvider.notifier).setUser(user);
            if (user.branch == null || user.branch!.isEmpty) {
              context.go('/branch-selection');
            } else {
              context.go('/home');
            }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        final errStr = e.toString();
        if (errStr.contains('Device limit reached') || errStr.contains('multi-device')) {
          _showDeviceApprovalDialog(errStr);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errStr, style: AppTextStyles.bodySm),
              backgroundColor: AppColors.danger,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              // Brand Logo Top
              const Center(
                child: HireGridLogo(size: 44, showText: true),
              ).animate().fadeIn(duration: 400.ms),
              const SizedBox(height: 36),

              // Title
              Text(
                'Welcome Back 👋',
                style: AppTextStyles.displayLg,
              ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0),
              const SizedBox(height: 8),
              Text(
                'Sign in to continue your placement learning journey',
                style: AppTextStyles.bodyMd,
              ).animate().fadeIn(delay: 150.ms),
              const SizedBox(height: 28),

              // Fields
              AppTextField(
                label: 'Email or Mobile Number',
                hintText: 'john@example.com',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                prefixIcon: const Icon(Icons.email_outlined, color: AppColors.textMuted, size: 20),
              ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 18),

              AppTextField(
                label: 'Password',
                hintText: '••••••••',
                controller: _passwordController,
                isPassword: true,
                prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.textMuted, size: 20),
              ).animate().fadeIn(delay: 250.ms),
              const SizedBox(height: 10),

              // Forgot Password Link
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.push('/forgot-password'),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    'Forgot Password?',
                    style: AppTextStyles.bodySm.copyWith(
                      color: AppColors.primaryGreen,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ).animate().fadeIn(delay: 300.ms),
              const SizedBox(height: 28),

              // Login CTA
              PrimaryButton(
                text: 'Login',
                isLoading: _isLoading,
                onPressed: _handleLogin,
              ).animate().fadeIn(delay: 350.ms),
              const SizedBox(height: 20),

              // Divider
              Row(
                children: [
                  const Expanded(child: Divider()),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text('or', style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted)),
                  ),
                  const Expanded(child: Divider()),
                ],
              ).animate().fadeIn(delay: 400.ms),
              const SizedBox(height: 20),

              // Google Button
              SocialButton(
                text: 'Continue with Google',
                onPressed: _handleLogin,
              ).animate().fadeIn(delay: 450.ms),
              const SizedBox(height: 36),

              // Footer Sign Up Link
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Don\'t have an account? ', style: AppTextStyles.bodyMd),
                    GestureDetector(
                      onTap: () => context.push('/signup'),
                      child: Text(
                        'Sign Up',
                        style: AppTextStyles.bodyMd.copyWith(
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 500.ms),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
