class RevisionScheduleItem {
  final String revisionModuleId;
  final String title;
  final String? branchId;
  final String? branchName;
  final String? subjectId;
  final String? subjectName;
  final String? topicId;
  final String? topicName;
  final int mcqCount;
  final String? stage;
  final String? stageLabel;
  final DateTime? dueAt;
  final String? status;
  final bool isUnlocked;
  final int completedModules;
  final int totalModules;
  final int percentage;

  RevisionScheduleItem({
    required this.revisionModuleId,
    required this.title,
    this.branchId,
    this.branchName,
    this.subjectId,
    this.subjectName,
    this.topicId,
    this.topicName,
    this.mcqCount = 50,
    this.stage,
    this.stageLabel,
    this.dueAt,
    this.status,
    this.isUnlocked = true,
    this.completedModules = 0,
    this.totalModules = 0,
    this.percentage = 100,
  });

  factory RevisionScheduleItem.fromJson(Map<String, dynamic> json) {
    final progress = json['progress'] as Map<String, dynamic>? ?? {};
    DateTime? parsedDue;
    if (json['dueAt'] != null) {
      parsedDue = DateTime.tryParse(json['dueAt'].toString());
    }

    return RevisionScheduleItem(
      revisionModuleId: json['revisionModuleId']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Revision Module',
      branchId: json['branchId']?.toString(),
      branchName: json['branchName']?.toString() ?? 'General Branch',
      subjectId: json['subjectId']?.toString(),
      subjectName: json['subjectName']?.toString() ?? 'General Subject',
      topicId: json['topicId']?.toString(),
      topicName: json['topicName']?.toString() ?? 'Topic Revision',
      mcqCount: json['mcqCount'] is int ? json['mcqCount'] : int.tryParse(json['mcqCount']?.toString() ?? '50') ?? 50,
      stage: json['stage']?.toString() ?? 'day1',
      stageLabel: json['stageLabel']?.toString() ?? 'Day 1',
      dueAt: parsedDue,
      status: json['status']?.toString() ?? 'pending',
      isUnlocked: json['isUnlocked'] == true,
      completedModules: progress['completedModules'] is int ? progress['completedModules'] : int.tryParse(progress['completedModules']?.toString() ?? '0') ?? 0,
      totalModules: progress['totalModules'] is int ? progress['totalModules'] : int.tryParse(progress['totalModules']?.toString() ?? '0') ?? 0,
      percentage: progress['percentage'] is int ? progress['percentage'] : int.tryParse(progress['percentage']?.toString() ?? '100') ?? 100,
    );
  }
}

class RevisionSchedulesResponse {
  final List<RevisionScheduleItem> todayDue;
  final List<RevisionScheduleItem> upcoming;
  final List<RevisionScheduleItem> completed;
  final List<RevisionScheduleItem> allModules;

  RevisionSchedulesResponse({
    required this.todayDue,
    required this.upcoming,
    required this.completed,
    required this.allModules,
  });

  factory RevisionSchedulesResponse.fromJson(Map<String, dynamic> json) {
    final todayList = (json['todayDue'] as List<dynamic>? ?? [])
        .map((e) => RevisionScheduleItem.fromJson(e as Map<String, dynamic>))
        .toList();

    final upList = (json['upcoming'] as List<dynamic>? ?? [])
        .map((e) => RevisionScheduleItem.fromJson(e as Map<String, dynamic>))
        .toList();

    final compList = (json['completed'] as List<dynamic>? ?? [])
        .map((e) => RevisionScheduleItem.fromJson(e as Map<String, dynamic>))
        .toList();

    final allList = (json['revisionModules'] as List<dynamic>? ?? [])
        .map((e) => RevisionScheduleItem.fromJson(e as Map<String, dynamic>))
        .toList();

    return RevisionSchedulesResponse(
      todayDue: todayList,
      upcoming: upList,
      completed: compList,
      allModules: allList,
    );
  }
}
