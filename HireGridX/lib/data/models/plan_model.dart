enum PlanTierType { basic, premium, ultimate }
enum PlanCategory { company, gate, fullAccess }

class PlanModel {
  final String id;
  final String title;
  final PlanTierType tierType;
  final PlanCategory category;
  final int priceInr;
  final String billingPeriod;
  final String subtitle;
  final List<String> features;
  final bool isPopular;

  const PlanModel({
    required this.id,
    required this.title,
    required this.tierType,
    required this.category,
    required this.priceInr,
    required this.billingPeriod,
    required this.subtitle,
    required this.features,
    this.isPopular = false,
  });
}

enum PaymentRequestStatus { pending, approved, rejected }

class PaymentRequestModel {
  final String id;
  final String planTitle;
  final int amountInr;
  final String transactionId;
  final DateTime createdAt;
  final PaymentRequestStatus status;

  const PaymentRequestModel({
    required this.id,
    required this.planTitle,
    required this.amountInr,
    required this.transactionId,
    required this.createdAt,
    required this.status,
  });
}
