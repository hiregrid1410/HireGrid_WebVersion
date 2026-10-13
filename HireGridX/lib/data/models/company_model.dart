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
    final isPrem = json['isPremium'] == true || json['is_premium'] == true || json['accessType'] == 'paid' || json['accessType'] == 'premium_purchasable' || json['access_type'] == 'paid';
    
    int parseNum(dynamic val, int defaultVal) {
      if (val is num) return val.toInt();
      if (val is String) {
        final d = double.tryParse(val);
        if (d != null) return d.toInt();
      }
      return defaultVal;
    }

    final exams = parseNum(json['examCount'] ?? json['totalExams'], 5);
    final questions = parseNum(json['questionCount'] ?? json['totalQuestions'], 250);
    final salary = parseNum(json['price'], 4);

    return CompanyModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Company',
      logoUrl: json['logoUrl']?.toString() ?? json['logo_url']?.toString() ?? '',
      tier: isPrem ? CompanyTier.premium : CompanyTier.free,
      totalExams: exams,
      totalQuestions: questions,
      description: json['description']?.toString() ?? 'Company recruitment assessment and placement mock tests.',
      hiringCriteria: [
        '60% or 6.0 CGPA in 10th, 12th, and Graduation',
        'No active backlogs allowed during recruitment',
        'Strong foundational problem solving and aptitude',
      ],
      avgSalaryLpa: salary > 0 ? salary : 4,
    );
  }
}
