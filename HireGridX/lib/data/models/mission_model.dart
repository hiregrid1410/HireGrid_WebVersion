class MissionExamModel {
  final String id;
  final String title;
  final String companyName;
  final String companyLogo;
  final String typeSubtitle; // e.g. "Accuracy + Speed First"
  final String endsInText; // e.g. "Ends in 3d"
  final bool isLive;

  const MissionExamModel({
    required this.id,
    required this.title,
    required this.companyName,
    required this.companyLogo,
    required this.typeSubtitle,
    required this.endsInText,
    this.isLive = true,
  });

  factory MissionExamModel.fromJson(Map<String, dynamic> json) {
    return MissionExamModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Placement Mission Exam',
      companyName: json['companyName']?.toString() ?? json['company_name']?.toString() ?? 'TCS',
      companyLogo: json['companyLogo']?.toString() ?? json['company_logo']?.toString() ?? 'tcs',
      typeSubtitle: json['description']?.toString() ?? 'Accuracy + Speed First',
      endsInText: 'Live Now',
      isLive: true,
    );
  }
}

class MissionModel {
  final String id;
  final String title;
  final String bannerSubtitle;
  final String description;
  final String countdownText; // e.g. "Ends in 4d 12h 30m"
  final int participantCount;
  final List<MissionExamModel> liveExams;
  final List<MissionExamModel> upcomingExams;

  const MissionModel({
    required this.id,
    required this.title,
    required this.bannerSubtitle,
    required this.description,
    required this.countdownText,
    required this.participantCount,
    required this.liveExams,
    required this.upcomingExams,
  });

  factory MissionModel.fromBackendJson({
    required Map<String, dynamic> cycleJson,
    required List<dynamic> missionsList,
  }) {
    final live = missionsList.map((m) => MissionExamModel.fromJson(m as Map<String, dynamic>)).toList();
    return MissionModel(
      id: cycleJson['id']?.toString() ?? 'cycle_current',
      title: cycleJson['name']?.toString() ?? 'Weekly Placement Challenge',
      bannerSubtitle: 'This Week\'s Mission',
      description: 'Compete with 2,400+ engineering students in real company-timed rounds. Top 10 win HireGridX Pro passes & verified recruiter badges.',
      countdownText: 'Active Cycle',
      participantCount: 2450,
      liveExams: live,
      upcomingExams: [
        const MissionExamModel(
          id: 'upcoming_1',
          title: 'Accenture Cloud & Pseudo-code',
          companyName: 'Accenture',
          companyLogo: 'accenture',
          typeSubtitle: 'Starts Monday',
          endsInText: 'Starts in 2d',
          isLive: false,
        ),
      ],
    );
  }
}

class LeaderboardEntryModel {
  final int rank;
  final String userId;
  final String name;
  final int score;
  final String? avatarUrl;
  final bool isCurrentUser;

  const LeaderboardEntryModel({
    required this.rank,
    required this.userId,
    required this.name,
    required this.score,
    this.avatarUrl,
    this.isCurrentUser = false,
  });

  factory LeaderboardEntryModel.fromJson(Map<String, dynamic> json, {String? currentUserId}) {
    final uid = json['userId']?.toString() ?? json['user_id']?.toString() ?? '';
    return LeaderboardEntryModel(
      rank: (json['rank'] is num) ? (json['rank'] as num).toInt() : 1,
      userId: uid,
      name: json['userName']?.toString() ?? json['user_name']?.toString() ?? 'Student',
      score: (json['xp'] is num) ? (json['xp'] as num).toInt() : (json['score'] is num ? (json['score'] as num).toInt() : 0),
      avatarUrl: json['avatarUrl']?.toString(),
      isCurrentUser: currentUserId != null && currentUserId == uid,
    );
  }
}
