import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../data/models/module_model.dart';
import '../../data/models/user_model.dart';
import '../../shared/widgets/card_widgets.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class MyLearningScreen extends ConsumerStatefulWidget {
  const MyLearningScreen({super.key});

  @override
  ConsumerState<MyLearningScreen> createState() => _MyLearningScreenState();
}

class _MyLearningScreenState extends ConsumerState<MyLearningScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Hierarchy Navigation State:
  // Level 0: _selectedBranch == null (Shows Branches list)
  // Level 1: _selectedBranch != null, _selectedSubject == null (Shows Branch's Subjects)
  // Level 2: _selectedSubject != null, _selectedTopic == null (Shows Subject's Topics & direct modules)
  // Level 3: _selectedTopic != null (Shows Topic's Modules)
  BranchModel? _selectedBranch;
  SubjectModel? _selectedSubject;
  TopicModel? _selectedTopic;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  bool _canPopInner() {
    return _selectedTopic != null || _selectedSubject != null || _selectedBranch != null;
  }

  void _popInner() {
    setState(() {
      if (_selectedTopic != null) {
        _selectedTopic = null;
      } else if (_selectedSubject != null) {
        _selectedSubject = null;
      } else if (_selectedBranch != null) {
        _selectedBranch = null;
      }
    });
  }

  void _jumpToRoot() {
    setState(() {
      _selectedBranch = null;
      _selectedSubject = null;
      _selectedTopic = null;
    });
  }

  void _jumpToBranch() {
    setState(() {
      _selectedSubject = null;
      _selectedTopic = null;
    });
  }

  void _jumpToSubject() {
    setState(() {
      _selectedTopic = null;
    });
  }

  String _currentTitle() {
    if (_selectedTopic != null) {
      return _selectedTopic!.name;
    }
    if (_selectedSubject != null) {
      return _selectedSubject!.name;
    }
    if (_selectedBranch != null) {
      return _selectedBranch!.name;
    }
    return 'Branches';
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_canPopInner(),
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_canPopInner()) {
          _popInner();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            _currentTitle(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          leading: _canPopInner()
              ? IconButton(
                  icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
                  onPressed: _popInner,
                )
              : null,
          bottom: TabBar(
            controller: _tabController,
            indicatorColor: AppColors.primaryGreen,
            indicatorWeight: 3,
            labelColor: AppColors.primaryGreen,
            unselectedLabelColor: AppColors.textSecondary,
            labelStyle: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
            unselectedLabelStyle: AppTextStyles.bodyMd,
            tabs: const [
              Tab(text: 'Branches'),
              Tab(text: 'Revision'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabController,
          children: [
            // TAB 1: BRANCHES & HIERARCHY
            _buildHierarchyView(),

            // TAB 2: SPACED-REPETITION REVISION
            _buildRevisionTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildHierarchyView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Web-Style Breadcrumb Navigation Bar
        _buildBreadcrumbBar(),

        // Dynamic Hierarchy Content Area
        Expanded(
          child: _selectedTopic != null
              ? _buildTopicModulesView(_selectedTopic!)
              : _selectedSubject != null
                  ? _buildSubjectTopicsView(_selectedSubject!)
                  : _selectedBranch != null
                      ? _buildBranchSubjectsView(_selectedBranch!)
                      : _buildBranchesListView(),
        ),
      ],
    );
  }

  // ==========================================
  // BREADCRUMB BAR
  // ==========================================
  Widget _buildBreadcrumbBar() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: AppColors.surfaceCardElevated,
        border: Border(
          bottom: BorderSide(color: AppColors.borderSubtle, width: 1),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            // Root: Branches
            InkWell(
              borderRadius: BorderRadius.circular(6),
              onTap: _selectedBranch != null ? _jumpToRoot : null,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Row(
                  children: [
                    const Icon(Icons.account_tree_outlined, color: AppColors.primaryGreen, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      'BRANCHES',
                      style: AppTextStyles.label.copyWith(
                        color: _selectedBranch == null ? AppColors.primaryGreen : AppColors.textSecondary,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Branch Level
            if (_selectedBranch != null) ...[
              const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 18),
              InkWell(
                borderRadius: BorderRadius.circular(6),
                onTap: _selectedSubject != null ? _jumpToBranch : null,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Text(
                    _selectedBranch!.name.toUpperCase(),
                    style: AppTextStyles.label.copyWith(
                      color: _selectedSubject == null ? AppColors.primaryGreen : AppColors.textSecondary,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ),
            ],

            // Subject Level
            if (_selectedSubject != null) ...[
              const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 18),
              InkWell(
                borderRadius: BorderRadius.circular(6),
                onTap: _selectedTopic != null ? _jumpToSubject : null,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Text(
                    _selectedSubject!.name.toUpperCase(),
                    style: AppTextStyles.label.copyWith(
                      color: _selectedTopic == null ? AppColors.primaryGreen : AppColors.textSecondary,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ),
            ],

            // Topic Level
            if (_selectedTopic != null) ...[
              const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 18),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Text(
                  _selectedTopic!.name.toUpperCase(),
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.primaryGreen,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ==========================================
  // LEVEL 0: BRANCHES LIST
  // ==========================================
  Widget _buildBranchesListView() {
    final branchesAsync = ref.watch(branchesProvider);

    return branchesAsync.when(
      loading: () => ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => const ShimmerCard(height: 90, borderRadius: 16),
      ),
      error: (err, _) => EmptyStateWidget(
        title: 'Failed to load branches',
        message: err.toString(),
        actionText: 'Retry',
        onAction: () => ref.refresh(branchesProvider),
      ),
      data: (branches) {
        if (branches.isEmpty) {
          return const EmptyStateWidget(
            title: 'No Branches Available',
            message: 'There are currently no branches assigned to your curriculum.',
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: branches.length,
          separatorBuilder: (_, __) => const SizedBox(height: 14),
          itemBuilder: (context, index) {
            final branch = branches[index];
            final colors = [
              AppColors.primaryGreen,
              const Color(0xFF38BDF8),
              AppColors.accentYellow,
              const Color(0xFFA855F7),
            ];
            final color = colors[index % colors.length];

            return Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: () {
                    setState(() {
                      _selectedBranch = branch;
                      _selectedSubject = null;
                      _selectedTopic = null;
                    });
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.14),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Center(
                            child: Icon(
                              _getBranchIcon(branch.name),
                              color: color,
                              size: 26,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                branch.name,
                                style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w700),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Tap to explore subjects & test modules',
                                style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ),
              ),
            ).animate().fadeIn(delay: (index * 60).ms).slideY(begin: 0.08, end: 0);
          },
        );
      },
    );
  }

  // ==========================================
  // LEVEL 1: BRANCH SUBJECTS (GRID)
  // ==========================================
  Widget _buildBranchSubjectsView(BranchModel branch) {
    final subjectsAsync = ref.watch(subjectsByBranchProvider(branch.id));

    return subjectsAsync.when(
      loading: () => GridView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: 4,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.15,
        ),
        itemBuilder: (_, __) => const ShimmerCard(height: 130, borderRadius: 16),
      ),
      error: (err, _) => EmptyStateWidget(
        title: 'Failed to load subjects',
        message: err.toString(),
        actionText: 'Retry',
        onAction: () => ref.refresh(subjectsByBranchProvider(branch.id)),
      ),
      data: (subjects) {
        if (subjects.isEmpty) {
          return EmptyStateWidget(
            title: 'No Subjects Found',
            message: 'No learning subjects are configured under ${branch.name}.',
            actionText: 'Back to Branches',
            onAction: _popInner,
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Branch Header Callout
              Row(
                children: [
                  Expanded(
                    child: Text(
                      branch.name,
                      style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w800),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${subjects.length} Subjects',
                      style: AppTextStyles.label.copyWith(color: AppColors.primaryGreen, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Subject Grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: subjects.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.15,
                ),
                itemBuilder: (context, index) {
                  final subject = subjects[index];
                  final colors = [
                    AppColors.primaryGreen,
                    AppColors.accentYellow,
                    const Color(0xFF38BDF8),
                    const Color(0xFFA855F7),
                    const Color(0xFFEC4899),
                    const Color(0xFF10B981),
                  ];
                  final color = colors[index % colors.length];

                  return InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      setState(() {
                        _selectedSubject = subject;
                        _selectedTopic = null;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceCard,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text(
                                subject.initial,
                                style: AppTextStyles.h3.copyWith(
                                  color: color,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            subject.name,
                            style: AppTextStyles.bodyMd.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Explore Topics & Tests',
                            style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ).animate().fadeIn(delay: (index * 40).ms).scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1));
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // ==========================================
  // LEVEL 2: SUBJECT TOPICS & DIRECT MODULES
  // ==========================================
  Widget _buildSubjectTopicsView(SubjectModel subject) {
    final topicsAsync = ref.watch(topicsBySubjectProvider(subject.id));

    return topicsAsync.when(
      loading: () => ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => const ShimmerCard(height: 80, borderRadius: 16),
      ),
      error: (err, _) => _buildTopicModulesView(
        TopicModel(id: subject.id, name: subject.name, parentId: subject.branchId, type: 'general_subject'),
      ),
      data: (topics) {
        if (topics.isEmpty) {
          // If no sub-topics, directly show modules for this subject node
          return _buildTopicModulesView(
            TopicModel(id: subject.id, name: subject.name, parentId: subject.branchId, type: 'general_subject'),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: topics.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final topic = topics[index];
            return Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () {
                    setState(() {
                      _selectedTopic = topic;
                    });
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Icon(Icons.folder_open_rounded, color: AppColors.primaryGreen, size: 22),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                topic.name,
                                style: AppTextStyles.bodyLg.copyWith(fontWeight: FontWeight.w700),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Tap to open modules & tests',
                                style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ),
              ),
            ).animate().fadeIn(delay: (index * 40).ms).slideY(begin: 0.05, end: 0);
          },
        );
      },
    );
  }

  // ==========================================
  // LEVEL 3: TOPIC MODULES (LIST)
  // ==========================================
  Widget _buildTopicModulesView(TopicModel topic) {
    final modulesAsync = ref.watch(modulesByTopicProvider(topic.id));

    return modulesAsync.when(
      loading: () => ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => const ShimmerCard(height: 100, borderRadius: 18),
      ),
      error: (err, _) => EmptyStateWidget(
        title: 'Failed to load modules',
        message: err.toString(),
        actionText: 'Retry',
        onAction: () => ref.refresh(modulesByTopicProvider(topic.id)),
      ),
      data: (modules) {
        if (modules.isEmpty) {
          return EmptyStateWidget(
            title: 'No Modules in this Topic',
            message: 'There are no active assessment modules created under ${topic.name} yet.',
            actionText: 'Back',
            onAction: _popInner,
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: modules.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final module = modules[index];
            return ModuleProgressCard(
              module: module,
              onTap: () => context.push('/learn/module/${module.id}'),
            ).animate().fadeIn(delay: (index * 50).ms).slideY(begin: 0.06, end: 0);
          },
        );
      },
    );
  }

  // ==========================================
  // TAB 2: SPACED-REPETITION REVISION
  // ==========================================
  Widget _buildRevisionTab() {
    final notifsAsync = ref.watch(notificationsListProvider);
    final branchesAsync = ref.watch(branchesProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero Revision Info Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF064E3B), Color(0xFF0F172A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                  ),
                  child: const Center(
                    child: Icon(Icons.auto_stories_rounded, color: Color(0xFF10B981), size: 26),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Revision Engine',
                        style: AppTextStyles.h2.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Automated spaced repetition at Day 1, Day 3, Day 7, and 30 Days to maximize memory retention.',
                        style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary, height: 1.4),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 20),

          // Spaced Intervals Milestone Grid
          Text('Revision Schedule', style: AppTextStyles.h3),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildIntervalCard('Day 1', 'Topic Recall', Icons.flash_on_rounded, const Color(0xFF10B981))),
              const SizedBox(width: 8),
              Expanded(child: _buildIntervalCard('Day 3', 'Module Check', Icons.track_changes_rounded, const Color(0xFF38BDF8))),
              const SizedBox(width: 8),
              Expanded(child: _buildIntervalCard('Day 7', 'Weekly Review', Icons.calendar_month_rounded, const Color(0xFFF59E0B))),
              const SizedBox(width: 8),
              Expanded(child: _buildIntervalCard('30 Days', 'Full Mastery', Icons.military_tech_rounded, const Color(0xFFA855F7))),
            ],
          ),
          const SizedBox(height: 24),

          // Pending Revision Sessions
          Text('Due Revision Tests', style: AppTextStyles.h3),
          const SizedBox(height: 12),
          notifsAsync.when(
            loading: () => const ShimmerCard(height: 100, borderRadius: 16),
            error: (_, __) => _buildEmptyRevisionState(),
            data: (notifs) {
              final revisionNotifs = notifs.where((n) => n.isRevision || n.type.startsWith('revision')).toList();
              if (revisionNotifs.isEmpty) {
                return _buildEmptyRevisionState();
              }

              return ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: revisionNotifs.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final notif = revisionNotifs[index];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                notif.title,
                                style: AppTextStyles.label.copyWith(color: const Color(0xFF10B981), fontWeight: FontWeight.bold),
                              ),
                            ),
                            Text(
                              notif.timeAgo,
                              style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          notif.message,
                          style: AppTextStyles.bodyMd.copyWith(color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primaryGreen,
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            icon: const Icon(Icons.play_arrow_rounded, size: 20),
                            label: Text(
                              'Start Revision Assessment',
                              style: AppTextStyles.button.copyWith(color: Colors.black, fontWeight: FontWeight.bold),
                            ),
                            onPressed: () {
                              if (notif.topicId != null && notif.topicId!.isNotEmpty) {
                                context.push('/exam/rev_${notif.topicId}');
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: (index * 60).ms);
                },
              );
            },
          ),
          const SizedBox(height: 24),

          // Quick Revision Launcher from Enrolled Branches
          Text('Instant Topic Revision', style: AppTextStyles.h3),
          const SizedBox(height: 6),
          Text(
            'Launch a 50-MCQ random revision test from any enrolled branch topic bank.',
            style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          branchesAsync.when(
            loading: () => const ShimmerCard(height: 70, borderRadius: 14),
            error: (_, __) => const SizedBox.shrink(),
            data: (branches) {
              if (branches.isEmpty) return const SizedBox.shrink();
              return Column(
                children: branches.map((b) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(_getBranchIcon(b.name), color: AppColors.primaryGreen, size: 20),
                      ),
                      title: Text(
                        b.name,
                        style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        'Tap to select a topic for revision test',
                        style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary, fontSize: 11),
                      ),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                      onTap: () {
                        setState(() {
                          _selectedBranch = b;
                          _tabController.animateTo(0);
                        });
                      },
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildIntervalCard(String day, String title, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 6),
          Text(
            day,
            style: AppTextStyles.bodySm.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: AppTextStyles.label.copyWith(color: AppColors.textMuted, fontSize: 9),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyRevisionState() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle_outline_rounded, color: AppColors.primaryGreen, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            'All Revisions Up-to-Date',
            style: AppTextStyles.bodyLg.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            'Complete topics in the Branches tab to automatically schedule Day 1, Day 3, and Day 7 revision check-ins here.',
            style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  IconData _getBranchIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('electr')) return Icons.bolt_rounded;
    if (lower.contains('mech')) return Icons.settings_rounded;
    if (lower.contains('civil')) return Icons.apartment_rounded;
    if (lower.contains('comp') || lower.contains('cs') || lower.contains('it')) return Icons.laptop_chromebook_rounded;
    if (lower.contains('general')) return Icons.menu_book_rounded;
    return Icons.school_rounded;
  }
}
