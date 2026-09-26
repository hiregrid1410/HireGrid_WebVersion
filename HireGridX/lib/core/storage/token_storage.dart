import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../data/models/user_model.dart';

class TokenStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const String _tokenKey = 'hgx_auth_token';
  static const String _userKey = 'hgx_cached_user';
  static const String _deviceIdKey = 'hgx_device_id';

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> readToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<void> saveCachedUser(Map<String, dynamic> userMap) async {
    await _storage.write(key: _userKey, value: jsonEncode(userMap));
  }

  Future<Map<String, dynamic>?> readCachedUser() async {
    final str = await _storage.read(key: _userKey);
    if (str == null) return null;
    try {
      return jsonDecode(str) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> clearCachedUser() async {
    await _storage.delete(key: _userKey);
  }

  Future<void> saveDeviceId(String deviceId) async {
    await _storage.write(key: _deviceIdKey, value: deviceId);
  }

  Future<String?> readDeviceId() async {
    return await _storage.read(key: _deviceIdKey);
  }

  // Clear session on logout (preserves stable device ID per spec)
  Future<void> clearSession() async {
    await clearToken();
    await clearCachedUser();
  }
}
