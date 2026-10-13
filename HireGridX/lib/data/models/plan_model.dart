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

  factory PlanModel.fromJson(Map<String, dynamic> json) {
    final title = json['name']?.toString() ?? json['title']?.toString() ?? 'Plan';
    final lowerTitle = title.toLowerCase();
    PlanTierType tier = PlanTierType.basic;
    bool popular = false;

    if (lowerTitle.contains('ultimate') || lowerTitle.contains('+') || lowerTitle.contains('pro')) {
      tier = PlanTierType.ultimate;
      popular = true;
    } else if (lowerTitle.contains('premium') || lowerTitle.contains('popular') || lowerTitle.contains('hiregridx')) {
      tier = PlanTierType.premium;
    }

    int parseNum(dynamic val, int defaultVal) {
      if (val is num) return val.toInt();
      if (val is String) {
        final d = double.tryParse(val);
        if (d != null) return d.toInt();
      }
      return defaultVal;
    }

    final price = parseNum(json['price'], 199);
    
    String billing = '/ 3 Months';
    final rawDuration = json['duration']?.toString() ?? '';
    final durationDays = json['durationDays'] ?? json['duration_days'];
    if (durationDays != null) {
      billing = '/ $durationDays Days';
    } else if (rawDuration.contains('month')) {
      final m = RegExp(r'\d+').firstMatch(rawDuration)?.group(0);
      billing = m != null ? '/ $m Months' : '/ 3 Months';
    } else if (json['durationMonths'] != null) {
      billing = '/ ${json['durationMonths']} Months';
    }

    List<String> feats = [];
    if (json['features'] is List) {
      feats = (json['features'] as List).map((f) => f.toString()).toList();
    }
    if (feats.isEmpty) {
      final companyCount = (json['companyModules'] is List) ? (json['companyModules'] as List).length : 10;
      final topicCount = (json['learningContent'] is List) ? (json['learningContent'] as List).length : 25;
      feats = [
        'Full Access to $companyCount+ Top Company Assessments',
        '$topicCount+ Core Technical & Aptitude Modules',
        'Detailed Performance Diagnostic Reports',
        'Weekly Placement Mission Entry',
        'Unlimited Retakes & Complete Solutions',
      ];
    }

    return PlanModel(
      id: json['id']?.toString() ?? '',
      title: title,
      tierType: tier,
      category: PlanCategory.company,
      priceInr: price,
      billingPeriod: billing,
      subtitle: json['description']?.toString() ?? 'Full Access to Placement Series & Tests',
      features: feats,
      isPopular: popular || json['isPopular'] == true,
    );
  }
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

  factory PaymentRequestModel.fromJson(Map<String, dynamic> json) {
    final statusStr = json['status']?.toString().toLowerCase() ?? 'pending';
    PaymentRequestStatus st = PaymentRequestStatus.pending;
    if (statusStr.contains('approve') || statusStr.contains('success')) {
      st = PaymentRequestStatus.approved;
    } else if (statusStr.contains('reject')) {
      st = PaymentRequestStatus.rejected;
    }

    DateTime dt = DateTime.now();
    if (json['createdAt'] != null) {
      try {
        dt = DateTime.parse(json['createdAt'].toString());
      } catch (_) {}
    }

    return PaymentRequestModel(
      id: json['id']?.toString() ?? '',
      planTitle: json['itemName']?.toString() ?? json['item_name']?.toString() ?? 'Premium Subscription',
      amountInr: (json['amount'] is num) ? (json['amount'] as num).toInt() : 1499,
      transactionId: json['transactionId']?.toString() ?? json['transaction_id']?.toString() ?? 'UTR_RECORD',
      createdAt: dt,
      status: st,
    );
  }
}
