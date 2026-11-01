import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/task_format.dart';
import 'task_detail_screen.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<dynamic>> _load() async {
    final data = await ApiService.get('/notifications');
    return data['notifications'] as List<dynamic>;
  }

  void _reload() {
    setState(() => _future = _load());
  }

  void _snack(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  Future<void> _readAll() async {
    try {
      await ApiService.patch('/notifications/read-all', {});
      _reload();
    } on ApiException catch (e) {
      _snack(e.message);
    }
  }

  Future<void> _open(Map<String, dynamic> n) async {
    try {
      if (n['isRead'] != true) {
        await ApiService.patch('/notifications/${n['id']}/read', {});
      }
    } on ApiException catch (e) {
      _snack(e.message);
    }
    if (!mounted) return;
    if (n['taskId'] != null) {
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => TaskDetailScreen(taskId: n['taskId'].toString())),
      );
    }
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: 'Đánh dấu tất cả đã đọc',
            onPressed: _readAll,
            icon: const Icon(Icons.done_all),
          ),
        ],
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('${snap.error}', textAlign: TextAlign.center));
          }
          final items = snap.data ?? [];
          if (items.isEmpty) {
            return const Center(child: Text('Chưa có thông báo nào'));
          }
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final n = items[i] as Map<String, dynamic>;
                final unread = n['isRead'] != true;
                return ListTile(
                  leading: Icon(
                    unread ? Icons.notifications_active : Icons.notifications_none,
                    color: unread ? Colors.blue : Colors.grey,
                  ),
                  title: Text(
                    (n['title'] ?? '').toString(),
                    style: TextStyle(fontWeight: unread ? FontWeight.bold : FontWeight.normal),
                  ),
                  subtitle: Text(
                    '${(n['message'] ?? '').toString()}\n${formatDate(n['createdAt'])}',
                  ),
                  isThreeLine: true,
                  onTap: () => _open(n),
                );
              },
            ),
          );
        },
      ),
    );
  }
}