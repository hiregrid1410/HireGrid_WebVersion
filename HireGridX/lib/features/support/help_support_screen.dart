import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/utility_widgets.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Help & Support'),
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
              // Support Rows
              SettingsTile(
                icon: Icons.question_answer_outlined,
                title: 'Frequently Asked Questions',
                subtitle: 'Common questions on tests & plans',
                onTap: () => _showFaqBottomSheet(context),
              ),
              SettingsTile(
                icon: Icons.mail_outline_rounded,
                title: 'Contact Us',
                subtitle: 'support@hiregridx.com',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Support email copied: support@hiregridx.com', style: AppTextStyles.bodySm),
                      backgroundColor: AppColors.primaryGreenDark,
                    ),
                  );
                },
              ),
              SettingsTile(
                icon: Icons.menu_book_outlined,
                title: 'Student Guide',
                subtitle: 'How to use HireGridX effectively',
                onTap: () {},
              ),
              SettingsTile(
                icon: Icons.bug_report_outlined,
                title: 'Report a Problem',
                subtitle: 'Send us feedback or bug details',
                onTap: () => context.push('/support/feedback'),
              ),
              const SizedBox(height: 28),

              // Bottom 24/7 Help Banner Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: AppColors.cardGradient,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.primaryGreen.withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(Icons.headset_mic_rounded, color: AppColors.primaryGreen, size: 28),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Need more help?', style: AppTextStyles.h2),
                    const SizedBox(height: 4),
                    Text(
                      'We\'re here for you 24/7 for technical & test queries.',
                      textAlign: TextAlign.center,
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    PrimaryButton(
                      text: 'Contact Support',
                      onPressed: () => context.push('/support/feedback'),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  void _showFaqBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceCardElevated,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          maxChildSize: 0.9,
          minChildSize: 0.5,
          expand: false,
          builder: (_, controller) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: ListView(
                controller: controller,
                children: [
                  Text('Frequently Asked Questions', style: AppTextStyles.h2),
                  const SizedBox(height: 16),
                  _buildFaqItem('How do I unlock company mock tests?', 'You can upgrade to a Premium plan under the Plans tab to unlock 20+ company test series.'),
                  _buildFaqItem('How is my score and accuracy calculated?', 'Score is based on correct answers. Accuracy is the ratio of correct answers to total attempted questions.'),
                  _buildFaqItem('Can I retake tests?', 'Yes! You can retake practice tests as many times as you want to sharpen your speed and accuracy.'),
                  _buildFaqItem('How does Device Verification work?', 'For exam integrity, your account is bound to your primary verified device. You can request approval for additional devices under Settings.'),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: ExpansionTile(
        title: Text(question, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        iconColor: AppColors.primaryGreen,
        collapsedIconColor: AppColors.textMuted,
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: [
          Text(answer, style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary, height: 1.5)),
        ],
      ),
    );
  }
}
