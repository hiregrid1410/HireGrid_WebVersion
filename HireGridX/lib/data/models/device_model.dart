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
}

class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String timeAgo;
  final bool isRead;
  final String type; // mission, xp, payment, system

  const NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.timeAgo,
    this.isRead = false,
    required this.type,
  });
}
