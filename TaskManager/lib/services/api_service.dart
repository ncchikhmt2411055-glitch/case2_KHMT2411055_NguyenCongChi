import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}

class ApiService {
  // 10.0.2.2 là địa chỉ máy tính Windows nhìn từ máy ảo Android
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  static const String _tokenKey = 'auth_token';
  static const Duration _timeout = Duration(seconds: 15);

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Map<String, dynamic> _handle(http.Response res) {
    final data = res.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw ApiException(
        data['message']?.toString() ?? 'Có lỗi xảy ra',
        res.statusCode,
      );
    }
    return data;
  }

  static Future<Map<String, dynamic>> _send(
    String method,
    String path, [
    Map<String, dynamic>? body,
  ]) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = await _headers();
    final encoded = body == null ? null : jsonEncode(body);

    late http.Response res;
    switch (method) {
      case 'POST':
        res = await http.post(uri, headers: headers, body: encoded).timeout(_timeout);
        break;
      case 'PUT':
        res = await http.put(uri, headers: headers, body: encoded).timeout(_timeout);
        break;
      case 'PATCH':
        res = await http.patch(uri, headers: headers, body: encoded).timeout(_timeout);
        break;
      case 'DELETE':
        res = await http.delete(uri, headers: headers, body: encoded).timeout(_timeout);
        break;
      default:
        res = await http.get(uri, headers: headers).timeout(_timeout);
    }
    return _handle(res);
  }

  static Future<Map<String, dynamic>> get(String path) => _send('GET', path);

  static Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) =>
      _send('POST', path, body);

  static Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body) =>
      _send('PUT', path, body);

  static Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> body) =>
      _send('PATCH', path, body);

  static Future<Map<String, dynamic>> delete(String path) => _send('DELETE', path);
}