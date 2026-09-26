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
}
