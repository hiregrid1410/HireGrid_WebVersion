class MedalInfo {
  final String name;
  final String fullName;
  final int min;
  final int max;
  final double percentage;

  const MedalInfo({
    required this.name,
    required this.fullName,
    required this.min,
    required this.max,
    required this.percentage,
  });
}

MedalInfo getMedalTier(int xp) {
  final tiers = [
    {'name': 'Bronze', 'min': 0, 'max': 1000},
    {'name': 'Silver', 'min': 1000, 'max': 2500},
    {'name': 'Gold', 'min': 2500, 'max': 4500},
    {'name': 'Platinum', 'min': 4500, 'max': 7500},
    {'name': 'Diamond', 'min': 7500, 'max': 12000},
    {'name': 'Crown', 'min': 12000, 'max': 18000},
    {'name': 'Ace', 'min': 18000, 'max': 25000},
    {'name': 'Conqueror', 'min': 25000, 'max': 9999999},
  ];

  final tier = tiers.reversed.firstWhere(
    (t) => xp >= (t['min'] as int),
    orElse: () => tiers.first,
  );

  final tierName = tier['name'] as String;
  final tierMin = tier['min'] as int;
  final tierMax = tier['max'] as int;
  final tierRange = tierMax - tierMin;

  String subTier = '';
  if (['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown'].contains(tierName)) {
    final subdiv = tierRange / 5.0;
    final progress = xp - tierMin;
    final step = 4 - ((progress.clamp(0, tierRange - 1)) / subdiv).floor();
    const roman = ['I', 'II', 'III', 'IV', 'V'];
    if (step >= 0 && step < roman.length) {
      subTier = ' ${roman[step]}';
    }
  }

  final percentage = tierMax >= 9999999 ? 100.0 : ((xp - tierMin) / tierRange * 100.0).clamp(0.0, 100.0);

  return MedalInfo(
    name: tierName,
    fullName: '$tierName$subTier',
    min: tierMin,
    max: tierMax,
    percentage: percentage,
  );
}

class UserModel {
  final String id;
  final String name;
  final String email;
  final String branch;
  final String? branchId;
  final String semester;
  final String? collegeName;
  final String? universityName;
  final String? graduationYear;
  final int totalXp;
  final int currentStreak;
  final int currentRank;
  final String? avatarUrl;
  final bool hasFullPremium;
  final String? activePlanId;
  final dynamic planExpiry;
  final List<dynamic>? allowedDevices;
  final Map<String, dynamic> moduleScores;
  final Map<String, dynamic> grantedCompanyAccess;
  final Map<String, dynamic> grantedSubjectAccess;
  final Map<String, dynamic> grantedTopicAccess;
  final Map<String, dynamic> grantedExamAccess;
  final Map<String, dynamic> grantedModuleAccess;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.branch,
    this.branchId,
    required this.semester,
    this.collegeName,
    this.universityName,
    this.graduationYear,
    required this.totalXp,
    required this.currentStreak,
    required this.currentRank,
    this.avatarUrl,
    this.hasFullPremium = false,
    this.activePlanId,
    this.planExpiry,
    this.allowedDevices,
    this.moduleScores = const {},
    this.grantedCompanyAccess = const {},
    this.grantedSubjectAccess = const {},
    this.grantedTopicAccess = const {},
    this.grantedExamAccess = const {},
    this.grantedModuleAccess = const {},
  });

  String get medalTier => getMedalTier(totalXp).fullName;
  String get planStatus => hasFullPremium ? 'premium' : 'free';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic v, int fallback) {
      if (v is num) return v.toInt();
      if (v is String) return int.tryParse(v) ?? fallback;
      return fallback;
    }

    Map<String, dynamic> parseMap(dynamic v) {
      if (v is Map<String, dynamic>) return v;
      if (v is Map) return Map<String, dynamic>.from(v);
      return {};
    }

    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Student',
      email: json['email']?.toString() ?? '',
      branch: json['branch']?.toString() ?? json['student_branch']?.toString() ?? 'Computer Engineering',
      branchId: json['branchId']?.toString() ?? json['branch_id']?.toString(),
      semester: json['semester']?.toString() ?? json['student_semester']?.toString() ?? '4',
      collegeName: json['collegeName']?.toString() ?? json['college_name']?.toString(),
      universityName: json['universityName']?.toString() ?? json['university_name']?.toString(),
      graduationYear: json['graduationYear']?.toString() ?? json['graduation_year']?.toString(),
      totalXp: parseInt(json['xp'] ?? json['totalXp'], 0),
      currentStreak: parseInt(json['streak'] ?? json['currentStreak'], 0),
      currentRank: parseInt(json['rank'] ?? json['currentRank'], 1),
      avatarUrl: json['profilePicture']?.toString() ?? json['profile_picture']?.toString() ?? json['avatarUrl']?.toString(),
      hasFullPremium: json['hasFullPremium'] == true || json['has_full_premium'] == true,
      activePlanId: json['activePlanId']?.toString() ?? json['active_plan_id']?.toString(),
      planExpiry: json['planExpiry'] ?? json['plan_expiry'],
      allowedDevices: json['allowedDevices'] is List ? json['allowedDevices'] as List : null,
      moduleScores: parseMap(json['module_scores'] ?? json['moduleScores']),
      grantedCompanyAccess: parseMap(json['grantedCompanyAccess'] ?? json['granted_company_access']),
      grantedSubjectAccess: parseMap(json['grantedSubjectAccess'] ?? json['granted_subject_access']),
      grantedTopicAccess: parseMap(json['grantedTopicAccess'] ?? json['granted_topic_access']),
      grantedExamAccess: parseMap(json['grantedExamAccess'] ?? json['granted_exam_access']),
      grantedModuleAccess: parseMap(json['grantedModuleAccess'] ?? json['granted_module_access']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'branch': branch,
      'branchId': branchId,
      'branch_id': branchId,
      'semester': semester,
      'collegeName': collegeName,
      'college_name': collegeName,
      'universityName': universityName,
      'university_name': universityName,
      'graduationYear': graduationYear,
      'graduation_year': graduationYear,
      'totalXp': totalXp,
      'xp': totalXp,
      'currentStreak': currentStreak,
      'streak': currentStreak,
      'currentRank': currentRank,
      'rank': currentRank,
      'avatarUrl': avatarUrl,
      'profilePicture': avatarUrl,
      'hasFullPremium': hasFullPremium,
      'activePlanId': activePlanId,
      'planExpiry': planExpiry,
      'allowedDevices': allowedDevices,
      'module_scores': moduleScores,
      'grantedCompanyAccess': grantedCompanyAccess,
    };
  }

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? branch,
    String? branchId,
    String? semester,
    String? collegeName,
    String? universityName,
    String? graduationYear,
    int? totalXp,
    int? currentStreak,
    int? currentRank,
    String? avatarUrl,
    bool? hasFullPremium,
    String? activePlanId,
    dynamic planExpiry,
    List<dynamic>? allowedDevices,
    Map<String, dynamic>? moduleScores,
    Map<String, dynamic>? grantedCompanyAccess,
    Map<String, dynamic>? grantedSubjectAccess,
    Map<String, dynamic>? grantedTopicAccess,
    Map<String, dynamic>? grantedExamAccess,
    Map<String, dynamic>? grantedModuleAccess,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      branch: branch ?? this.branch,
      branchId: branchId ?? this.branchId,
      semester: semester ?? this.semester,
      collegeName: collegeName ?? this.collegeName,
      universityName: universityName ?? this.universityName,
      graduationYear: graduationYear ?? this.graduationYear,
      totalXp: totalXp ?? this.totalXp,
      currentStreak: currentStreak ?? this.currentStreak,
      currentRank: currentRank ?? this.currentRank,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      hasFullPremium: hasFullPremium ?? this.hasFullPremium,
      activePlanId: activePlanId ?? this.activePlanId,
      planExpiry: planExpiry ?? this.planExpiry,
      allowedDevices: allowedDevices ?? this.allowedDevices,
      moduleScores: moduleScores ?? this.moduleScores,
      grantedCompanyAccess: grantedCompanyAccess ?? this.grantedCompanyAccess,
      grantedSubjectAccess: grantedSubjectAccess ?? this.grantedSubjectAccess,
      grantedTopicAccess: grantedTopicAccess ?? this.grantedTopicAccess,
      grantedExamAccess: grantedExamAccess ?? this.grantedExamAccess,
      grantedModuleAccess: grantedModuleAccess ?? this.grantedModuleAccess,
    );
  }
}

class BranchModel {
  final String id;
  final String name;
  final String iconName;
  final bool isGeneral;
  final String status;

  const BranchModel({
    required this.id,
    required this.name,
    required this.iconName,
    this.isGeneral = false,
    this.status = 'ACTIVE',
  });

  factory BranchModel.fromJson(Map<String, dynamic> json) {
    final name = json['name']?.toString() ?? 'Engineering Branch';
    String icon = 'laptop';
    final lower = name.toLowerCase();
    if (lower.contains('mech')) {
      icon = 'cog';
    } else if (lower.contains('electr') && !lower.contains('comm')) {
      icon = 'zap';
    } else if (lower.contains('civil')) {
      icon = 'building';
    } else if (lower.contains('comm') || lower.contains('ec') || lower.contains('electron')) {
      icon = 'cpu';
    } else if (lower.contains('info') || lower.contains('it')) {
      icon = 'server';
    }

    return BranchModel(
      id: json['id']?.toString() ?? '',
      name: name,
      iconName: icon,
      isGeneral: json['isGeneral'] == true || json['is_general'] == true,
      status: json['status']?.toString() ?? 'ACTIVE',
    );
  }
}
