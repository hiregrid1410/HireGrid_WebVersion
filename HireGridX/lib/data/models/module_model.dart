enum ModuleDifficulty { easy, medium, hard }
enum ModuleStatus { notStarted, inProgress, passed, failed, locked }

class ModuleTestModel {
  final String id;
  final String title;
  final ModuleDifficulty difficulty;
  final int questionCount;
  final int durationMinutes;
  final int passPercentage;
  final bool isLocked;
  final int? bestScore;
  final ModuleStatus status;

  const ModuleTestModel({
    required this.id,
    required this.title,
    required this.difficulty,
    required this.questionCount,
    required this.durationMinutes,
    required this.passPercentage,
    this.isLocked = false,
    this.bestScore,
    this.status = ModuleStatus.notStarted,
  });
}

class ModuleModel {
  final String id;
  final String title;
  final String category; // e.g. "Aptitude", "Reasoning", "Technical", "Company Specific"
  final String subjectName;
  final int totalQuestions;
  final int totalTests;
  final double progress; // 0.0 to 1.0
  final bool isPremium;
  final String description;
  final List<ModuleTestModel> tests;

  const ModuleModel({
    required this.id,
    required this.title,
    required this.category,
    required this.subjectName,
    required this.totalQuestions,
    required this.totalTests,
    required this.progress,
    required this.isPremium,
    required this.description,
    required this.tests,
  });
}

class SubjectModel {
  final String id;
  final String name;
  final String branchId;
  final String initial;
  final int totalModules;
  final int completedModules;

  const SubjectModel({
    required this.id,
    required this.name,
    required this.branchId,
    required this.initial,
    required this.totalModules,
    required this.completedModules,
  });
}
