import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/app_providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/app_text_field.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController(text: 'student@hiregrid.in');
  bool _isSent = false;
  bool _isLoading = false;

  void _sendResetLink() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email address.')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final success = await ref.read(authRepositoryProvider).sendPasswordReset(email);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isSent = success;
        });
        if (!success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to send reset link. Please try again.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: _isSent ? _buildSuccessView() : _buildFormView(),
        ),
      ),
    );
  }

  Widget _buildFormView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Forgot Password?', style: AppTextStyles.displayLg).animate().fadeIn().slideY(begin: 0.1, end: 0),
        const SizedBox(height: 8),
        Text(
          'Enter your registered email address to receive password reset instructions.',
          style: AppTextStyles.bodyMd,
        ).animate().fadeIn(delay: 100.ms),
        const SizedBox(height: 32),
        AppTextField(
          label: 'Email Address',
          hintText: 'john@example.com',
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          prefixIcon: const Icon(Icons.email_outlined, color: AppColors.textMuted, size: 20),
        ).animate().fadeIn(delay: 150.ms),
        const SizedBox(height: 28),
        PrimaryButton(
          text: 'Send Reset Link',
          isLoading: _isLoading,
          onPressed: _sendResetLink,
        ).animate().fadeIn(delay: 200.ms),
      ],
    );
  }

  Widget _buildSuccessView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withOpacity(0.15),
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primaryGreen),
            ),
            child: const Icon(Icons.mark_email_read_outlined, color: AppColors.primaryGreen, size: 40),
          ).animate().scale(curve: Curves.easeOutBack),
          const SizedBox(height: 24),
          Text('Reset Link Sent!', style: AppTextStyles.h1),
          const SizedBox(height: 12),
          Text(
            'We have emailed a password reset link to\n${_emailController.text}',
            textAlign: TextAlign.center,
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 36),
          PrimaryButton(
            text: 'Back to Login',
            onPressed: () => context.pop(),
          ),
        ],
      ),
    );
  }
}
