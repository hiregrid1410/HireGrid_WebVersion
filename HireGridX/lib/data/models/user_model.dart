class UserModel {
  final String id;
  final String name;
  final String email;
  final String branch;
  final String semester;
  final int totalXp;
  final int currentStreak;
  final int currentRank;
  final String? avatarUrl;
  final bool hasFullPremium;
  final String? activePlanId;
  final List<dynamic>? allowedDevices;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.branch,
    required this.semester,
    required this.totalXp,
    required this.currentStreak,
    required this.currentRank,
    this.avatarUrl,
    this.hasFullPremium = false,
    this.activePlanId,
    this.allowedDevices,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Student',
      email: json['email']?.toString() ?? '',
      branch: json['branch']?.toString() ?? json['student_branch']?.toString() ?? 'Computer Engineering',
      semester: json['semester']?.toString() ?? json['student_semester']?.toString() ?? '6th Semester',
      totalXp: (json['xp'] is num) ? (json['xp'] as num).toInt() : (json['totalXp'] is num ? (json['totalXp'] as num).toInt() : 0),
      currentStreak: (json['streak'] is num) ? (json['streak'] as num).toInt() : (json['currentStreak'] is num ? (json['currentStreak'] as num).toInt() : 1),
      currentRank: (json['rank'] is num) ? (json['rank'] as num).toInt() : (json['currentRank'] is num ? (json['currentRank'] as num).toInt() : 1),
      avatarUrl: json['profilePicture']?.toString() ?? json['profile_picture']?.toString() ?? json['avatarUrl']?.toString(),
      hasFullPremium: json['hasFullPremium'] == true || json['has_full_premium'] == true,
      activePlanId: json['activePlanId']?.toString() ?? json['active_plan_id']?.toString(),
      allowedDevices: json['allowedDevices'] is List ? json['allowedDevices'] as List : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'branch': branch,
      'semester': semester,
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
      'allowedDevices': allowedDevices,
    };
  }

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? branch,
    String? semester,
    int? totalXp,
    int? currentStreak,
    int? currentRank,
    String? avatarUrl,
    bool? hasFullPremium,
    String? activePlanId,
    List<dynamic>? allowedDevices,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      branch: branch ?? this.branch,
      semester: semester ?? this.semester,
      totalXp: totalXp ?? this.totalXp,
      currentStreak: currentStreak ?? this.currentStreak,
      currentRank: currentRank ?? this.currentRank,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      hasFullPremium: hasFullPremium ?? this.hasFullPremium,
      activePlanId: activePlanId ?? this.activePlanId,
      allowedDevices: allowedDevices ?? this.allowedDevices,
    );
  }
}

class BranchModel {
  final String id;
  final String name;
  final String iconName;

  const BranchModel({
    required this.id,
    required this.name,
    required this.iconName,
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
    );
  }
}
