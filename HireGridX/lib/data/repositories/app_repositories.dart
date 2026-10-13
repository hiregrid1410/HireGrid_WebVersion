import '../models/user_model.dart';
import '../models/company_model.dart';
import '../models/module_model.dart';
import '../models/question_model.dart';
import '../models/mission_model.dart';
import '../models/plan_model.dart';
import '../models/device_model.dart';
import '../models/revision_model.dart';

abstract class AuthRepository {
  Future<UserModel> login(String emailOrMobile, String password);
  Future<UserModel> signup({
    required String name,
    required String email,
    required String password,
    required String branch,
    required String semester,
  });
  Future<bool> sendOtp(String email);
  Future<bool> resendOtp(String email);
  Future<bool> verifyOtp(String email, String otp);
  Future<bool> sendPasswordReset(String email);
  Future<UserModel?> getCurrentUser();
  Future<void> logout();
}

abstract class CompanyRepository {
  Future<List<CompanyModel>> getCompanies({String? filter});
  Future<CompanyModel?> getCompanyById(String id);
  Future<List<ModuleTestModel>> getCompanyAssessments(String companyId);
}

abstract class ModuleRepository {
  Future<List<BranchModel>> getBranches();
  Future<List<SubjectModel>> getSubjectsByBranch(String branchId);
  Future<List<TopicModel>> getTopicsBySubject(String subjectId);
  Future<List<ModuleModel>> getModules({String? category, String? subjectId, String? topicId});
  Future<ModuleModel?> getModuleById(String id);
  Future<ModuleModel?> getContinueLearningModule();
}

abstract class ExamRepository {
  Future<AttemptModel> startExam(String testId);
  Future<bool> syncExam({
    required String attemptId,
    required Map<String, dynamic> answers,
    int? violationCount,
  });
  Future<ExamResultModel> submitExam({
    required String attemptId,
    required Map<String, String?> answers,
    required int timeTakenSeconds,
    int? violationCount,
    List<QuestionModel>? questions,
    String? testTitle,
  });
  Future<ExamResultModel?> getExamResult(String attemptId);
}

abstract class RevisionRepository {
  Future<RevisionSchedulesResponse> getRevisionSchedules();
  Future<AttemptModel> startRevisionExam(String topicId, {String stage = 'day1'});
  Future<ExamResultModel> submitRevisionExam({
    required String attemptId,
    required Map<String, String?> answers,
    required int timeTakenSeconds,
    List<QuestionModel>? questions,
    String? testTitle,
  });
  Future<bool> completeTopicRevision({
    required String topicId,
    String? topicName,
    String? subjectId,
    String? moduleId,
    int? score,
  });
}

abstract class MissionRepository {
  Future<MissionModel> getCurrentMission();
  Future<List<LeaderboardEntryModel>> getLeaderboard({String tab = 'weekly'});
}

abstract class PlanRepository {
  Future<List<PlanModel>> getPlans({PlanCategory category = PlanCategory.company});
  Future<PaymentRequestModel> submitPaymentProof({
    required String planId,
    required String transactionId,
    required String screenshotPath,
    required String paymentMethod,
  });
  Future<List<PaymentRequestModel>> getPaymentHistory();
}

abstract class ProfileRepository {
  Future<UserModel> updateProfile({
    required String name,
    required String branch,
    required String semester,
  });
  Future<List<DeviceModel>> getDevices();
  Future<bool> requestDeviceApproval(String deviceId);
  Future<List<NotificationModel>> getNotifications();
  Future<void> markNotificationsAsRead();
  Future<bool> submitFeedback({
    required String category,
    required String message,
    String? screenshotPath,
  });
}

abstract class StorageRepository {
  Future<String> uploadMedia(String filePath, {String purpose = 'payment-proof'});
}

