import 'package:flutter_test/flutter_test.dart';
import 'package:hiregridx/data/models/company_model.dart';
import 'package:hiregridx/data/models/module_model.dart';
import 'package:hiregridx/data/models/user_model.dart';
import 'package:hiregridx/data/models/plan_model.dart';
import 'package:hiregridx/data/models/revision_model.dart';
import 'package:hiregridx/data/models/mission_model.dart';

void main() {
  group('Platform Control Model Tests', () {
    test('CompanyModel defaults to web and parses platform safely without leaking as both', () {
      final defaultCompany = CompanyModel.fromJson({'id': 'c1', 'name': 'Google'});
      expect(defaultCompany.platform, 'web'); // Missing field must NOT accidentally become both

      final nullPlatformCompany = CompanyModel.fromJson({'id': 'c1_null', 'name': 'Null Co', 'platform': null});
      expect(nullPlatformCompany.platform, 'web'); // Null field must NOT accidentally become both

      final appOnlyCompany = CompanyModel.fromJson({'id': 'c2', 'name': 'Meta', 'platform': 'APP'});
      expect(appOnlyCompany.platform, 'app');

      final bothCompany = CompanyModel.fromJson({'id': 'c2_both', 'name': 'Both Co', 'platform': 'Both'});
      expect(bothCompany.platform, 'both');

      final webOnlyCompany = CompanyModel.fromJson({'id': 'c3', 'name': 'Amazon', 'platform': 'web'});
      expect(webOnlyCompany.platform, 'web');

      // Test toJson preserves platform
      expect(appOnlyCompany.toJson()['platform'], 'app');
      expect(bothCompany.toJson()['platform'], 'both');
    });

    test('ModuleModel and ModuleTestModel default to web and parse platform', () {
      final defaultMod = ModuleModel.fromJson({'id': 'm1', 'title': 'DSA'});
      expect(defaultMod.platform, 'web'); // Missing field must NOT accidentally become both

      final appMod = ModuleModel.fromJson({'id': 'm2', 'title': 'Flutter', 'platform': 'app'});
      expect(appMod.platform, 'app');

      final bothMod = ModuleModel.fromJson({'id': 'm3', 'title': 'SQL', 'platform': 'both'});
      expect(bothMod.platform, 'both');

      final testItem = ModuleTestModel.fromJson({'id': 't1', 'title': 'Test 1', 'platform': 'app'});
      expect(testItem.platform, 'app');
      expect(testItem.toJson()['platform'], 'app');
    });

    test('SubjectModel and TopicModel parse platform safely defaulting to web', () {
      final defaultSub = SubjectModel.fromJson({'id': 's0', 'name': 'Physics'});
      expect(defaultSub.platform, 'web');

      final subject = SubjectModel.fromJson({'id': 's1', 'name': 'Maths', 'platform': 'web'});
      expect(subject.platform, 'web');

      final topic = TopicModel.fromJson({'id': 't1', 'name': 'Calculus', 'platform': 'both'});
      expect(topic.platform, 'both');

      final defaultTopic = TopicModel.fromJson({'id': 't0', 'name': 'Algebra'});
      expect(defaultTopic.platform, 'web');
    });

    test('BranchModel defaults to web and parses platform safely', () {
      final branch = BranchModel.fromJson({'id': 'b1', 'name': 'CSE'});
      expect(branch.platform, 'web'); // Missing field must NOT accidentally become both

      final appBranch = BranchModel.fromJson({'id': 'b2', 'name': 'ECE', 'platform': 'app'});
      expect(appBranch.platform, 'app');
      expect(appBranch.toJson()['platform'], 'app');
    });

    test('PlanModel defaults to web and parses platform safely', () {
      final plan = PlanModel.fromJson({'id': 'p1', 'title': 'Pro Plan'});
      expect(plan.platform, 'web'); // Missing field must NOT accidentally become both

      final webPlan = PlanModel.fromJson({'id': 'p2', 'title': 'Web Plan', 'platform': 'web'});
      expect(webPlan.platform, 'web');

      final appPlan = PlanModel.fromJson({'id': 'p3', 'title': 'App Plan', 'platform': 'app'});
      expect(appPlan.platform, 'app');
      expect(appPlan.toJson()['platform'], 'app');
    });

    test('RevisionScheduleItem defaults to web and parses platform', () {
      final rev = RevisionScheduleItem.fromJson({'revisionModuleId': 'r1', 'title': 'Aptitude Rev'});
      expect(rev.platform, 'web'); // Missing field must NOT accidentally become both

      final customRev = RevisionScheduleItem.fromJson({'revisionModuleId': 'r2', 'title': 'Tech Rev', 'platform': 'app'});
      expect(customRev.platform, 'app');
    });

    test('MissionModel and MissionExamModel parse platform', () {
      final exam = MissionExamModel.fromJson({'id': 'e1', 'title': 'TCS Mock', 'platform': 'app'});
      expect(exam.platform, 'app');

      final defaultExam = MissionExamModel.fromJson({'id': 'e0', 'title': 'Web Mock'});
      expect(defaultExam.platform, 'web');

      final mission = MissionModel.fromBackendJson(
        cycleJson: {'id': 'cy1', 'name': 'Cycle 1', 'platform': 'both'},
        missionsList: [
          {'id': 'e1', 'title': 'TCS Mock', 'platform': 'app'}
        ],
      );
      expect(mission.platform, 'both');
    });
  });
}
