import '../models/user_model.dart';
import '../models/company_model.dart';
import '../models/module_model.dart';
import '../models/question_model.dart';
import '../models/mission_model.dart';
import '../models/plan_model.dart';
import '../models/device_model.dart';
import '../repositories/app_repositories.dart';
import 'mock_data.dart';

class MockAuthRepository implements AuthRepository {
  @override
  Future<UserModel> login(String emailOrMobile, String password) async {
    await Future.delayed(const Duration(milliseconds: 600));
    return MockData.currentUser;
  }

  @override
  Future<UserModel> signup({
    required String name,
    required String email,
    required String password,
    required String branch,
    required String semester,
  }) async {
    await Future.delayed(const Duration(milliseconds: 700));
    MockData.currentUser = MockData.currentUser.copyWith(
      name: name,
      email: email,
      branch: branch,
      semester: semester,
    );
    return MockData.currentUser;
  }

  @override
  Future<bool> sendOtp(String email) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return true;
  }

  @override
  Future<bool> resendOtp(String email) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return true;
  }

  @override
  Future<bool> verifyOtp(String email, String otp) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return otp.length == 6;
  }

  @override
  Future<bool> sendPasswordReset(String email) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return true;
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return MockData.currentUser;
  }

  @override
  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 300));
  }
}

class MockCompanyRepository implements CompanyRepository {
  @override
  Future<List<CompanyModel>> getCompanies({String? filter}) async {
    await Future.delayed(const Duration(milliseconds: 500));
    if (filter == 'premium') {
      return MockData.companies.where((c) => c.tier == CompanyTier.premium).toList();
    } else if (filter == 'free') {
      return MockData.companies.where((c) => c.tier == CompanyTier.free).toList();
    }
    return MockData.companies;
  }

  @override
  Future<CompanyModel?> getCompanyById(String id) async {
    await Future.delayed(const Duration(milliseconds: 400));
    try {
      return MockData.companies.firstWhere((c) => c.id == id);
    } catch (_) {
      return MockData.companies.first;
    }
  }

  @override
  Future<List<ModuleTestModel>> getCompanyAssessments(String companyId) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return MockData.modules.first.tests;
  }
}

class MockModuleRepository implements ModuleRepository {
  @override
  Future<List<BranchModel>> getBranches() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return MockData.branches;
  }

  @override
  Future<List<SubjectModel>> getSubjectsByBranch(String branchId) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return MockData.subjects;
  }

  @override
  Future<List<ModuleModel>> getModules({String? category, String? subjectId}) async {
    await Future.delayed(const Duration(milliseconds: 500));
    if (category != null && category != 'All') {
      return MockData.modules.where((m) => m.category.toLowerCase() == category.toLowerCase()).toList();
    }
    return MockData.modules;
  }

  @override
  Future<ModuleModel?> getModuleById(String id) async {
    await Future.delayed(const Duration(milliseconds: 400));
    try {
      return MockData.modules.firstWhere((m) => m.id == id);
    } catch (_) {
      return MockData.modules.first;
    }
  }

  @override
  Future<ModuleModel?> getContinueLearningModule() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return MockData.modules.first;
  }
}

class MockExamRepository implements ExamRepository {
  @override
  Future<AttemptModel> startExam(String testId) async {
    await Future.delayed(const Duration(milliseconds: 600));
    return AttemptModel(
      attemptId: 'att_${DateTime.now().millisecondsSinceEpoch}',
      testTitle: 'TCS - Reasoning Test',
      moduleTitle: 'Logical Reasoning',
      totalQuestions: MockData.sampleQuestions.length,
      durationSeconds: 1800, // 30 mins
      questions: MockData.sampleQuestions,
    );
  }

  @override
  Future<bool> syncExam({
    required String attemptId,
    required Map<String, dynamic> answers,
    int? violationCount,
  }) async {
    await Future.delayed(const Duration(milliseconds: 100));
    return true;
  }

  @override
  Future<ExamResultModel> submitExam({
    required String attemptId,
    required Map<String, String?> answers,
    required int timeTakenSeconds,
    int? violationCount,
  }) async {
    await Future.delayed(const Duration(milliseconds: 800));
    int correct = 0;
    int wrong = 0;
    int unattempted = 0;

    for (final q in MockData.sampleQuestions) {
      final ans = answers[q.id];
      if (ans == null) {
        unattempted++;
      } else if (ans == q.correctOptionId) {
        correct++;
      } else {
        wrong++;
      }
    }

    final total = MockData.sampleQuestions.length;
    final score = total > 0 ? (correct / total) * 100 : 0.0;
    final accuracy = (correct + wrong) > 0 ? ((correct / (correct + wrong)) * 100).round() : 0;

    return ExamResultModel(
      attemptId: attemptId,
      testTitle: 'TCS - Reasoning Test',
      scorePercentage: score,
      accuracyPercentage: accuracy,
      correctCount: correct,
      wrongCount: wrong,
      unattemptedCount: unattempted,
      timeTakenSeconds: timeTakenSeconds,
      xpEarned: (correct * 20) + (score >= 60 ? 50 : 0),
      isPassed: score >= 60,
      userAnswers: answers,
      questions: MockData.sampleQuestions,
    );
  }

  @override
  Future<ExamResultModel?> getExamResult(String attemptId) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return ExamResultModel(
      attemptId: attemptId,
      testTitle: 'TCS - Reasoning Test',
      scorePercentage: 85.5,
      accuracyPercentage: 90,
      correctCount: 18,
      wrongCount: 2,
      unattemptedCount: 0,
      timeTakenSeconds: 1350,
      xpEarned: 150,
      isPassed: true,
      userAnswers: {'q1': 'C', 'q2': 'C', 'q3': 'D', 'q4': 'B', 'q5': 'B'},
      questions: MockData.sampleQuestions,
    );
  }
}

class MockMissionRepository implements MissionRepository {
  @override
  Future<MissionModel> getCurrentMission() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return MockData.currentMission;
  }

  @override
  Future<List<LeaderboardEntryModel>> getLeaderboard({String tab = 'weekly'}) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return MockData.leaderboard;
  }
}

class MockPlanRepository implements PlanRepository {
  @override
  Future<List<PlanModel>> getPlans({PlanCategory category = PlanCategory.company}) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return MockData.plans;
  }

  @override
  Future<PaymentRequestModel> submitPaymentProof({
    required String planId,
    required String transactionId,
    required String screenshotPath,
    required String paymentMethod,
  }) async {
    await Future.delayed(const Duration(milliseconds: 800));
    final req = PaymentRequestModel(
      id: 'pay_${DateTime.now().millisecondsSinceEpoch}',
      planTitle: 'Premium Plan (3 Months)',
      amountInr: 1499,
      transactionId: transactionId.isEmpty ? 'UPI_${DateTime.now().millisecondsSinceEpoch}' : transactionId,
      createdAt: DateTime.now(),
      status: PaymentRequestStatus.pending,
    );
    MockData.paymentHistory.insert(0, req);
    return req;
  }

  @override
  Future<List<PaymentRequestModel>> getPaymentHistory() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return MockData.paymentHistory;
  }
}

class MockProfileRepository implements ProfileRepository {
  @override
  Future<UserModel> updateProfile({
    required String name,
    required String branch,
    required String semester,
  }) async {
    await Future.delayed(const Duration(milliseconds: 600));
    MockData.currentUser = MockData.currentUser.copyWith(
      name: name,
      branch: branch,
      semester: semester,
    );
    return MockData.currentUser;
  }

  @override
  Future<List<DeviceModel>> getDevices() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return MockData.devices;
  }

  @override
  Future<bool> requestDeviceApproval(String deviceId) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return true;
  }

  @override
  Future<List<NotificationModel>> getNotifications() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return MockData.notifications;
  }

  @override
  Future<void> markNotificationsAsRead() async {
    await Future.delayed(const Duration(milliseconds: 200));
  }

  @override
  Future<bool> submitFeedback({
    required String category,
    required String message,
    String? screenshotPath,
  }) async {
    await Future.delayed(const Duration(milliseconds: 600));
    return true;
  }
}

class MockStorageRepository implements StorageRepository {
  @override
  Future<String> uploadMedia(String filePath, {String purpose = 'payment-proof'}) async {
    await Future.delayed(const Duration(milliseconds: 600));
    return 'https://hiregridx.storage.local/uploads/$filePath';
  }
}
