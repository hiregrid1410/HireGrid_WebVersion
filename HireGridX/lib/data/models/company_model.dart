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
}
