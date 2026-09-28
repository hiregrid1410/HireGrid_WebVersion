import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../providers/app_providers.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _collegeController;
  late TextEditingController _universityController;
  late TextEditingController _gradYearController;

  String _selectedBranch = 'Electrical Engineering';
  String _selectedSemester = '4th Semester';
  bool _isLoading = false;

  final List<String> _semesters = [
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8',
  ];

  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider).value;
    _nameController = TextEditingController(text: user?.name ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _collegeController = TextEditingController(text: user?.collegeName ?? '');
    _universityController = TextEditingController(text: user?.universityName ?? '');
    _gradYearController = TextEditingController(text: user?.graduationYear ?? '');
    _selectedBranch = user?.branch ?? 'Electrical Engineering';
    
    final sem = user?.semester ?? 'Semester 4';
    if (_semesters.contains(sem)) {
      _selectedSemester = sem;
    } else if (sem.contains('4')) {
      _selectedSemester = 'Semester 4';
    } else {
      _selectedSemester = _semesters.first;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _collegeController.dispose();
    _universityController.dispose();
    _gradYearController.dispose();
    super.dispose();
  }

  void _saveProfile() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(currentUserProvider.notifier).updateProfile(
            name: _nameController.text.trim(),
            branch: _selectedBranch,
            semester: _selectedSemester,
          );
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Profile updated successfully!', style: AppTextStyles.bodySm.copyWith(color: Colors.white)),
            backgroundColor: AppColors.primaryGreenDark,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: $e', style: AppTextStyles.bodySm),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  void _openBranchPicker() {
    final branchesAsync = ref.read(branchesProvider);
    final branchesList = branchesAsync.value ?? [];

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceCardElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Switch Specialty / Branch', style: AppTextStyles.h2),
            const SizedBox(height: 8),
            Text(
              'Select your core engineering discipline to customize your study modules.',
              style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            ...branchesList.map((b) {
              final isCur = b.name == _selectedBranch;
              return ListTile(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                tileColor: isCur ? AppColors.primaryGreen.withOpacity(0.12) : null,
                leading: Icon(
                  isCur ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                  color: isCur ? AppColors.primaryGreen : AppColors.textMuted,
                ),
                title: Text(
                  b.name,
                  style: AppTextStyles.bodyMd.copyWith(
                    fontWeight: isCur ? FontWeight.w700 : FontWeight.w500,
                    color: isCur ? AppColors.primaryGreen : AppColors.textPrimary,
                  ),
                ),
                onTap: () {
                  setState(() => _selectedBranch = b.name);
                  Navigator.pop(ctx);
                },
              );
            }),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('OPERATOR PROFILE SETTINGS'),
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
              // Avatar
              Center(
                child: CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.surfaceCardElevated,
                  child: Text(
                    _nameController.text.isNotEmpty ? _nameController.text.substring(0, 1).toUpperCase() : 'S',
                    style: AppTextStyles.h1.copyWith(color: AppColors.primaryGreen, fontSize: 28),
                  ),
                ),
              ).animate().scale(curve: Curves.easeOutBack),
              const SizedBox(height: 24),

              // Full Name
              AppTextField(
                label: 'Full Name',
                hintText: 'Your Full Name',
                controller: _nameController,
                prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.textMuted, size: 20),
              ),
              const SizedBox(height: 16),

              // Email
              AppTextField(
                label: 'Email Address (Read-Only)',
                hintText: 'email@example.com',
                controller: _emailController,
                readOnly: true,
                prefixIcon: const Icon(Icons.email_outlined, color: AppColors.textMuted, size: 20),
              ),
              const SizedBox(height: 16),

              // Academic Semester Dropdown
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Academic Semester', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
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
                        value: _selectedSemester,
                        isExpanded: true,
                        dropdownColor: AppColors.surfaceCardElevated,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted),
                        items: _semesters.map((s) {
                          return DropdownMenuItem(
                            value: s,
                            child: Text(s, style: AppTextStyles.bodyMd.copyWith(color: AppColors.textPrimary)),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedSemester = val);
                        },
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Academic Branch with Switch Specialty Button
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Academic Branch', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceInput,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            _selectedBranch,
                            style: AppTextStyles.bodyMd.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: _openBranchPicker,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primaryGreen.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Switch Specialty',
                              style: AppTextStyles.label.copyWith(
                                color: AppColors.primaryGreen,
                                fontWeight: FontWeight.w700,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // College Name
              AppTextField(
                label: 'College Name',
                hintText: 'e.g. Government Engineering College',
                controller: _collegeController,
                prefixIcon: const Icon(Icons.school_outlined, color: AppColors.textMuted, size: 20),
              ),
              const SizedBox(height: 16),

              // Graduation Year & University
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Graduation Year',
                      hintText: 'e.g. 2026',
                      controller: _gradYearController,
                      prefixIcon: const Icon(Icons.calendar_today_outlined, color: AppColors.textMuted, size: 18),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'University',
                      hintText: 'e.g. GTU',
                      controller: _universityController,
                      prefixIcon: const Icon(Icons.account_balance_outlined, color: AppColors.textMuted, size: 18),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Save Button
              PrimaryButton(
                text: 'SAVE PROFILE CHANGES',
                isLoading: _isLoading,
                onPressed: _saveProfile,
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
