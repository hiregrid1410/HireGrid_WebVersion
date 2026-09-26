import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../data/models/device_model.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class DeviceManagementScreen extends ConsumerWidget {
  const DeviceManagementScreen({super.key});

  void _showRequestApprovalDialog(BuildContext context, DeviceModel device) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surfaceCardElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text('Approve Device?', style: AppTextStyles.h2),
        content: Text(
          'Request an admin verification token for "${device.deviceName}". Once approved, you can take tests on this device.',
          style: AppTextStyles.bodyMd,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: AppTextStyles.bodyMd.copyWith(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Approval request submitted for ${device.deviceName}', style: AppTextStyles.bodySm),
                  backgroundColor: AppColors.primaryGreenDark,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Request Approval', style: AppTextStyles.button.copyWith(color: Colors.black)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devicesAsync = ref.watch(devicesListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Device Management'),
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
              // Current Verified Device Hero Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: AppColors.cardGradient,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.primaryGreen.withOpacity(0.5)),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryGreen.withOpacity(0.1),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(Icons.phone_android_rounded, color: AppColors.primaryGreen, size: 30),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'This device is verified',
                      style: AppTextStyles.h2.copyWith(color: AppColors.primaryGreen),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Samsung Galaxy S23 (Android 14)',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        'CURRENT DEVICE',
                        style: AppTextStyles.label.copyWith(color: AppColors.primaryGreen, fontWeight: FontWeight.w800, fontSize: 10),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms),
              const SizedBox(height: 28),

              // Recent Login Activity List
              Text('Recent Login Activity', style: AppTextStyles.h3).animate().fadeIn(delay: 100.ms),
              const SizedBox(height: 12),

              devicesAsync.when(
                loading: () => ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: 3,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, __) => const ShimmerCard(height: 70),
                ),
                error: (err, _) => EmptyStateWidget(title: 'Error', message: err.toString()),
                data: (devices) {
                  return ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: devices.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final dev = devices[index];
                      Color statusColor = AppColors.textMuted;
                      String statusText = 'Approved';
                      if (dev.status == DeviceStatus.active) {
                        statusColor = AppColors.primaryGreen;
                        statusText = 'Active';
                      } else if (dev.status == DeviceStatus.pending) {
                        statusColor = AppColors.warning;
                        statusText = 'Pending';
                      }

                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                color: AppColors.surfaceInput,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                dev.deviceName.contains('iPhone') ? Icons.phone_iphone_rounded : Icons.phone_android_rounded,
                                color: AppColors.textSecondary,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(dev.deviceName, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700)),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${dev.osVersion} • ${dev.location}',
                                    style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            if (dev.status == DeviceStatus.pending)
                              GestureDetector(
                                onTap: () => _showRequestApprovalDialog(context, dev),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.warning.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'Pending (Tap)',
                                    style: AppTextStyles.label.copyWith(color: AppColors.warning, fontWeight: FontWeight.w700, fontSize: 10),
                                  ),
                                ),
                              )
                            else
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  statusText,
                                  style: AppTextStyles.label.copyWith(color: statusColor, fontWeight: FontWeight.w700, fontSize: 10),
                                ),
                              ),
                          ],
                        ),
                      ).animate().fadeIn(delay: (index * 50).ms);
                    },
                  );
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
