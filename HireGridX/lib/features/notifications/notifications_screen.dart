import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        actions: [
          TextButton(
            onPressed: () {
              ref.read(profileRepositoryProvider).markNotificationsAsRead();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('All notifications marked as read', style: AppTextStyles.bodySm),
                  backgroundColor: AppColors.primaryGreenDark,
                ),
              );
            },
            child: Text(
              'Mark all read',
              style: AppTextStyles.bodySm.copyWith(color: AppColors.primaryGreen, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: notificationsAsync.when(
          loading: () => ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: 3,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, __) => const ShimmerCard(height: 80),
          ),
          error: (err, _) => EmptyStateWidget(title: 'Error', message: err.toString()),
          data: (notifications) {
            if (notifications.isEmpty) {
              return const EmptyStateWidget(
                icon: Icons.notifications_off_outlined,
                title: 'No Notifications',
                message: 'You\'re all caught up! Check back later for mission updates.',
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              itemCount: notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final notif = notifications[index];
                IconData icon = Icons.notifications_outlined;
                Color iconCol = AppColors.primaryGreen;

                if (notif.type == 'mission') {
                  icon = Icons.military_tech_rounded;
                  iconCol = AppColors.accentYellow;
                } else if (notif.type == 'xp') {
                  icon = Icons.local_fire_department_rounded;
                  iconCol = const Color(0xFFF97316);
                } else if (notif.type == 'payment') {
                  icon = Icons.check_circle_outline_rounded;
                  iconCol = AppColors.primaryGreen;
                }

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: notif.isRead ? AppColors.surfaceCard : AppColors.surfaceCardElevated,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: notif.isRead ? AppColors.borderSubtle : AppColors.primaryGreen.withOpacity(0.4),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: iconCol.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(icon, color: iconCol, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  notif.title,
                                  style: AppTextStyles.bodyMd.copyWith(
                                    fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.w700,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  notif.timeAgo,
                                  style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted, fontSize: 11),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              notif.message,
                              style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: (index * 50).ms);
              },
            );
          },
        ),
      ),
    );
  }
}
