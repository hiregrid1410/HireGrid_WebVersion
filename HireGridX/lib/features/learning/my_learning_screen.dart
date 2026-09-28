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
  // Level 0: selectedBranch == null, selectedSubject == null  (Shows Branches list)
  // Level 1: selectedBranch != null, selectedSubject == null  (Shows Branch's Subjects)
  // Level 2: selectedBranch != null, selectedSubject != null  (Shows Subject's Modules)
  BranchModel? _selectedBranch;
  SubjectModel? _selectedSubject;

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
    return _selectedSubject != null || _selectedBranch != null;
  }

  void _popInner() {
    setState(() {
      if (_selectedSubject != null) {
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
    });
  }

  void _jumpToBranch() {
    setState(() {
      _selectedSubject = null;
    });
  }

  String _currentTitle() {
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
              Tab(text: 'My Progress'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabController,
          children: [
            // TAB 1: BRANCHES & HIERARCHY
            _buildHierarchyView(),

            // TAB 2: MY PROGRESS
            _buildProgressTab(),
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
          child: _selectedSubject != null
              ? _buildSubjectModulesView(_selectedSubject!)
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
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Text(
                  _selectedSubject!.name.toUpperCase(),
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
                            '${subject.completedModules}/${subject.totalModules} Done',
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
  // LEVEL 2: SUBJECT MODULES (LIST)
  // ==========================================
  Widget _buildSubjectModulesView(SubjectModel subject) {
    final modulesAsync = ref.watch(modulesBySubjectProvider(subject.id));

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
        onAction: () => ref.refresh(modulesBySubjectProvider(subject.id)),
      ),
      data: (modules) {
        if (modules.isEmpty) {
          return EmptyStateWidget(
            title: 'No Modules in this Subject',
            message: 'There are no active assessment modules created under ${subject.name} yet.',
            actionText: 'Back to Subjects',
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
  // TAB 2: MY PROGRESS
  // ==========================================
  Widget _buildProgressTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Overall Progress Ring Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.cardGradient,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.borderSubtle),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 80,
                  height: 80,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const CircularProgressIndicator(
                        value: 0.48,
                        strokeWidth: 8,
                        backgroundColor: AppColors.surfaceInput,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                      ),
                      Text(
                        '48%',
                        style: AppTextStyles.h2.copyWith(
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Overall Mastery', style: AppTextStyles.h2),
                      const SizedBox(height: 4),
                      Text(
                        'Track completion across your enrolled branches and modules.',
                        style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 24),

          Text('Category Breakdown', style: AppTextStyles.h3),
          const SizedBox(height: 12),
          _buildProgressCategoryRow('Electrical Engineering', 0.65, AppColors.primaryGreen),
          const SizedBox(height: 10),
          _buildProgressCategoryRow('Quantitative Aptitude', 0.50, AppColors.accentYellow),
          const SizedBox(height: 10),
          _buildProgressCategoryRow('Reasoning & Soft Skills', 0.35, const Color(0xFF38BDF8)),
        ],
      ),
    );
  }

  Widget _buildProgressCategoryRow(String label, double progress, Color color) {
    final pct = (progress * 100).toInt();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600)),
              Text('$pct%', style: AppTextStyles.bodySm.copyWith(color: color, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppColors.surfaceInput,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
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
