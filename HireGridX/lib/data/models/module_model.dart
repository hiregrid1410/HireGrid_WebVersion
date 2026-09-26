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

  factory ModuleTestModel.fromJson(Map<String, dynamic> json) {
    final diffStr = json['difficulty']?.toString().toLowerCase() ?? 'easy';
    ModuleDifficulty diff = ModuleDifficulty.easy;
    if (diffStr.contains('med')) diff = ModuleDifficulty.medium;
    if (diffStr.contains('hard')) diff = ModuleDifficulty.hard;

    return ModuleTestModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Test Assessment',
      difficulty: diff,
      questionCount: (json['questionCount'] is num) ? (json['questionCount'] as num).toInt() : 20,
      durationMinutes: (json['timeLimit'] is num) ? (json['timeLimit'] as num).toInt() : ((json['durationMinutes'] is num) ? (json['durationMinutes'] as num).toInt() : 30),
      passPercentage: (json['passPercentage'] is num) ? (json['passPercentage'] as num).toInt() : 60,
      isLocked: json['isLocked'] == true || json['isPremium'] == true,
      bestScore: (json['bestScore'] is num) ? (json['bestScore'] as num).toInt() : null,
      status: json['isLocked'] == true ? ModuleStatus.locked : ModuleStatus.notStarted,
    );
  }
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

  factory ModuleModel.fromJson(Map<String, dynamic> json) {
    final isPrem = json['isPremium'] == true || json['is_premium'] == true || json['accessType'] == 'paid';
    final questionCnt = (json['questionCount'] is num) ? (json['questionCount'] as num).toInt() : 20;

    // Generate tests or parse subTests if available
    List<ModuleTestModel> parsedTests = [];
    if (json['subTests'] is List && (json['subTests'] as List).isNotEmpty) {
      parsedTests = (json['subTests'] as List).map((t) => ModuleTestModel.fromJson(t as Map<String, dynamic>)).toList();
    } else {
      parsedTests = [
        ModuleTestModel(
          id: '${json['id']}_easy',
          title: 'Test 1 - Easy',
          difficulty: ModuleDifficulty.easy,
          questionCount: questionCnt,
          durationMinutes: (json['timeLimit'] is num) ? (json['timeLimit'] as num).toInt() : 30,
          passPercentage: 60,
          status: ModuleStatus.passed,
        ),
        ModuleTestModel(
          id: '${json['id']}_med',
          title: 'Test 2 - Medium',
          difficulty: ModuleDifficulty.medium,
          questionCount: questionCnt,
          durationMinutes: (json['timeLimit'] is num) ? (json['timeLimit'] as num).toInt() : 30,
          passPercentage: 70,
          status: ModuleStatus.notStarted,
        ),
        ModuleTestModel(
          id: '${json['id']}_hard',
          title: 'Test 3 - Hard',
          difficulty: ModuleDifficulty.hard,
          questionCount: questionCnt,
          durationMinutes: (json['timeLimit'] is num) ? (json['timeLimit'] as num).toInt() : 30,
          passPercentage: 75,
          isLocked: isPrem,
          status: isPrem ? ModuleStatus.locked : ModuleStatus.notStarted,
        ),
      ];
    }

    return ModuleModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Learning Module',
      category: json['category']?.toString() ?? 'General Aptitude',
      subjectName: json['subjectName']?.toString() ?? json['category']?.toString() ?? 'General',
      totalQuestions: questionCnt,
      totalTests: parsedTests.length,
      progress: (json['progress'] is num) ? (json['progress'] as num).toDouble() : 0.25,
      isPremium: isPrem,
      description: json['description']?.toString() ?? 'Comprehensive placement module with speed tests.',
      tests: parsedTests,
    );
  }
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

  factory SubjectModel.fromJson(Map<String, dynamic> json) {
    final name = json['name']?.toString() ?? 'Subject';
    return SubjectModel(
      id: json['id']?.toString() ?? '',
      name: name,
      branchId: json['parentId']?.toString() ?? json['branch_id']?.toString() ?? 'ce',
      initial: name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'S',
      totalModules: (json['moduleCount'] is num) ? (json['moduleCount'] as num).toInt() : 10,
      completedModules: (json['completedCount'] is num) ? (json['completedCount'] as num).toInt() : 4,
    );
  }
}
