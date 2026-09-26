import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../providers/app_providers.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _nameController = TextEditingController(text: 'John Doe');
  final _emailController = TextEditingController(text: 'john@example.com');
  final _passwordController = TextEditingController(text: 'password123');
  String _selectedBranch = 'Computer Engineering';
  String _selectedSemester = '6th Semester';
  bool _agreedToTerms = true;
  bool _isLoading = false;

  final List<String> _branches = [
    'Computer Engineering',
    'Information Technology',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Electronics & Communication',
  ];

  final List<String> _semesters = [
    '1st Semester',
    '2nd Semester',
    '3rd Semester',
    '4th Semester',
    '5th Semester',
    '6th Semester',
    '7th Semester',
    '8th Semester',
  ];

  void _handleSignUp() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please fill all required fields.', style: AppTextStyles.bodySm),
          backgroundColor: AppColors.danger,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authRepo = ref.read(authRepositoryProvider);
      final user = await authRepo.signup(
        name: name,
        email: email,
        password: password,
        branch: _selectedBranch,
        semester: _selectedSemester,
      );
      ref.read(currentUserProvider.notifier).setUser(user);

      if (mounted) {
        setState(() => _isLoading = false);
        context.push('/otp-verify?email=$email');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString(), style: AppTextStyles.bodySm),
            backgroundColor: AppColors.danger,
          ),
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title
              Text(
                'Create Your Account',
                style: AppTextStyles.displayLg,
              ).animate().fadeIn().slideY(begin: 0.1, end: 0),
              const SizedBox(height: 6),
              Text(
                'Join HireGridX and start preparing for your dream company',
                style: AppTextStyles.bodyMd,
              ).animate().fadeIn(delay: 100.ms),
              const SizedBox(height: 24),

              // Fields
              AppTextField(
                label: 'Full Name',
                hintText: 'John Doe',
                controller: _nameController,
                prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.textMuted, size: 20),
              ).animate().fadeIn(delay: 150.ms),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Email Address',
                hintText: 'john@example.com',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                prefixIcon: const Icon(Icons.email_outlined, color: AppColors.textMuted, size: 20),
              ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Password',
                hintText: '••••••••',
                controller: _passwordController,
                isPassword: true,
                prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.textMuted, size: 20),
              ).animate().fadeIn(delay: 250.ms),
              const SizedBox(height: 16),

              // Branch Picker
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Branch', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceInput,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedBranch,
                        isExpanded: true,
                        dropdownColor: AppColors.surfaceCardElevated,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted),
                        items: _branches.map((b) {
                          return DropdownMenuItem(
                            value: b,
                            child: Text(b, style: AppTextStyles.bodyMd.copyWith(color: AppColors.textPrimary)),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedBranch = val);
                        },
                      ),
                    ),
                  ),
                ],
              ).animate().fadeIn(delay: 300.ms),
              const SizedBox(height: 16),

              // Semester Picker
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Semester', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceInput,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedSemester,
                        isExpanded: true,
                        dropdownColor: AppColors.surfaceCardElevated,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted),
                        items: _semesters.map((s) {
                          return DropdownMenuItem(
                            value: s,
                            child: Text(s, style: AppTextStyles.bodyMd.copyWith(color: AppColors.textPrimary)),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedSemester = val);
                        },
                      ),
                    ),
                  ),
                ],
              ).animate().fadeIn(delay: 350.ms),
              const SizedBox(height: 16),

              // Terms checkbox
              Row(
                children: [
                  Checkbox(
                    value: _agreedToTerms,
                    activeColor: AppColors.primaryGreen,
                    checkColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                    onChanged: (v) => setState(() => _agreedToTerms = v ?? false),
                  ),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(text: 'I agree to ', style: AppTextStyles.bodySm),
                          TextSpan(
                            text: 'Terms & Conditions',
                            style: AppTextStyles.bodySm.copyWith(color: AppColors.primaryGreen, fontWeight: FontWeight.w600),
                          ),
                          TextSpan(text: ' and ', style: AppTextStyles.bodySm),
                          TextSpan(
                            text: 'Privacy Policy',
                            style: AppTextStyles.bodySm.copyWith(color: AppColors.primaryGreen, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ).animate().fadeIn(delay: 400.ms),
              const SizedBox(height: 24),

              // CTA
              PrimaryButton(
                text: 'Sign Up',
                isLoading: _isLoading,
                onPressed: _agreedToTerms ? _handleSignUp : null,
              ).animate().fadeIn(delay: 450.ms),
              const SizedBox(height: 24),

              // Footer Login Link
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Already have an account? ', style: AppTextStyles.bodyMd),
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Text(
                        'Login',
                        style: AppTextStyles.bodyMd.copyWith(
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 500.ms),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
