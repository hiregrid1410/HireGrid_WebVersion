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
  String _selectedBranch = 'Computer Engineering';
  String _selectedSemester = '6th Semester';
  bool _isLoading = false;

  final List<String> _branches = [
    'Computer Engineering',
    'Information Technology',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Electronics & Communication',
  ];

  final List<String> _semesters = [
    '1st Semester',
    '2nd Semester',
    '3rd Semester',
    '4th Semester',
    '5th Semester',
    '6th Semester',
    '7th Semester',
    '8th Semester',
  ];

  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider).value;
    _nameController = TextEditingController(text: user?.name ?? 'Jevin Parmar');
    _emailController = TextEditingController(text: user?.email ?? 'jevin@example.com');
    _selectedBranch = user?.branch ?? 'Computer Engineering';
    _selectedSemester = user?.semester ?? '6th Semester';
  }

  void _saveProfile() async {
    setState(() => _isLoading = true);
    await ref.read(currentUserProvider.notifier).updateProfile(
          name: _nameController.text,
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar with Edit Badge
              Center(
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 46,
                      backgroundColor: AppColors.surfaceCardElevated,
                      child: Text(
                        _nameController.text.isNotEmpty ? _nameController.text.substring(0, 1).toUpperCase() : 'J',
                        style: AppTextStyles.h1.copyWith(color: AppColors.primaryGreen, fontSize: 32),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: AppColors.primaryGreen,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.camera_alt_rounded, size: 16, color: Colors.black),
                      ),
                    ),
                  ],
                ),
              ).animate().scale(curve: Curves.easeOutBack),
              const SizedBox(height: 28),

              // Fields
              AppTextField(
                label: 'Full Name',
                hintText: 'Your Full Name',
                controller: _nameController,
                prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.textMuted, size: 20),
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Email Address (Read-Only)',
                hintText: 'email@example.com',
                controller: _emailController,
                readOnly: true,
                prefixIcon: const Icon(Icons.email_outlined, color: AppColors.textMuted, size: 20),
              ),
              const SizedBox(height: 16),

              // Branch
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Branch', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
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
                        value: _selectedBranch,
                        isExpanded: true,
                        dropdownColor: AppColors.surfaceCardElevated,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted),
                        items: _branches.map((b) {
                          return DropdownMenuItem(
                            value: b,
                            child: Text(b, style: AppTextStyles.bodyMd.copyWith(color: AppColors.textPrimary)),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedBranch = val);
                        },
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Semester
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Semester', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
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
              const SizedBox(height: 32),

              PrimaryButton(
                text: 'Save Changes',
                isLoading: _isLoading,
                onPressed: _saveProfile,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
