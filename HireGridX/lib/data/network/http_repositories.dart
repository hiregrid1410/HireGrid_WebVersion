import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/dio_client.dart';
import '../../core/network/api_failure.dart';
import '../../core/device/device_info_service.dart';
import '../../core/storage/token_storage.dart';
import '../models/user_model.dart';
import '../models/company_model.dart';
import '../models/module_model.dart';
import '../models/question_model.dart';
import '../models/mission_model.dart';
import '../models/plan_model.dart';
import '../models/device_model.dart';
import '../repositories/app_repositories.dart';

// =========================================================
// 1. AUTH REPOSITORY (HTTP)
// =========================================================
class HttpAuthRepository implements AuthRepository {
  final DioClient _client;
  final TokenStorage _tokenStorage;
  final DeviceInfoService _deviceService;

  HttpAuthRepository(this._client, this._tokenStorage, this._deviceService);

  @override
  Future<LoginResult> login(String emailOrMobile, String password) async {
    try {
      final deviceId = await _deviceService.getOrCreateDeviceId();
      final deviceName = await _deviceService.getDeviceName();
      final emailClean = emailOrMobile.trim().toLowerCase();

      final res = await _client.dio.post(
        '/auth/login',
        data: {
          'email': emailClean,
          'password': password,
          'isAdminLogin': false,
          'deviceId': deviceId,
          'deviceName': deviceName,
        },
      );

      final data = res.data;

      // Handle 2-Step Login OTP requirement
      if (data['otpRequired'] == true) {
        return LoginOtpRequired(
          email: data['rawEmail']?.toString() ?? emailClean,
          maskedEmail: data['email']?.toString() ?? emailClean,
          expiresInSeconds: data['expiresInSeconds'] is int
              ? data['expiresInSeconds'] as int
              : int.tryParse(data['expiresInSeconds']?.toString() ?? '900') ?? 900,
        );
      }

      final token = data['token']?.toString() ?? '';
      final userMap = data['user'] as Map<String, dynamic>;

      await _tokenStorage.saveToken(token);
      await _tokenStorage.saveCachedUser(userMap);

      return LoginSuccess(UserModel.fromJson(userMap));
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<UserModel> verifyLoginOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final deviceId = await _deviceService.getOrCreateDeviceId();
      final deviceName = await _deviceService.getDeviceName();

      final res = await _client.dio.post(
        '/auth/login/verify-otp',
        data: {
          'email': email.trim().toLowerCase(),
          'otp': otp.trim(),
          'deviceId': deviceId,
          'deviceName': deviceName,
        },
      );

      final data = res.data;
      final token = data['token']?.toString() ?? '';
      final userMap = data['user'] as Map<String, dynamic>;

      await _tokenStorage.saveToken(token);
      await _tokenStorage.saveCachedUser(userMap);

      return UserModel.fromJson(userMap);
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<int> resendLoginOtp(String email) async {
    try {
      final res = await _client.dio.post(
        '/auth/login/resend-otp',
        data: {'email': email.trim().toLowerCase()},
      );
      final data = res.data;
      return data['expiresInSeconds'] is int
          ? data['expiresInSeconds'] as int
          : int.tryParse(data['expiresInSeconds']?.toString() ?? '900') ?? 900;
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<UserModel> signup({
    required String name,
    required String email,
    required String password,
    required String branch,
    required String semester,
  }) async {
    try {
      final res = await _client.dio.post(
        '/auth/signup',
        data: {
          'name': name.trim(),
          'email': email.trim().toLowerCase(),
          'password': password,
          'branch': branch,
          'semester': semester,
          'role': 'student',
        },
      );

      final data = res.data;
      final token = data['token']?.toString() ?? '';
      final userMap = data['user'] as Map<String, dynamic>;

      await _tokenStorage.saveToken(token);
      await _tokenStorage.saveCachedUser(userMap);

      return UserModel.fromJson(userMap);
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<bool> verifyOtp(String email, String otp) async {
    try {
      final res = await _client.dio.post(
        '/auth/verify-otp',
        data: {
          'email': email.trim().toLowerCase(),
          'otp': otp.trim(),
        },
      );
      return res.data['success'] == true;
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<bool> sendOtp(String email) async {
    try {
      final res = await _client.dio.post(
        '/auth/send-otp',
        data: {'email': email.trim().toLowerCase()},
      );
      return res.data['success'] == true;
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<bool> resendOtp(String email) async {
    try {
      final res = await _client.dio.post(
        '/auth/resend-otp',
        data: {'email': email.trim().toLowerCase()},
      );
      return res.data['success'] == true;
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<bool> sendPasswordReset(String email) async {
    try {
      final res = await _client.dio.post(
        '/auth/send-otp',
        data: {
          'email': email.trim().toLowerCase(),
        },
      );
      return res.data['success'] == true;
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    try {
      final cached = await _tokenStorage.readCachedUser();
      final token = await _tokenStorage.readToken();

      if (token == null || token.isEmpty) {
        return null;
      }

      // Background fresh fetch from /api/auth/me
      _fetchMeAndCache();

      if (cached != null) {
        return UserModel.fromJson(cached);
      }

      final res = await _client.dio.get('/auth/me');
      if (res.data['user'] != null) {
        final userMap = res.data['user'] as Map<String, dynamic>;
        await _tokenStorage.saveCachedUser(userMap);
        return UserModel.fromJson(userMap);
      }
      return null;
    } catch (e) {
      final cached = await _tokenStorage.readCachedUser();
      if (cached != null) {
        return UserModel.fromJson(cached);
      }
      return null;
    }
  }

  Future<void> _fetchMeAndCache() async {
    try {
      final res = await _client.dio.get('/auth/me');
      if (res.data['user'] != null) {
        final userMap = res.data['user'] as Map<String, dynamic>;
        await _tokenStorage.saveCachedUser(userMap);
      }
    } catch (_) {}
  }

  @override
  Future<void> logout() async {
    await _tokenStorage.clearSession();
  }
}

// =========================================================
// 2. COMPANY REPOSITORY (HTTP with Cache-First)
// =========================================================
class HttpCompanyRepository implements CompanyRepository {
  final DioClient _client;
  static const String _cacheKey = 'cached_companies_json';

  HttpCompanyRepository(this._client);

  @override
  Future<List<CompanyModel>> getCompanies({String? filter}) async {
    final prefs = await SharedPreferences.getInstance();

    try {
      final res = await _client.dio.get('/companies');
      if (res.data['companies'] is List) {
        final list = res.data['companies'] as List;
        await prefs.setString(_cacheKey, jsonEncode(list));

        var companies = list.map((c) => CompanyModel.fromJson(c as Map<String, dynamic>)).toList();
        if (filter == 'premium') {
          companies = companies.where((c) => c.tier == CompanyTier.premium).toList();
        } else if (filter == 'free') {
          companies = companies.where((c) => c.tier == CompanyTier.free).toList();
        }
        return companies;
      }
    } catch (e) {
      final cachedStr = prefs.getString(_cacheKey);
      if (cachedStr != null) {
        final list = jsonDecode(cachedStr) as List;
        var companies = list.map((c) => CompanyModel.fromJson(c as Map<String, dynamic>)).toList();
        if (filter == 'premium') {
          companies = companies.where((c) => c.tier == CompanyTier.premium).toList();
        } else if (filter == 'free') {
          companies = companies.where((c) => c.tier == CompanyTier.free).toList();
        }
        return companies;
      }
      throw _client.mapDioException(e).message;
    }

    return [];
  }

  @override
  Future<CompanyModel?> getCompanyById(String id) async {
    try {
      final companies = await getCompanies();
      return companies.firstWhere(
        (c) => c.id == id,
        orElse: () => companies.isNotEmpty ? companies.first : CompanyModel.fromJson({'id': id, 'name': 'Company'}),
      );
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<List<ModuleTestModel>> getCompanyAssessments(String companyId) async {
    try {
      final res = await _client.dio.get('/modules', queryParameters: {'where_parentId': '==$companyId'});
      if (res.data['modules'] is List) {
        final list = res.data['modules'] as List;
        return list.map((m) => ModuleTestModel.fromJson(m as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
    return [];
  }
}

// =========================================================
// 3. MODULE REPOSITORY (HTTP with Cache-First)
// =========================================================
class HttpModuleRepository implements ModuleRepository {
  final DioClient _client;
  static const String _branchesCacheKey = 'cached_branches_json';

  HttpModuleRepository(this._client);

  @override
  Future<List<BranchModel>> getBranches() async {
    final prefs = await SharedPreferences.getInstance();

    try {
      final res = await _client.dio.get('/branches/active');
      if (res.data['branches'] is List) {
        final list = res.data['branches'] as List;
        await prefs.setString(_branchesCacheKey, jsonEncode(list));
        return list.map((b) => BranchModel.fromJson(b as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      final cachedStr = prefs.getString(_branchesCacheKey);
      if (cachedStr != null) {
        final list = jsonDecode(cachedStr) as List;
        return list.map((b) => BranchModel.fromJson(b as Map<String, dynamic>)).toList();
      }
      throw _client.mapDioException(e).message;
    }
    return [];
  }

  @override
  Future<List<SubjectModel>> getSubjectsByBranch(String branchId) async {
    try {
      final res = await _client.dio.get('/hierarchy-nodes', queryParameters: {'where_parentId': '==$branchId'});
      if (res.data['nodes'] is List) {
        final list = res.data['nodes'] as List;
        return list.map((s) => SubjectModel.fromJson(s as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
    return [];
  }

  @override
  Future<List<ModuleModel>> getModules({String? category, String? subjectId}) async {
    try {
      final params = <String, dynamic>{};
      if (category != null && category != 'All') {
        params['where_category'] = '==$category';
      }
      if (subjectId != null) {
        params['where_parentId'] = '==$subjectId';
      }

      final res = await _client.dio.get('/modules', queryParameters: params);
      if (res.data['modules'] is List) {
        final list = res.data['modules'] as List;
        return list.map((m) => ModuleModel.fromJson(m as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
    return [];
  }

  @override
  Future<ModuleModel?> getModuleById(String id) async {
    try {
      final res = await _client.dio.get('/modules', queryParameters: {'where_id': '==$id'});
      if (res.data['modules'] is List && (res.data['modules'] as List).isNotEmpty) {
        return ModuleModel.fromJson((res.data['modules'] as List).first as Map<String, dynamic>);
      }
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
    return null;
  }

  @override
  Future<ModuleModel?> getContinueLearningModule() async {
    try {
      final modules = await getModules();
      if (modules.isNotEmpty) return modules.first;
    } catch (_) {}
    return null;
  }
}

// =========================================================
// 4. EXAM REPOSITORY (HTTP with Sync & Anti-Cheat)
// =========================================================
class HttpExamRepository implements ExamRepository {
  final DioClient _client;

  HttpExamRepository(this._client);

  @override
  Future<AttemptModel> startExam(String testId) async {
    try {
      final cleanModuleId = testId.replaceAll('att_', '').replaceAll('_easy', '').replaceAll('_med', '').replaceAll('_hard', '');

      final res = await _client.dio.post(
        '/attempts/start',
        data: {'moduleId': cleanModuleId},
      );

      final data = res.data;
      final attemptId = data['attemptId']?.toString() ?? 'att_${DateTime.now().millisecondsSinceEpoch}';
      final timeLeft = (data['timeLeft'] is num) ? (data['timeLeft'] as num).toInt() : 1800;
      final rawQuestions = data['questions'] as List? ?? [];
      final savedAnswers = data['answers'] as Map<String, dynamic>? ?? {};

      final questions = <QuestionModel>[];
      for (int i = 0; i < rawQuestions.length; i++) {
        questions.add(QuestionModel.fromBackendJson(rawQuestions[i] as Map<String, dynamic>, i + 1));
      }

      return AttemptModel(
        attemptId: attemptId,
        testTitle: 'Assessment Test',
        moduleTitle: 'Placement Preparation',
        totalQuestions: questions.length,
        durationSeconds: timeLeft,
        questions: questions,
        savedAnswers: savedAnswers,
      );
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<bool> syncExam({
    required String attemptId,
    required Map<String, dynamic> answers,
    int? violationCount,
  }) async {
    try {
      final res = await _client.dio.post(
        '/attempts/$attemptId/sync',
        data: {
          'answers': answers,
          if (violationCount != null) 'violationCount': violationCount,
        },
      );
      return res.data['success'] == true;
    } catch (_) {
      return false; // Silent sync failure
    }
  }

  final Map<String, ExamResultModel> _resultsCache = {};

  @override
  Future<ExamResultModel> submitExam({
    required String attemptId,
    required Map<String, String?> answers,
    required int timeTakenSeconds,
    int? violationCount,
  }) async {
    try {
      final res = await _client.dio.post(
        '/attempts/$attemptId/submit',
        data: {
          'answers': answers,
          'timeTaken': timeTakenSeconds,
          if (violationCount != null) 'violationCount': violationCount,
        },
      );

      final data = res.data;
      final score = (data['score'] is num) ? (data['score'] as num).toDouble() : 0.0;
      final correctCount = (data['correctCount'] is num) ? (data['correctCount'] as num).toInt() : 0;
      final totalQuestions = (data['totalQuestions'] is num) ? (data['totalQuestions'] as num).toInt() : answers.length;
      final xp = (data['xpEarned'] is num) ? (data['xpEarned'] as num).toInt() : (correctCount * 10);
      final correctAnswersMap = data['correctAnswers'] as Map<String, dynamic>? ?? {};

      final wrongCount = totalQuestions - correctCount;

      final result = ExamResultModel(
        attemptId: attemptId,
        testTitle: 'Assessment Test',
        scorePercentage: score,
        accuracyPercentage: totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).round() : 0,
        correctCount: correctCount,
        wrongCount: wrongCount >= 0 ? wrongCount : 0,
        unattemptedCount: 0,
        timeTakenSeconds: timeTakenSeconds,
        xpEarned: xp,
        isPassed: score >= 60,
        userAnswers: answers,
        questions: [],
      );

      _resultsCache[attemptId] = result;
      return result;
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<ExamResultModel?> getExamResult(String attemptId) async {
    return _resultsCache[attemptId];
  }
}

// =========================================================
// 5. MISSION REPOSITORY (HTTP)
// =========================================================
class HttpMissionRepository implements MissionRepository {
  final DioClient _client;

  HttpMissionRepository(this._client);

  @override
  Future<MissionModel> getCurrentMission() async {
    try {
      final res = await _client.dio.get('/placement-mission/missions');
      final data = res.data;
      final cycle = data['cycle'] as Map<String, dynamic>? ?? {'id': 'cycle_1', 'name': 'Weekly Challenge'};
      final missions = data['missions'] as List? ?? [];

      return MissionModel.fromBackendJson(cycleJson: cycle, missionsList: missions);
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<List<LeaderboardEntryModel>> getLeaderboard({String tab = 'weekly'}) async {
    try {
      final res = await _client.dio.get('/placement-mission/leaderboard');
      if (res.data['leaderboard'] is List) {
        final list = res.data['leaderboard'] as List;
        return list.map((l) => LeaderboardEntryModel.fromJson(l as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
    return [];
  }
}

// =========================================================
// 6. PLAN REPOSITORY (HTTP with Cache-First)
// =========================================================
class HttpPlanRepository implements PlanRepository {
  final DioClient _client;
  static const String _plansCacheKey = 'cached_plans_json';

  HttpPlanRepository(this._client);

  @override
  Future<List<PlanModel>> getPlans({PlanCategory category = PlanCategory.company}) async {
    final prefs = await SharedPreferences.getInstance();

    try {
      final res = await _client.dio.get('/plans');
      if (res.data['plans'] is List) {
        final list = res.data['plans'] as List;
        await prefs.setString(_plansCacheKey, jsonEncode(list));
        return list.map((p) => PlanModel.fromJson(p as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      final cachedStr = prefs.getString(_plansCacheKey);
      if (cachedStr != null) {
        final list = jsonDecode(cachedStr) as List;
        return list.map((p) => PlanModel.fromJson(p as Map<String, dynamic>)).toList();
      }
      throw _client.mapDioException(e).message;
    }
    return [];
  }

  @override
  Future<PaymentRequestModel> submitPaymentProof({
    required String planId,
    required String transactionId,
    required String screenshotPath,
    required String paymentMethod,
  }) async {
    try {
      final res = await _client.dio.post(
        '/payment-requests',
        data: {
          'itemId': planId,
          'itemType': 'full_premium',
          'itemName': 'Premium Plan Access',
          'transactionId': transactionId,
          'amount': 1499,
          'duration': '3 months',
        },
      );

      return PaymentRequestModel(
        id: 'pay_${DateTime.now().millisecondsSinceEpoch}',
        planTitle: 'Premium Plan Access',
        amountInr: 1499,
        transactionId: transactionId,
        createdAt: DateTime.now(),
        status: PaymentRequestStatus.pending,
      );
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<List<PaymentRequestModel>> getPaymentHistory() async {
    try {
      final res = await _client.dio.get('/payment-requests');
      if (res.data['requests'] is List) {
        final list = res.data['requests'] as List;
        return list.map((r) => PaymentRequestModel.fromJson(r as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
    return [];
  }
}

// =========================================================
// 7. PROFILE REPOSITORY (HTTP)
// =========================================================
class HttpProfileRepository implements ProfileRepository {
  final DioClient _client;
  final DeviceInfoService _deviceService;
  final TokenStorage _tokenStorage;

  HttpProfileRepository(this._client, this._deviceService, this._tokenStorage);

  @override
  Future<UserModel> updateProfile({
    required String name,
    required String branch,
    required String semester,
  }) async {
    try {
      final cached = await _tokenStorage.readCachedUser();
      final userId = cached?['id'] ?? '';

      await _client.dio.post(
        '/users',
        data: {
          'id': userId,
          'name': name,
          'branch': branch,
          'semester': semester,
        },
      );

      final meRes = await _client.dio.get('/auth/me');
      final userMap = meRes.data['user'] as Map<String, dynamic>;
      await _tokenStorage.saveCachedUser(userMap);
      return UserModel.fromJson(userMap);
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<List<DeviceModel>> getDevices() async {
    try {
      final meRes = await _client.dio.get('/auth/me');
      final user = meRes.data['user'] as Map<String, dynamic>?;
      final curDeviceId = await _deviceService.getOrCreateDeviceId();

      if (user != null && user['allowedDevices'] is List) {
        final list = user['allowedDevices'] as List;
        return list.map((d) => DeviceModel.fromJson(d as Map<String, dynamic>, currentDeviceId: curDeviceId)).toList();
      }

      final curDeviceName = await _deviceService.getDeviceName();
      return [
        DeviceModel(
          id: curDeviceId,
          deviceName: curDeviceName,
          osVersion: 'Verified Hardware',
          location: 'Current Session',
          lastActiveTime: 'Active Now',
          status: DeviceStatus.active,
          isCurrentDevice: true,
        ),
      ];
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<bool> requestDeviceApproval(String deviceId) async {
    try {
      final devName = await _deviceService.getDeviceName();
      final res = await _client.dio.post(
        '/device-requests',
        data: {
          'deviceId': deviceId,
          'deviceName': devName,
        },
      );
      return res.data['success'] == true;
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }

  @override
  Future<List<NotificationModel>> getNotifications() async {
    try {
      final res = await _client.dio.get('/notifications');
      if (res.data['notifications'] is List) {
        final list = res.data['notifications'] as List;
        return list.map((n) => NotificationModel.fromJson(n as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }

  @override
  Future<void> markNotificationsAsRead() async {}

  @override
  Future<bool> submitFeedback({
    required String category,
    required String message,
    String? screenshotPath,
  }) async {
    try {
      final res = await _client.dio.post(
        '/feedbacks',
        data: {
          'category': category,
          'message': message,
          if (screenshotPath != null) 'screenshotUrl': screenshotPath,
        },
      );
      return res.data['success'] == true;
    } catch (e) {
      throw _client.mapDioException(e).message;
    }
  }
}
