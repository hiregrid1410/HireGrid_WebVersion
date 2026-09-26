class ApiConfig {
  ApiConfig._();

  // Can be overridden at build/runtime via --dart-define=API_BASE_URL=http://.../api
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');

  // Default dev / local server URL (Port 5000)
  static const String baseUrlDev = 'http://10.0.2.2:5000/api'; // 10.0.2.2 for Android Emulator, localhost for Web/Desktop
  static const String baseUrlLocal = 'http://localhost:5000/api';
  static const String baseUrlProd = 'https://hiregrid-backend.onrender.com/api'; // Set via --dart-define=API_BASE_URL=... in prod

  static String get baseUrl {
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl.endsWith('/') ? _envBaseUrl.substring(0, _envBaseUrl.length - 1) : _envBaseUrl;
    }
    return baseUrlLocal;
  }

  static const int connectTimeoutMs = 18000;
  static const int receiveTimeoutMs = 18000;
  static const int sendTimeoutMs = 18000;
}
