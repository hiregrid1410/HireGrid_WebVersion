import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/stat_widgets.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class CompaniesScreen extends ConsumerStatefulWidget {
  const CompaniesScreen({super.key});

  @override
  ConsumerState<CompaniesScreen> createState() => _CompaniesScreenState();
}

class _CompaniesScreenState extends ConsumerState<CompaniesScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final companiesAsync = ref.watch(companiesListProvider);
    final activeFilter = ref.watch(companiesFilterProvider);
    final userAsync = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('COMPANY EXAMS DIRECTORY'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: TextFormField(
                controller: _searchController,
                onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Search company by name...',
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, color: AppColors.textMuted, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                ),
              ),
            ),

            // Filter Chips (All / Premium / Free)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              child: Row(
                children: ['All', 'Premium', 'Free'].map((f) {
                  final isSelected = activeFilter == f;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(f),
                      selected: isSelected,
                      selectedColor: AppColors.primaryGreen,
                      backgroundColor: AppColors.surfaceCard,
                      labelStyle: AppTextStyles.bodySm.copyWith(
                        color: isSelected ? Colors.black : AppColors.textSecondary,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                        side: BorderSide(
                          color: isSelected ? AppColors.primaryGreen : AppColors.borderSubtle,
                        ),
                      ),
                      onSelected: (_) {
                        ref.read(companiesFilterProvider.notifier).state = f;
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 8),

            // Company Grid
            Expanded(
              child: companiesAsync.when(
                loading: () => GridView.builder(
                  padding: const EdgeInsets.all(20),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    childAspectRatio: 0.88,
                  ),
                  itemCount: 6,
                  itemBuilder: (_, __) => const ShimmerCard(height: 160, borderRadius: 16),
                ),
                error: (err, _) => EmptyStateWidget(
                  title: 'Unable to load companies',
                  message: err.toString(),
                  actionText: 'Retry',
                  onAction: () => ref.refresh(companiesListProvider),
                ),
                data: (companies) {
                  final filtered = companies.where((c) {
                    if (_searchQuery.isEmpty) return true;
                    return c.name.toLowerCase().contains(_searchQuery);
                  }).toList();

                  if (filtered.isEmpty) {
                    return const EmptyStateWidget(
                      icon: Icons.search_off_rounded,
                      title: 'No Companies Found',
                      message: 'Try adjusting your search keywords or filter.',
                    );
                  }

                  final user = userAsync.value;
                  final isUserPremium = user?.planStatus == 'premium';

                  return GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: 0.82,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final company = filtered[index];
                      // Company is unlocked if free or user is premium or in grantedCompanyAccess
                      final isPaid = company.tier.name == 'premium' && !isUserPremium;

                      return InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () {
                          context.push('/companies/${company.id}');
                        },
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceCard,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isPaid ? AppColors.borderSubtle : AppColors.primaryGreen.withOpacity(0.3),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: AppColors.surfaceInput,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppColors.borderSubtle),
                                    ),
                                    child: Center(
                                      child: Text(
                                        company.name.substring(0, company.name.length >= 3 ? 3 : company.name.length).toUpperCase(),
                                        style: AppTextStyles.h3.copyWith(
                                          color: isPaid ? AppColors.textSecondary : AppColors.primaryGreen,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ),
                                  TierBadge(
                                    isPremium: isPaid,
                                    customText: isPaid ? 'PAID' : 'UNLOCKED',
                                  ),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    company.name,
                                    style: AppTextStyles.h3.copyWith(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 15,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${company.totalExams} Assessments',
                                    style: AppTextStyles.bodySm.copyWith(
                                      color: AppColors.textSecondary,
                                      fontSize: 11,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Avg: ${company.avgSalaryLpa} LPA',
                                    style: AppTextStyles.bodySm.copyWith(
                                      color: AppColors.accentYellow,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ).animate().fadeIn(delay: (index * 30).ms);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
