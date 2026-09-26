import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../shared/widgets/utility_widgets.dart';

class PaymentMethodScreen extends StatefulWidget {
  final String planId;

  const PaymentMethodScreen({super.key, required this.planId});

  @override
  State<PaymentMethodScreen> createState() => _PaymentMethodScreenState();
}

class _PaymentMethodScreenState extends State<PaymentMethodScreen> {
  int _selectedMethod = 0; // 0: UPI, 1: Card, 2: NetBanking
  final _utrController = TextEditingController();
  bool _isProofUploaded = false;
  bool _isLoading = false;

  void _submitPaymentProof() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 700));
    if (mounted) {
      setState(() => _isLoading = false);
      context.push('/plans/status?planId=${widget.planId}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Secure Payment'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Order Summary
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderSubtle),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Premium Plan (3 Months)', style: AppTextStyles.h3),
                        const SizedBox(height: 2),
                        Text('Access to 20+ Companies & Tests', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
                      ],
                    ),
                    Text('₹1,499', style: AppTextStyles.h2.copyWith(color: AppColors.primaryGreen, fontWeight: FontWeight.w800)),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms),
              const SizedBox(height: 20),

              Text('Choose Payment Method', style: AppTextStyles.h3),
              const SizedBox(height: 12),

              PaymentMethodTile(
                title: 'UPI (QR / ID)',
                subtitle: 'Google Pay, PhonePe, Paytm, BHIM',
                icon: Icons.qr_code_2_rounded,
                isSelected: _selectedMethod == 0,
                onTap: () => setState(() => _selectedMethod = 0),
              ),
              PaymentMethodTile(
                title: 'Credit / Debit Card',
                subtitle: 'Visa, MasterCard, RuPay',
                icon: Icons.credit_card_rounded,
                isSelected: _selectedMethod == 1,
                onTap: () => setState(() => _selectedMethod = 1),
              ),
              PaymentMethodTile(
                title: 'Net Banking',
                subtitle: 'All Major Indian Banks',
                icon: Icons.account_balance_rounded,
                isSelected: _selectedMethod == 2,
                onTap: () => setState(() => _selectedMethod = 2),
              ),
              const SizedBox(height: 20),

              // UPI Details Section
              if (_selectedMethod == 0) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCardElevated,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.borderSubtle),
                  ),
                  child: Column(
                    children: [
                      Text('Scan QR or Pay to UPI ID', style: AppTextStyles.h3),
                      const SizedBox(height: 14),
                      // Mock QR Box
                      Container(
                        width: 150,
                        height: 150,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Icon(Icons.qr_code_rounded, size: 120, color: Colors.black.withOpacity(0.85)),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceInput,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('hiregridx@okhdfcbank', style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w700, color: AppColors.primaryGreen)),
                            const SizedBox(width: 8),
                            const Icon(Icons.copy_rounded, size: 16, color: AppColors.textMuted),
                          ],
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(),
                const SizedBox(height: 20),

                // Transaction ID & Upload Proof
                Text('Verification Proof', style: AppTextStyles.h3),
                const SizedBox(height: 10),
                AppTextField(
                  label: 'UTR / Transaction Reference ID',
                  hintText: 'e.g. 348910293847',
                  controller: _utrController,
                  prefixIcon: const Icon(Icons.tag_rounded, color: AppColors.textMuted, size: 20),
                ),
                const SizedBox(height: 14),

                // Screenshot Picker UI Mock
                InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () {
                    setState(() {
                      _isProofUploaded = true;
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Payment screenshot attached!', style: AppTextStyles.bodySm),
                        backgroundColor: AppColors.primaryGreenDark,
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
                    decoration: BoxDecoration(
                      color: _isProofUploaded ? AppColors.primaryGreen.withOpacity(0.08) : AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: _isProofUploaded ? AppColors.primaryGreen : AppColors.borderSubtle,
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _isProofUploaded ? Icons.check_circle_outline_rounded : Icons.cloud_upload_outlined,
                          color: _isProofUploaded ? AppColors.primaryGreen : AppColors.textMuted,
                          size: 24,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          _isProofUploaded ? 'Screenshot Attached (tap to replace)' : 'Upload Payment Screenshot',
                          style: AppTextStyles.bodyMd.copyWith(
                            color: _isProofUploaded ? AppColors.primaryGreen : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Submit Proof CTA
              PrimaryButton(
                text: 'I\'ve Completed The Payment',
                isLoading: _isLoading,
                onPressed: _submitPaymentProof,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
