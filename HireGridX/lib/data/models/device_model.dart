enum DeviceStatus { active, approved, pending }

class DeviceModel {
  final String id;
  final String deviceName;
  final String osVersion;
  final String location;
  final String lastActiveTime;
  final DeviceStatus status;
  final bool isCurrentDevice;

  const DeviceModel({
    required this.id,
    required this.deviceName,
    required this.osVersion,
    required this.location,
    required this.lastActiveTime,
    required this.status,
    this.isCurrentDevice = false,
  });

  factory DeviceModel.fromJson(Map<String, dynamic> json, {String? currentDeviceId}) {
    final devId = json['id']?.toString() ?? json['deviceId']?.toString() ?? '';
    final isCur = currentDeviceId != null && currentDeviceId == devId;

    return DeviceModel(
      id: devId,
      deviceName: json['name']?.toString() ?? json['deviceName']?.toString() ?? 'Mobile Device',
      osVersion: 'Verified Hardware',
      location: 'Gujarat, India',
      lastActiveTime: isCur ? 'Active Now' : 'Recent Session',
      status: isCur ? DeviceStatus.active : DeviceStatus.approved,
      isCurrentDevice: isCur,
    );
  }
}

class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String timeAgo;
  final bool isRead;
  final String type; // revision_day1, revision_day3, revision_day7, revision_monthend, mission, xp, payment, system
  final String? topicId;
  final String? moduleId;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.timeAgo,
    this.isRead = false,
    required this.type,
    this.topicId,
    this.moduleId,
  });

  bool get isRevision => type.startsWith('revision');

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Notification',
      message: json['message']?.toString() ?? '',
      timeAgo: 'Recently',
      isRead: json['isRead'] == true || json['is_read'] == true,
      type: json['type']?.toString() ?? 'system',
      topicId: json['topicId']?.toString() ?? json['topic_id']?.toString(),
      moduleId: json['moduleId']?.toString() ?? json['module_id']?.toString(),
    );
  }
}
