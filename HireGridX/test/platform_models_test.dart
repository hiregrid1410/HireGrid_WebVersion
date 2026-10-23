import 'package:flutter_test/flutter_test.dart';
import 'package:hiregridx/data/models/company_model.dart';
import 'package:hiregridx/data/models/module_model.dart';
import 'package:hiregridx/data/models/user_model.dart';
import 'package:hiregridx/data/models/plan_model.dart';
import 'package:hiregridx/data/models/revision_model.dart';
import 'package:hiregridx/data/models/mission_model.dart';

void main() {
  group('Platform Control Model Tests', () {
    test('CompanyModel defaults to both and parses platform', () {
      final defaultCompany = CompanyModel.fromJson({'id': 'c1', 'name': 'Google'});
      expect(defaultCompany.platform, 'both');

      final appOnlyCompany = CompanyModel.fromJson({'id': 'c2', 'name': 'Meta', 'platform': 'app'});
      expect(appOnlyCompany.platform, 'app');

      final webOnlyCompany = CompanyModel.fromJson({'id': 'c3', 'name': 'Amazon', 'platform': 'web'});
      expect(webOnlyCompany.platform, 'web');
    });

    test('ModuleModel defaults to both and parses platform', () {
      final defaultMod = ModuleModel.fromJson({'id': 'm1', 'title': 'DSA'});
      expect(defaultMod.platform, 'both');

      final appMod = ModuleModel.fromJson({'id': 'm2', 'title': 'Flutter', 'platform': 'app'});
      expect(appMod.platform, 'app');
    });

    test('SubjectModel and TopicModel parse platform', () {
      final subject = SubjectModel.fromJson({'id': 's1', 'name': 'Maths', 'platform': 'web'});
      expect(subject.platform, 'web');

      final topic = TopicModel.fromJson({'id': 't1', 'name': 'Calculus', 'platform': 'both'});
      expect(topic.platform, 'both');
    });

    test('BranchModel defaults to both and parses platform', () {
      final branch = BranchModel.fromJson({'id': 'b1', 'name': 'CSE'});
      expect(branch.platform, 'both');

      final appBranch = BranchModel.fromJson({'id': 'b2', 'name': 'ECE', 'platform': 'app'});
      expect(appBranch.platform, 'app');
    });

    test('PlanModel defaults to both and parses platform', () {
      final plan = PlanModel.fromJson({'id': 'p1', 'title': 'Pro Plan'});
      expect(plan.platform, 'both');

      final webPlan = PlanModel.fromJson({'id': 'p2', 'title': 'Web Plan', 'platform': 'web'});
      expect(webPlan.platform, 'web');
    });

    test('RevisionScheduleItem defaults to both and parses platform', () {
      final rev = RevisionScheduleItem.fromJson({'revisionModuleId': 'r1', 'title': 'Aptitude Rev'});
      expect(rev.platform, 'both');

      final customRev = RevisionScheduleItem.fromJson({'revisionModuleId': 'r2', 'title': 'Tech Rev', 'platform': 'app'});
      expect(customRev.platform, 'app');
    });

    test('MissionModel and MissionExamModel parse platform', () {
      final exam = MissionExamModel.fromJson({'id': 'e1', 'title': 'TCS Mock', 'platform': 'app'});
      expect(exam.platform, 'app');

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
