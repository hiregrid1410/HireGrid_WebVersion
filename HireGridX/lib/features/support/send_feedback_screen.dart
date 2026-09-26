import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/app_text_field.dart';

class SendFeedbackScreen extends StatefulWidget {
  const SendFeedbackScreen({super.key});

  @override
  State<SendFeedbackScreen> createState() => _SendFeedbackScreenState();
}

class _SendFeedbackScreenState extends State<SendFeedbackScreen> {
  String _category = 'Bug';
  final _messageController = TextEditingController();
  bool _isScreenshotAttached = false;
  bool _isLoading = false;

  final List<String> _categories = ['Bug', 'Feature Suggestion', 'Question', 'Other'];

  void _submitFeedback() async {
    if (_messageController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please describe your issue or feedback.', style: AppTextStyles.bodySm),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Thank you! Your feedback has been submitted.', style: AppTextStyles.bodySm),
          backgroundColor: AppColors.primaryGreenDark,
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Send Feedback'),
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
              Text('Feedback Category', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
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
                    value: _category,
                    isExpanded: true,
                    dropdownColor: AppColors.surfaceCardElevated,
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted),
                    items: _categories.map((c) {
                      return DropdownMenuItem(
                        value: c,
                        child: Text(c, style: AppTextStyles.bodyMd.copyWith(color: AppColors.textPrimary)),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _category = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Describe your feedback or issue',
                hintText: 'Tell us what happened or how we can improve...',
                controller: _messageController,
                maxLines: 5,
              ),
              const SizedBox(height: 16),

              // Attach Screenshot UI
              InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () {
                  setState(() => _isScreenshotAttached = !_isScreenshotAttached);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                  decoration: BoxDecoration(
                    color: _isScreenshotAttached ? AppColors.primaryGreen.withOpacity(0.08) : AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _isScreenshotAttached ? AppColors.primaryGreen : AppColors.borderSubtle,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _isScreenshotAttached ? Icons.check_circle_outline_rounded : Icons.attach_file_rounded,
                        color: _isScreenshotAttached ? AppColors.primaryGreen : AppColors.textMuted,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _isScreenshotAttached ? 'Screenshot Attached' : 'Attach Screenshot (Optional)',
                        style: AppTextStyles.bodySm.copyWith(
                          color: _isScreenshotAttached ? AppColors.primaryGreen : AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),

              PrimaryButton(
                text: 'Submit Feedback',
                isLoading: _isLoading,
                onPressed: _submitFeedback,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
