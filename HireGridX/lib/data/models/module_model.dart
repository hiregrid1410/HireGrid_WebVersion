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

    int parseNum(dynamic val, int defaultVal) {
      if (val is num) return val.toInt();
      if (val is String) {
        final d = double.tryParse(val);
        if (d != null) return d.toInt();
      }
      return defaultVal;
    }

    final qCount = parseNum(json['questionCount'], 20);
    final duration = parseNum(json['timeLimit'] ?? json['durationMinutes'], 30);
    final passPct = parseNum(json['passPercentage'], 60);
    final bestSc = json['bestScore'] != null ? parseNum(json['bestScore'], 0) : null;

    return ModuleTestModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Test Assessment',
      difficulty: diff,
      questionCount: qCount,
      durationMinutes: duration,
      passPercentage: passPct,
      isLocked: json['isLocked'] == true || json['isPremium'] == true,
      bestScore: bestSc,
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
    final isPrem = json['isPremium'] == true || json['is_premium'] == true || json['accessType'] == 'paid' || json['accessType'] == 'premium_purchasable';
    
    int parseNum(dynamic val, int defaultVal) {
      if (val is num) return val.toInt();
      if (val is String) {
        final d = double.tryParse(val);
        if (d != null) return d.toInt();
      }
      return defaultVal;
    }

    final rawQCnt = parseNum(json['questionCount'], 0);
    final duration = parseNum(json['timeLimit'], 30);
    final questionCnt = rawQCnt > 0 ? rawQCnt : 20;

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
          durationMinutes: duration,
          passPercentage: 60,
          status: ModuleStatus.passed,
        ),
        ModuleTestModel(
          id: '${json['id']}_med',
          title: 'Test 2 - Medium',
          difficulty: ModuleDifficulty.medium,
          questionCount: questionCnt,
          durationMinutes: duration,
          passPercentage: 70,
          status: ModuleStatus.notStarted,
        ),
        ModuleTestModel(
          id: '${json['id']}_hard',
          title: 'Test 3 - Hard',
          difficulty: ModuleDifficulty.hard,
          questionCount: questionCnt,
          durationMinutes: duration,
          passPercentage: 75,
          isLocked: isPrem,
          status: isPrem ? ModuleStatus.locked : ModuleStatus.notStarted,
        ),
      ];
    }

    double parseProg(dynamic val) {
      if (val is num) return val.toDouble();
      if (val is String) {
        final d = double.tryParse(val);
        if (d != null) return d;
      }
      return 0.25;
    }

    return ModuleModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Learning Module',
      category: json['category']?.toString() ?? 'General Aptitude',
      subjectName: json['subjectName']?.toString() ?? json['category']?.toString() ?? 'General',
      totalQuestions: questionCnt,
      totalTests: parsedTests.length,
      progress: parseProg(json['progress']),
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
    
    int parseNum(dynamic val, int defaultVal) {
      if (val is num) return val.toInt();
      if (val is String) {
        final d = double.tryParse(val);
        if (d != null) return d.toInt();
      }
      return defaultVal;
    }

    return SubjectModel(
      id: json['id']?.toString() ?? '',
      name: name,
      branchId: json['parentId']?.toString() ?? json['branch_id']?.toString() ?? 'branch_general',
      initial: name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'S',
      totalModules: parseNum(json['moduleCount'] ?? json['totalModules'], 10),
      completedModules: parseNum(json['completedCount'] ?? json['completedModules'], 4),
    );
  }
}
