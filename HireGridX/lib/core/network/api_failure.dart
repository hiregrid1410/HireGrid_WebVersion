sealed class ApiFailure {
  final String message;
  const ApiFailure(this.message);
}

class NetworkFailure extends ApiFailure {
  const NetworkFailure([super.message = 'No internet connection. Please check your network.']);
}

class TimeoutFailure extends ApiFailure {
  const TimeoutFailure([super.message = 'Request timed out. Server might be waking up, please retry.']);
}

class ServerFailure extends ApiFailure {
  final int? statusCode;
  const ServerFailure(super.message, {this.statusCode});
}

class UnauthorizedFailure extends ApiFailure {
  const UnauthorizedFailure([super.message = 'Session expired. Please log in again.']);
}

class DeviceLimitFailure extends ApiFailure {
  final int maxDevices;
  const DeviceLimitFailure(super.message, {this.maxDevices = 1});
}

class ValidationFailure extends ApiFailure {
  final Map<String, dynamic>? errors;
  const ValidationFailure(super.message, {this.errors});
}

// Simple Either / Result container
class Result<T> {
  final T? data;
  final ApiFailure? failure;

  const Result.success(this.data) : failure = null;
  const Result.failure(this.failure) : data = null;

  bool get isSuccess => failure == null;
  bool get isFailure => failure != null;

  R fold<R>(R Function(ApiFailure failure) onFailure, R Function(T data) onSuccess) {
    if (failure != null) {
      return onFailure(failure!);
    }
    return onSuccess(data as T);
  }
}
