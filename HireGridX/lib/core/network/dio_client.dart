import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'api_config.dart';
import 'api_failure.dart';
import '../storage/token_storage.dart';

typedef OnUnauthorizedCallback = void Function();

class DioClient {
  late final Dio dio;
  final TokenStorage _tokenStorage;
  OnUnauthorizedCallback? onUnauthorized;

  DioClient(this._tokenStorage, {this.onUnauthorized}) {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: const Duration(milliseconds: ApiConfig.connectTimeoutMs),
        receiveTimeout: const Duration(milliseconds: ApiConfig.receiveTimeoutMs),
        sendTimeout: const Duration(milliseconds: ApiConfig.sendTimeoutMs),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Public routes that don't need token
          final publicPaths = [
            '/auth/signup',
            '/auth/login',
            '/auth/google',
            '/auth/send-otp',
            '/auth/verify-otp',
            '/auth/resend-otp',
          ];

          final isPublic = publicPaths.any((p) => options.path.contains(p));
          if (!isPublic) {
            final token = await _tokenStorage.readToken();
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // Check for 401 Unauthorized
          if (error.response?.statusCode == 401) {
            await _tokenStorage.clearSession();
            onUnauthorized?.call();
            return handler.next(error);
          }

          // Retry logic for network / serverless cold starts (300ms -> 700ms -> 1500ms)
          final requestOptions = error.requestOptions;
          final retryCount = requestOptions.extra['retryCount'] ?? 0;

          final isRetryable = error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout ||
              error.type == DioExceptionType.connectionError ||
              (error.response != null && error.response!.statusCode! >= 500);

          if (isRetryable && retryCount < 3) {
            final backoffs = [300, 700, 1500];
            final delayMs = backoffs[retryCount];
            if (kDebugMode) {
              print('[DioClient] Retrying ${requestOptions.path} (attempt ${retryCount + 1}/3) after ${delayMs}ms');
            }

            await Future.delayed(Duration(milliseconds: delayMs));
            requestOptions.extra['retryCount'] = retryCount + 1;

            try {
              final response = await dio.fetch(requestOptions);
              return handler.resolve(response);
            } catch (e) {
              if (e is DioException) {
                return handler.next(e);
              }
            }
          }

          return handler.next(error);
        },
      ),
    );
  }

  // Centralized Error Mapper
  ApiFailure mapDioException(dynamic error) {
    if (error is DioException) {
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout) {
        return const TimeoutFailure('Request timed out. Server might be waking up, please retry.');
      }
      if (error.type == DioExceptionType.connectionError) {
        return const NetworkFailure('Unable to connect to server. Check your internet connection.');
      }

      final res = error.response;
      if (res != null) {
        final statusCode = res.statusCode;
        final data = res.data;
        String errorMessage = 'Something went wrong. Please try again.';

        if (data is Map<String, dynamic>) {
          if (data['error'] != null) {
            errorMessage = data['error'].toString();
          } else if (data['message'] != null) {
            errorMessage = data['message'].toString();
          }

          if (data['deviceLimitReached'] == true) {
            return DeviceLimitFailure(
              errorMessage,
              maxDevices: (data['maxDevices'] is int) ? data['maxDevices'] : 1,
            );
          }
        }

        if (statusCode == 401) {
          return UnauthorizedFailure(errorMessage);
        }
        if (statusCode == 403) {
          return ServerFailure(errorMessage, statusCode: 403);
        }
        if (statusCode == 400 || statusCode == 422) {
          return ValidationFailure(errorMessage, errors: data is Map<String, dynamic> ? data : null);
        }
        return ServerFailure(errorMessage, statusCode: statusCode);
      }
    }

    return ServerFailure(error.toString());
  }
}
