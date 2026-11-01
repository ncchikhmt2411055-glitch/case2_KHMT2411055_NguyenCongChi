import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/task_format.dart';
import 'login_screen.dart';
import 'task_detail_screen.dart';
import 'task_form_screen.dart';

class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<List<dynamic>> _fetch() async {
    try {
      final data = await ApiService.get('/tasks');
      return data['tasks'] as List<dynamic>;
    } on ApiException catch (e) {
      if (e.statusCode == 401) {
        await ApiService.clearToken();
      }
      rethrow;
    }
  }

  void _reload() {
    setState(() => _future = _fetch());
  }

  Future<void> _openCreate() async {
    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const TaskFormScreen()),
    );
    if (saved == true) _reload();
  }

  Future<void> _openDetail(String id) async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => TaskDetailScreen(taskId: id)),
    );
    if (changed == true) _reload();
  }

  Future<void> _logout() async {
    await ApiService.clearToken();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Công việc'),
        centerTitle: true,
        actions: [
          IconButton(onPressed: _reload, icon: const Icon(Icons.refresh)),
          IconButton(onPressed: _logout, icon: const Icon(Icons.logout)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openCreate,
        child: const Icon(Icons.add),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('${snap.error}', textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    ElevatedButton(onPressed: _reload, child: const Text('Thử lại')),
                  ],
                ),
              ),
            );
          }

          final tasks = snap.data ?? [];
          if (tasks.isEmpty) {
            return const Center(child: Text('Chưa có công việc nào. Bấm + để thêm.'));
          }

          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.separated(
              itemCount: tasks.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final t = tasks[i] as Map<String, dynamic>;
                return ListTile(
                  title: Text((t['title'] ?? '').toString()),
                  subtitle: Text(
                    '${statusLabel(t['status'])} • Ưu tiên: ${priorityLabel(t['priority'])}',
                  ),
                  trailing: Text(formatDate(t['dueDate'])),
                  onTap: () => _openDetail(t['id'].toString()),
                );
              },
            ),
          );
        },
      ),
    );
  }
}