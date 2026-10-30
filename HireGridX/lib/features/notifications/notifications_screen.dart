import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';
import '../../data/models/device_model.dart';
import '../../core/notifications/notification_permission_service.dart';

enum NotificationFilter { all, unread, revision, missions, system }

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  NotificationFilter _selectedFilter = NotificationFilter.all;
  bool _hasPermission = true;
  bool _dismissedBanner = false;

  @override
  void initState() {
    super.initState();
    _checkPermission();
  }

  Future<void> _checkPermission() async {
    final status = await NotificationPermissionService.getStatus();
    if (mounted) {
      setState(() {
        _hasPermission = status.isGranted;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(notificationsListProvider);

    return Scaffold(
      backgroundColor: AppColors.bgBase,
      appBar: AppBar(
        title: const Text('Notifications'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        actions: [
          notificationsAsync.maybeWhen(
            data: (notifs) {
              final unread = notifs.where((n) => !n.isRead).length;
              if (unread == 0) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () async {
                  await ref.read(profileRepositoryProvider).markNotificationsAsRead();
                  ref.invalidate(notificationsListProvider);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('All notifications marked as read', style: AppTextStyles.bodySm),
                        backgroundColor: AppColors.primaryGreenDark,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.done_all_rounded, size: 16, color: AppColors.primaryGreen),
                label: Text(
                  'Mark all read',
                  style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.primaryGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Permission Advisory Banner if notifications are disabled
            if (!_hasPermission && !_dismissedBanner)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primaryGreen.withOpacity(0.25)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.notifications_paused_rounded, color: AppColors.primaryGreen, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Notifications are disabled',
                            style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Enable alerts to get instant mission & exam reminders.',
                            style: AppTextStyles.label.copyWith(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () async {
                        final granted = await NotificationPermissionService.promptPermissionOnStartup(context, force: true);
                        if (mounted) {
                          setState(() {
                            _hasPermission = granted;
                          });
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        visualDensity: VisualDensity.compact,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      child: const Text('Enable', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 16, color: AppColors.textMuted),
                      onPressed: () => setState(() => _dismissedBanner = true),
                      visualDensity: VisualDensity.compact,
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 300.ms),

            // 2. Category Filter Pills
            notificationsAsync.maybeWhen(
              data: (notifs) => _buildFilterBar(notifs),
              orElse: () => const SizedBox.shrink(),
            ),

            const SizedBox(height: 8),

            // 3. Notifications List
            Expanded(
              child: RefreshIndicator(
                color: AppColors.primaryGreen,
                onRefresh: () async {
                  await ref.refresh(notificationsListProvider.future);
                },
                child: notificationsAsync.when(
                  loading: () => ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: 4,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, __) => const ShimmerCard(height: 90),
                  ),
                  error: (err, _) => EmptyStateWidget(
                    title: 'Unable to Load Notifications',
                    message: err.toString(),
                  ),
                  data: (allNotifs) {
                    final filtered = _filterNotifications(allNotifs);

                    if (filtered.isEmpty) {
                      return ListView(
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.15),
                          EmptyStateWidget(
                            icon: _getEmptyIcon(),
                            title: _getEmptyTitle(),
                            message: _getEmptySubtitle(),
                          ),
                        ],
                      );
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final notif = filtered[index];
                        return _NotificationCard(
                          notification: notif,
                          onTap: () async {
                            if (!notif.isRead) {
                              await ref.read(profileRepositoryProvider).markNotificationRead(notif.id);
                              ref.invalidate(notificationsListProvider);
                            }
                            if (!context.mounted) return;

                            if (notif.topicId != null && notif.topicId!.isNotEmpty) {
                              context.push('/exam/rev_${notif.topicId}');
                            } else if (notif.type == 'mission') {
                              context.go('/missions');
                            }
                          },
                        ).animate().fadeIn(delay: (index * 40).ms);
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterBar(List<NotificationModel> notifs) {
    final unreadCount = notifs.where((n) => !n.isRead).length;
    final revisionCount = notifs.where((n) => n.isRevision).length;
    final missionCount = notifs.where((n) => n.type == 'mission').length;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          _buildFilterChip('All', notifs.length, NotificationFilter.all),
          const SizedBox(width: 8),
          _buildFilterChip('Unread', unreadCount, NotificationFilter.unread),
          const SizedBox(width: 8),
          _buildFilterChip('Missions', missionCount, NotificationFilter.missions),
          const SizedBox(width: 8),
          _buildFilterChip('Revisions', revisionCount, NotificationFilter.revision),
          const SizedBox(width: 8),
          _buildFilterChip('System', notifs.where((n) => !n.isRevision && n.type != 'mission').length, NotificationFilter.system),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, int count, NotificationFilter filter) {
    final isSelected = _selectedFilter == filter;
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: () => setState(() => _selectedFilter = filter),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryGreen : AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : AppColors.borderSubtle,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: AppTextStyles.bodySm.copyWith(
                color: isSelected ? Colors.white : AppColors.textSecondary,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                fontSize: 13,
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white.withOpacity(0.25) : AppColors.borderSubtle,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.white : AppColors.textMuted,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  List<NotificationModel> _filterNotifications(List<NotificationModel> notifs) {
    switch (_selectedFilter) {
      case NotificationFilter.all:
        return notifs;
      case NotificationFilter.unread:
        return notifs.where((n) => !n.isRead).toList();
      case NotificationFilter.missions:
        return notifs.where((n) => n.type == 'mission').toList();
      case NotificationFilter.revision:
        return notifs.where((n) => n.isRevision).toList();
      case NotificationFilter.system:
        return notifs.where((n) => !n.isRevision && n.type != 'mission').toList();
    }
  }

  IconData _getEmptyIcon() {
    switch (_selectedFilter) {
      case NotificationFilter.unread:
        return Icons.mark_email_read_outlined;
      case NotificationFilter.missions:
        return Icons.military_tech_outlined;
      case NotificationFilter.revision:
        return Icons.auto_stories_outlined;
      default:
        return Icons.notifications_off_outlined;
    }
  }

  String _getEmptyTitle() {
    switch (_selectedFilter) {
      case NotificationFilter.unread:
        return 'No Unread Notifications';
      case NotificationFilter.missions:
        return 'No Mission Alerts';
      case NotificationFilter.revision:
        return 'No Revision Schedules';
      default:
        return 'You\'re All Caught Up!';
    }
  }

  String _getEmptySubtitle() {
    switch (_selectedFilter) {
      case NotificationFilter.unread:
        return 'Great job! You have read all your notifications.';
      case NotificationFilter.missions:
        return 'Weekly placement challenges and leaderboard updates will appear here.';
      case NotificationFilter.revision:
        return 'Spaced repetition reviews will be queued automatically as you complete modules.';
      default:
        return 'Check back later for company assessments, streak milestones, and exam reminders.';
    }
  }
}

class _NotificationCard extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback onTap;

  const _NotificationCard({
    required this.notification,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    IconData icon = Icons.notifications_outlined;
    Color iconCol = AppColors.primaryGreen;

    if (notification.isRevision || notification.type.startsWith('revision')) {
      icon = Icons.auto_stories_rounded;
      iconCol = const Color(0xFF10B981); // Emerald
    } else if (notification.type == 'mission') {
      icon = Icons.military_tech_rounded;
      iconCol = AppColors.accentYellow;
    } else if (notification.type == 'xp') {
      icon = Icons.local_fire_department_rounded;
      iconCol = const Color(0xFFF97316);
    } else if (notification.type == 'payment') {
      icon = Icons.check_circle_outline_rounded;
      iconCol = AppColors.primaryGreen;
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: notification.isRead ? AppColors.surfaceCard : AppColors.surfaceCardElevated,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: notification.isRead ? AppColors.borderSubtle : AppColors.primaryGreen.withOpacity(0.35),
              width: notification.isRead ? 1 : 1.5,
            ),
            boxShadow: notification.isRead
                ? []
                : [
                    BoxShadow(
                      color: AppColors.primaryGreen.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon Badge with unread dot
              Stack(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: iconCol.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: iconCol, size: 22),
                  ),
                  if (!notification.isRead)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 14),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: AppTextStyles.bodyMd.copyWith(
                              fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.w700,
                              color: AppColors.textPrimary,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          notification.timeAgo,
                          style: AppTextStyles.label.copyWith(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      notification.message,
                      style: AppTextStyles.bodySm.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),

                    // Quick Action Buttons
                    if (notification.topicId != null && notification.topicId!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: onTap,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.play_arrow_rounded, color: Color(0xFF10B981), size: 16),
                              const SizedBox(width: 4),
                              Text(
                                'Start Spaced Revision Test',
                                style: AppTextStyles.label.copyWith(
                                  color: const Color(0xFF10B981),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else if (notification.type == 'mission') ...[
                      const SizedBox(height: 12),
                      InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: onTap,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.accentYellow.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.accentYellow.withOpacity(0.4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.military_tech_rounded, color: Color(0xFFB45309), size: 16),
                              const SizedBox(width: 4),
                              Text(
                                'View Mission & Leaderboard',
                                style: AppTextStyles.label.copyWith(
                                  color: const Color(0xFFB45309),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
