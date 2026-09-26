enum CompanyTier { free, premium }

class CompanyModel {
  final String id;
  final String name;
  final String logoUrl;
  final CompanyTier tier;
  final int totalExams;
  final int totalQuestions;
  final String description;
  final List<String> hiringCriteria;
  final int avgSalaryLpa;

  const CompanyModel({
    required this.id,
    required this.name,
    required this.logoUrl,
    required this.tier,
    required this.totalExams,
    required this.totalQuestions,
    required this.description,
    required this.hiringCriteria,
    required this.avgSalaryLpa,
  });

  factory CompanyModel.fromJson(Map<String, dynamic> json) {
    final isPrem = json['isPremium'] == true || json['is_premium'] == true || json['accessType'] == 'paid' || json['access_type'] == 'paid';
    return CompanyModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Company',
      logoUrl: json['logoUrl']?.toString() ?? json['logo_url']?.toString() ?? '',
      tier: isPrem ? CompanyTier.premium : CompanyTier.free,
      totalExams: (json['examCount'] is num) ? (json['examCount'] as num).toInt() : (json['totalExams'] is num ? (json['totalExams'] as num).toInt() : 5),
      totalQuestions: (json['questionCount'] is num) ? (json['questionCount'] as num).toInt() : (json['totalQuestions'] is num ? (json['totalQuestions'] as num).toInt() : 250),
      description: json['description']?.toString() ?? 'Company recruitment assessment and placement mock tests.',
      hiringCriteria: [
        '60% or 6.0 CGPA in 10th, 12th, and Graduation',
        'No active backlogs allowed during recruitment',
        'Strong foundational problem solving and aptitude',
      ],
      avgSalaryLpa: (json['price'] is num && (json['price'] as num) > 0) ? (json['price'] as num).toInt() : 4,
    );
  }
}
