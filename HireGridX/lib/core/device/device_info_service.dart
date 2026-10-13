import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import '../storage/token_storage.dart';

class DeviceInfoService {
  final TokenStorage _tokenStorage;
  final DeviceInfoPlugin _deviceInfoPlugin = DeviceInfoPlugin();

  DeviceInfoService(this._tokenStorage);

  Future<String> getOrCreateDeviceId() async {
    final existingId = await _tokenStorage.readDeviceId();
    if (existingId != null && existingId.isNotEmpty) {
      return existingId;
    }

    // Generate a stable UUID / hash based on hardware + timestamp
    String rawSeed = '${DateTime.now().millisecondsSinceEpoch}-${DateTime.now().microsecond}';
    try {
      if (kIsWeb) {
        final webInfo = await _deviceInfoPlugin.webBrowserInfo;
        rawSeed = '${webInfo.userAgent}-${webInfo.vendor}-$rawSeed';
      } else if (Platform.isAndroid) {
        final androidInfo = await _deviceInfoPlugin.androidInfo;
        rawSeed = '${androidInfo.id}-${androidInfo.model}-${androidInfo.fingerprint}-$rawSeed';
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfoPlugin.iosInfo;
        rawSeed = '${iosInfo.identifierForVendor}-$rawSeed';
      } else if (Platform.isLinux) {
        final linuxInfo = await _deviceInfoPlugin.linuxInfo;
        rawSeed = '${linuxInfo.machineId}-$rawSeed';
      }
    } catch (_) {}

    final hash = sha256.convert(utf8.encode(rawSeed)).toString();
    final generatedDeviceId = 'dev_${hash.substring(0, 16)}';
    await _tokenStorage.saveDeviceId(generatedDeviceId);
    return generatedDeviceId;
  }

  Future<String> getDeviceName() async {
    try {
      if (kIsWeb) {
        final webInfo = await _deviceInfoPlugin.webBrowserInfo;
        return '${webInfo.browserName.name} (Web)';
      } else if (Platform.isAndroid) {
        final androidInfo = await _deviceInfoPlugin.androidInfo;
        return '${androidInfo.manufacturer} ${androidInfo.model} (Android ${androidInfo.version.release})';
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfoPlugin.iosInfo;
        return '${iosInfo.utsname.machine} (iOS ${iosInfo.systemVersion})';
      } else if (Platform.isLinux) {
        final linuxInfo = await _deviceInfoPlugin.linuxInfo;
        return '${linuxInfo.prettyName} (Desktop)';
      } else if (Platform.isWindows) {
        return 'Windows App';
      } else if (Platform.isMacOS) {
        return 'macOS App';
      }
    } catch (_) {}
    return 'HireGridX Mobile Client';
  }
}
