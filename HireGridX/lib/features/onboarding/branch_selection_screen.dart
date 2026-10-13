import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../core/constants/dummy_assets.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class BranchSelectionScreen extends ConsumerStatefulWidget {
  final bool isFromSettings;

  const BranchSelectionScreen({super.key, this.isFromSettings = false});

  @override
  ConsumerState<BranchSelectionScreen> createState() => _BranchSelectionScreenState();
}

class _BranchSelectionScreenState extends ConsumerState<BranchSelectionScreen> {
  late String _selectedBranchId;

  @override
  void initState() {
    super.initState();
    _selectedBranchId = ref.read(selectedBranchIdProvider);
  }

  IconData _getBranchIcon(String iconName) {
    switch (iconName) {
      case 'laptop':
        return Icons.laptop_chromebook_rounded;
      case 'cog':
        return Icons.settings_suggest_rounded;
      case 'zap':
        return Icons.bolt_rounded;
      case 'building':
        return Icons.apartment_rounded;
      case 'cpu':
        return Icons.memory_rounded;
      case 'server':
        return Icons.dns_rounded;
      default:
        return Icons.school_rounded;
    }
  }

  void _onContinue() {
    ref.read(selectedBranchIdProvider.notifier).state = _selectedBranchId;
    if (widget.isFromSettings) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Branch updated successfully!', style: AppTextStyles.bodySm.copyWith(color: Colors.white)),
          backgroundColor: AppColors.primaryGreenDark,
        ),
      );
      context.pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final branchesAsync = ref.watch(branchesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isFromSettings ? 'Change Branch' : 'Select Your Branch'),
        leading: widget.isFromSettings
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (widget.isFromSettings)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.warning.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, color: AppColors.warning, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Switching your branch updates the subjects & modules displayed on My Learning.',
                        style: AppTextStyles.bodySm.copyWith(color: AppColors.textPrimary),
                      ),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: branchesAsync.when(
                loading: () => ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: 6,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, __) => const ShimmerCard(height: 64, borderRadius: 16),
                ),
                error: (err, _) => Center(
                  child: EmptyStateWidget(
                    title: 'Failed to load branches',
                    message: err.toString(),
                    actionText: 'Retry',
                    onAction: () => ref.refresh(branchesProvider),
                  ),
                ),
                data: (branches) {
                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    itemCount: branches.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final branch = branches[index];
                      final isSelected = branch.id == _selectedBranchId;

                      return Container(
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primaryGreen.withOpacity(0.08) : AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? AppColors.primaryGreen : AppColors.borderSubtle,
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              setState(() {
                                _selectedBranchId = branch.id;
                              });
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? AppColors.primaryGreen.withOpacity(0.15)
                                          : AppColors.surfaceInput,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      _getBranchIcon(branch.iconName),
                                      color: isSelected ? AppColors.primaryGreen : AppColors.textSecondary,
                                      size: 22,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Text(
                                      branch.name,
                                      style: AppTextStyles.bodyMd.copyWith(
                                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                        color: isSelected ? AppColors.textPrimary : AppColors.textSecondary,
                                      ),
                                    ),
                                  ),
                                  Icon(
                                    isSelected ? Icons.check_circle_rounded : Icons.chevron_right_rounded,
                                    color: isSelected ? AppColors.primaryGreen : AppColors.textMuted,
                                    size: isSelected ? 22 : 18,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ).animate().fadeIn(delay: (index * 60).ms).slideY(begin: 0.1, end: 0);
                    },
                  );
                },
              ),
            ),

            // Bottom Hero Illustration Card + Sticky CTA
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Container(
                    height: 90,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      gradient: AppColors.heroBlueGreenGradient,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primaryGreen.withOpacity(0.2)),
                    ),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: CustomPaint(
                            painter: MountainSilhouettePainter(
                              primaryColor: AppColors.primaryGreenDark,
                              secondaryColor: AppColors.deepBlueSlate,
                              opacity: 0.8,
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Right Branch',
                                  style: AppTextStyles.h3.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                Text(
                                  'Bigger Dreams',
                                  style: AppTextStyles.bodySm.copyWith(
                                    color: AppColors.accentYellow,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  PrimaryButton(
                    text: 'Continue',
                    onPressed: _onContinue,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
