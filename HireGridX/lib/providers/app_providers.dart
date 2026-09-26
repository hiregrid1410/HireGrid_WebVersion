import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/token_storage.dart';
import '../core/device/device_info_service.dart';
import '../core/network/dio_client.dart';
import '../data/repositories/app_repositories.dart';
import '../data/network/http_repositories.dart';
import '../data/mock/mock_repositories.dart';
import '../data/models/user_model.dart';
import '../data/models/company_model.dart';
import '../data/models/module_model.dart';
import '../data/models/mission_model.dart';
import '../data/models/plan_model.dart';
import '../data/models/device_model.dart';

// ==========================================
// CORE INFRASTRUCTURE PROVIDERS
// ==========================================

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return TokenStorage();
});

final deviceInfoServiceProvider = Provider<DeviceInfoService>((ref) {
  final tokenStorage = ref.watch(tokenStorageProvider);
  return DeviceInfoService(tokenStorage);
});

final dioClientProvider = Provider<DioClient>((ref) {
  final tokenStorage = ref.watch(tokenStorageProvider);
  return DioClient(
    tokenStorage,
    onUnauthorized: () {
      // Clear token and session
      tokenStorage.clearSession();
    },
  );
});

// Toggle between Real HTTP and Mock Repositories (Defaults to Real HTTP)
final useMockRepositoriesProvider = StateProvider<bool>((ref) => false);

// ==========================================
// REPOSITORY PROVIDERS (WIRED TO REAL BACKEND)
// ==========================================

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final useMock = ref.watch(useMockRepositoriesProvider);
  if (useMock) return MockAuthRepository();

  final client = ref.watch(dioClientProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  final deviceService = ref.watch(deviceInfoServiceProvider);
  return HttpAuthRepository(client, tokenStorage, deviceService);
});

final companyRepositoryProvider = Provider<CompanyRepository>((ref) {
  final useMock = ref.watch(useMockRepositoriesProvider);
  if (useMock) return MockCompanyRepository();

  final client = ref.watch(dioClientProvider);
  return HttpCompanyRepository(client);
});

final moduleRepositoryProvider = Provider<ModuleRepository>((ref) {
  final useMock = ref.watch(useMockRepositoriesProvider);
  if (useMock) return MockModuleRepository();

  final client = ref.watch(dioClientProvider);
  return HttpModuleRepository(client);
});

final examRepositoryProvider = Provider<ExamRepository>((ref) {
  final useMock = ref.watch(useMockRepositoriesProvider);
  if (useMock) return MockExamRepository();

  final client = ref.watch(dioClientProvider);
  return HttpExamRepository(client);
});

final missionRepositoryProvider = Provider<MissionRepository>((ref) {
  final useMock = ref.watch(useMockRepositoriesProvider);
  if (useMock) return MockMissionRepository();

  final client = ref.watch(dioClientProvider);
  return HttpMissionRepository(client);
});

final planRepositoryProvider = Provider<PlanRepository>((ref) {
  final useMock = ref.watch(useMockRepositoriesProvider);
  if (useMock) return MockPlanRepository();

  final client = ref.watch(dioClientProvider);
  return HttpPlanRepository(client);
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final useMock = ref.watch(useMockRepositoriesProvider);
  if (useMock) return MockProfileRepository();

  final client = ref.watch(dioClientProvider);
  final deviceService = ref.watch(deviceInfoServiceProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  return HttpProfileRepository(client, deviceService, tokenStorage);
});

// ==========================================
// STATE & FUTURE PROVIDERS
// ==========================================

// Current User state provider
final currentUserProvider = StateNotifierProvider<CurrentUserNotifier, AsyncValue<UserModel?>>((ref) {
  return CurrentUserNotifier(ref.watch(authRepositoryProvider), ref.watch(profileRepositoryProvider));
});

class CurrentUserNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _authRepo;
  final ProfileRepository _profileRepo;

  CurrentUserNotifier(this._authRepo, this._profileRepo) : super(const AsyncValue.loading()) {
    loadUser();
  }

  Future<void> loadUser() async {
    try {
      final user = await _authRepo.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateProfile({required String name, required String branch, required String semester}) async {
    state = const AsyncValue.loading();
    try {
      final updated = await _profileRepo.updateProfile(name: name, branch: branch, semester: semester);
      state = AsyncValue.data(updated);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void setUser(UserModel user) {
    state = AsyncValue.data(user);
  }

  void clearUser() {
    state = const AsyncValue.data(null);
  }
}

// Companies List provider
final companiesFilterProvider = StateProvider<String>((ref) => 'All');

final companiesListProvider = FutureProvider<List<CompanyModel>>((ref) async {
  final repo = ref.watch(companyRepositoryProvider);
  final filter = ref.watch(companiesFilterProvider);
  return repo.getCompanies(filter: filter.toLowerCase());
});

final companyDetailProvider = FutureProvider.family<CompanyModel?, String>((ref, id) async {
  final repo = ref.watch(companyRepositoryProvider);
  return repo.getCompanyById(id);
});

// Learning & Modules provider
final branchesProvider = FutureProvider<List<BranchModel>>((ref) async {
  return ref.watch(moduleRepositoryProvider).getBranches();
});

final selectedBranchIdProvider = StateProvider<String>((ref) => 'ce');

final subjectsProvider = FutureProvider<List<SubjectModel>>((ref) async {
  final branchId = ref.watch(selectedBranchIdProvider);
  return ref.watch(moduleRepositoryProvider).getSubjectsByBranch(branchId);
});

final modulesListProvider = FutureProvider.family<List<ModuleModel>, String?>((ref, category) async {
  return ref.watch(moduleRepositoryProvider).getModules(category: category);
});

final moduleDetailProvider = FutureProvider.family<ModuleModel?, String>((ref, id) async {
  return ref.watch(moduleRepositoryProvider).getModuleById(id);
});

final continueLearningProvider = FutureProvider<ModuleModel?>((ref) async {
  return ref.watch(moduleRepositoryProvider).getContinueLearningModule();
});

// Missions & Leaderboard
final currentMissionProvider = FutureProvider<MissionModel>((ref) async {
  return ref.watch(missionRepositoryProvider).getCurrentMission();
});

final leaderboardTabProvider = StateProvider<String>((ref) => 'weekly');

final leaderboardProvider = FutureProvider<List<LeaderboardEntryModel>>((ref) async {
  final tab = ref.watch(leaderboardTabProvider);
  return ref.watch(missionRepositoryProvider).getLeaderboard(tab: tab);
});

// Plans & Pricing
final selectedPlanCategoryProvider = StateProvider<PlanCategory>((ref) => PlanCategory.company);

final plansListProvider = FutureProvider<List<PlanModel>>((ref) async {
  final category = ref.watch(selectedPlanCategoryProvider);
  return ref.watch(planRepositoryProvider).getPlans(category: category);
});

final paymentHistoryProvider = FutureProvider<List<PaymentRequestModel>>((ref) async {
  return ref.watch(planRepositoryProvider).getPaymentHistory();
});

// Profile, Devices, Notifications
final devicesListProvider = FutureProvider<List<DeviceModel>>((ref) async {
  return ref.watch(profileRepositoryProvider).getDevices();
});

final notificationsListProvider = FutureProvider<List<NotificationModel>>((ref) async {
  return ref.watch(profileRepositoryProvider).getNotifications();
});
