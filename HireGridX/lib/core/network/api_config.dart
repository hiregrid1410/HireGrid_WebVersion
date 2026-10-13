class ApiConfig {
  ApiConfig._();

  // Can be overridden at build/runtime via --dart-define=API_BASE_URL=http://.../api
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');

  // Production backend URL (Live Render + Neon PostgreSQL)
  static const String baseUrlProd = 'https://hiregrid-webversion.onrender.com/api';
  static const String baseUrlDev = 'http://10.0.2.2:5000/api';
  static const String baseUrlLocal = 'http://localhost:5000/api';

  static String get baseUrl {
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl.endsWith('/') ? _envBaseUrl.substring(0, _envBaseUrl.length - 1) : _envBaseUrl;
    }
    // Default to Production Live Backend for real database data
    return baseUrlProd;
  }

  static const int connectTimeoutMs = 18000;
  static const int receiveTimeoutMs = 18000;
  static const int sendTimeoutMs = 18000;
}
