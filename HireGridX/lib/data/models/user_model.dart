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
  });

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
}
