import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/task_format.dart';

class TaskDetailScreen extends StatefulWidget {
  final String taskId;

  const TaskDetailScreen({super.key, required this.taskId});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() async {
    final data = await ApiService.get('/tasks/${widget.taskId}');
    return data['task'] as Map<String, dynamic>;
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 150,
            child: Text(label, style: const TextStyle(color: Colors.grey)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết công việc'), centerTitle: true),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text('${snap.error}', textAlign: TextAlign.center),
              ),
            );
          }

          final t = snap.data!;
          final desc = (t['description'] ?? '').toString();
          final creator = t['createdBy'] as Map<String, dynamic>?;
          final primary = t['primaryAssignee'] as Map<String, dynamic>?;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                (t['title'] ?? '').toString(),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(desc.isEmpty ? 'Không có mô tả' : desc),
              const Divider(height: 32),
              _row('Trạng thái', statusLabel(t['status'])),
              _row('Ưu tiên', priorityLabel(t['priority'])),
              _row('Ngày bắt đầu', formatDate(t['startDate'])),
              _row('Hạn hoàn thành', formatDate(t['dueDate'])),
              _row('Người tạo', creator?['fullName']?.toString() ?? '—'),
              _row('Người phụ trách', primary?['fullName']?.toString() ?? 'Chưa có'),
              _row('Vai trò của bạn', roleLabel(t['myRole'])),
            ],
          );
        },
      ),
    );
  }
}