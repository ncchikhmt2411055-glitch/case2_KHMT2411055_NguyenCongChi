import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/task_format.dart';
import 'task_form_screen.dart';

class TaskDetailScreen extends StatefulWidget {
  final String taskId;

  const TaskDetailScreen({super.key, required this.taskId});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _changed = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() async {
    final data = await ApiService.get('/tasks/${widget.taskId}');
    return data['task'] as Map<String, dynamic>;
  }

  void _reload() {
    _changed = true;
    setState(() => _future = _load());
  }

  void _snack(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  Future<void> _changeStatus(String status) async {
    try {
      await ApiService.patch('/tasks/${widget.taskId}/status', {'status': status});
      _reload();
    } on ApiException catch (e) {
      _snack(e.message);
    }
  }

  Future<void> _openEdit(Map<String, dynamic> t) async {
    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => TaskFormScreen(task: t)),
    );
    if (saved == true) _reload();
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xóa công việc?'),
        content: const Text('Hành động này không thể hoàn tác.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xóa', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok != true) return;

    try {
      await ApiService.delete('/tasks/${widget.taskId}');
      if (!mounted) return;
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      _snack(e.message);
    }
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
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        final t = snap.data;
        final role = t?['myRole']?.toString();
        final canEdit = ['creator', 'assignee', 'editor'].contains(role);
        final isCreator = role == 'creator';

        return Scaffold(
          appBar: AppBar(
            title: const Text('Chi tiết công việc'),
            centerTitle: true,
            leading: BackButton(
              onPressed: () => Navigator.pop(context, _changed),
            ),
            actions: [
              if (t != null && canEdit)
                IconButton(
                  icon: const Icon(Icons.edit),
                  tooltip: 'Sửa',
                  onPressed: () => _openEdit(t),
                ),
              if (t != null && isCreator)
                IconButton(
                  icon: const Icon(Icons.delete_outline),
                  tooltip: 'Xóa',
                  onPressed: _delete,
                ),
            ],
          ),
          body: _buildBody(snap, canEdit),
        );
      },
    );
  }

  Widget _buildBody(AsyncSnapshot<Map<String, dynamic>> snap, bool canEdit) {
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
    final status = t['status']?.toString() ?? 'todo';

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
        if (canEdit)
          DropdownButtonFormField<String>(
            key: ValueKey(status),
            initialValue: status,
            decoration: const InputDecoration(
              labelText: 'Đổi trạng thái',
              border: OutlineInputBorder(),
            ),
            items: const ['todo', 'in_progress', 'completed']
                .map((s) => DropdownMenuItem(value: s, child: Text(statusLabel(s))))
                .toList(),
            onChanged: (v) {
              if (v != null && v != status) _changeStatus(v);
            },
          )
        else
          _row('Trạng thái', statusLabel(status)),
        const SizedBox(height: 8),
        _row('Ưu tiên', priorityLabel(t['priority'])),
        _row('Ngày bắt đầu', formatDate(t['startDate'])),
        _row('Hạn hoàn thành', formatDate(t['dueDate'])),
        _row('Người tạo', creator?['fullName']?.toString() ?? '—'),
        _row('Người phụ trách', primary?['fullName']?.toString() ?? 'Chưa có'),
        _row('Vai trò của bạn', roleLabel(t['myRole'])),
      ],
    );
  }
}