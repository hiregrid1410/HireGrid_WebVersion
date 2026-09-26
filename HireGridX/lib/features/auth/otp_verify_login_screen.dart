import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/app_providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/app_buttons.dart';

class OtpVerifyLoginScreen extends ConsumerStatefulWidget {
  final String email;
  final String maskedEmail;
  final int initialExpiresInSeconds;

  const OtpVerifyLoginScreen({
    super.key,
    required this.email,
    required this.maskedEmail,
    this.initialExpiresInSeconds = 900,
  });

  @override
  ConsumerState<OtpVerifyLoginScreen> createState() => _OtpVerifyLoginScreenState();
}

class _OtpVerifyLoginScreenState extends ConsumerState<OtpVerifyLoginScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  bool _isLoading = false;
  bool _isResending = false;

  late int _timeLeft;
  Timer? _countdownTimer;

  int _resendCooldown = 30;
  Timer? _cooldownTimer;

  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _timeLeft = widget.initialExpiresInSeconds;
    _startExpiryTimer();
    _startResendCooldownTimer();
  }

  void _startExpiryTimer() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        if (mounted) {
          setState(() {
            _timeLeft--;
          });
        }
      } else {
        timer.cancel();
      }
    });
  }

  void _startResendCooldownTimer() {
    _resendCooldown = 30;
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCooldown > 0) {
        if (mounted) {
          setState(() {
            _resendCooldown--;
          });
        }
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _cooldownTimer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String _formatTimer(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  void _onDigitChanged(int index, String value) {
    if (value.length > 1) {
      // User typed or pasted multiple characters into a single field
      _controllers[index].text = value.substring(value.length - 1);
      _controllers[index].selection = TextSelection.collapsed(offset: 1);
    }

    if (value.isNotEmpty) {
      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        // Check if all 6 digits are entered for auto-submit
        final completeCode = _controllers.map((c) => c.text.trim()).join();
        if (completeCode.length == 6) {
          _verifyOtp(completeCode);
        }
      }
    }
  }

  void _verifyOtp([String? codeOverride]) async {
    final otpCode = codeOverride ?? _controllers.map((c) => c.text.trim()).join();
    if (otpCode.length < 6) {
      setState(() {
        _errorMessage = 'Please enter all 6 digits of the login code.';
      });
      return;
    }

    if (_timeLeft <= 0) {
      setState(() {
        _errorMessage = 'Code expired — please request a new one.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authRepo = ref.read(authRepositoryProvider);
      final user = await authRepo.verifyLoginOtp(
        email: widget.email,
        otp: otpCode,
      );

      ref.read(currentUserProvider.notifier).setUser(user);

      if (mounted) {
        setState(() => _isLoading = false);
        // Continue into existing post-login flow (branch selection or home dashboard)
        if (user.branch == null || user.branch!.isEmpty) {
          context.go('/branch-selection');
        } else {
          context.go('/home');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        final errStr = e.toString();

        if (errStr.contains('OTP_LOCKED') || errStr.contains('Too many failed attempts')) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Too many attempts. Please log in again.'),
              backgroundColor: AppColors.danger,
            ),
          );
          context.go('/login');
        } else if (errStr.contains('OTP_EXPIRED') || errStr.contains('expired')) {
          setState(() {
            _errorMessage = 'Code expired — please request a new one.';
          });
        } else {
          setState(() {
            _errorMessage = errStr.replaceAll('Exception: ', '').replaceAll('ApiFailure: ', '');
          });
        }
      }
    }
  }

  void _resendOtp() async {
    if (_resendCooldown > 0 || _isResending) return;

    setState(() {
      _isResending = true;
      _errorMessage = null;
    });

    try {
      final authRepo = ref.read(authRepositoryProvider);
      final expiresIn = await authRepo.resendLoginOtp(widget.email);

      if (mounted) {
        setState(() {
          _isResending = false;
          _timeLeft = expiresIn;
          for (final c in _controllers) {
            c.clear();
          }
        });

        _startExpiryTimer();
        _startResendCooldownTimer();
        _focusNodes[0].requestFocus();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('New login code sent! Please check your inbox.'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isResending = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '').replaceAll('ApiFailure: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayMasked = widget.maskedEmail.isNotEmpty ? widget.maskedEmail : widget.email;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.go('/login'),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Verify it's you",
                style: AppTextStyles.displayLg,
              ).animate().fadeIn().slideY(begin: 0.1, end: 0),
              const SizedBox(height: 8),

              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: "We've sent a 6-digit code to ",
                      style: AppTextStyles.bodyMd,
                    ),
                    TextSpan(
                      text: displayMasked,
                      style: AppTextStyles.bodyMd.copyWith(
                        color: AppColors.primaryGreen,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 100.ms),
              const SizedBox(height: 32),

              // Error State Banner
              if (_errorMessage != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppColors.danger.withOpacity(0.12),
                    border: Border.all(color: AppColors.danger.withOpacity(0.35)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: AppTextStyles.bodySm.copyWith(color: AppColors.danger, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 200.ms),

              // 6-box OTP Input
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: 48,
                    height: 56,
                    child: RawKeyboardListener(
                      focusNode: FocusNode(),
                      onKey: (event) {
                        if (event is RawKeyDownEvent &&
                            event.logicalKey == LogicalKeyboardKey.backspace &&
                            _controllers[index].text.isEmpty &&
                            index > 0) {
                          _focusNodes[index - 1].requestFocus();
                        }
                      },
                      child: TextFormField(
                        controller: _controllers[index],
                        focusNode: _focusNodes[index],
                        textAlign: TextAlign.center,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(1),
                        ],
                        enabled: !_isLoading && _timeLeft > 0,
                        style: AppTextStyles.numeric.copyWith(
                          fontSize: 22,
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.bold,
                        ),
                        decoration: InputDecoration(
                          counterText: '',
                          filled: true,
                          fillColor: AppColors.surfaceInput,
                          contentPadding: EdgeInsets.zero,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.borderSubtle),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                          ),
                          disabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppColors.borderSubtle.withOpacity(0.5)),
                          ),
                        ),
                        onChanged: (val) => _onDigitChanged(index, val),
                      ),
                    ),
                  );
                }),
              ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 24),

              // Expiry Countdown Timer
              Center(
                child: _timeLeft > 0
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.timer_outlined,
                            size: 16,
                            color: _timeLeft <= 60 ? AppColors.danger : AppColors.accentYellow,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Code expires in ${_formatTimer(_timeLeft)}',
                            style: AppTextStyles.numeric.copyWith(
                              fontSize: 14,
                              color: _timeLeft <= 60 ? AppColors.danger : AppColors.accentYellow,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      )
                    : Text(
                        'Code expired — request a new one',
                        style: AppTextStyles.bodySm.copyWith(
                          color: AppColors.danger,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ).animate().fadeIn(delay: 250.ms),
              const SizedBox(height: 32),

              // Verify CTA Button
              PrimaryButton(
                text: 'Verify & Continue',
                isLoading: _isLoading,
                onPressed: _timeLeft > 0 ? () => _verifyOtp() : null,
              ).animate().fadeIn(delay: 300.ms),
              const SizedBox(height: 24),

              // Resend Code Action
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text("Didn't receive code? ", style: AppTextStyles.bodySm),
                    InkWell(
                      onTap: (_resendCooldown == 0 && !_isResending) ? _resendOtp : null,
                      child: Text(
                        _isResending
                            ? 'Sending...'
                            : _resendCooldown > 0
                                ? 'Resend Code ($_resendCooldown s)'
                                : 'Resend Code',
                        style: AppTextStyles.bodySm.copyWith(
                          color: _resendCooldown == 0 ? AppColors.primaryGreen : AppColors.textMuted,
                          fontWeight: FontWeight.w700,
                          decoration: _resendCooldown == 0 ? TextDecoration.underline : TextDecoration.none,
                        ),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 350.ms),
              const SizedBox(height: 20),

              // Wrong Email Go Back Link
              Center(
                child: TextButton(
                  onPressed: () => context.go('/login'),
                  child: Text(
                    'Wrong email? Go back',
                    style: AppTextStyles.bodySm.copyWith(
                      color: AppColors.textMuted,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ).animate().fadeIn(delay: 400.ms),
            ],
          ),
        ),
      ),
    );
  }
}
