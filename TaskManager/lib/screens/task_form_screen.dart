import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/task_format.dart';

class TaskFormScreen extends StatefulWidget {
  // null: thêm mới. Có dữ liệu: sửa công việc
  final Map<String, dynamic>? task;

  const TaskFormScreen({super.key, this.task});

  @override
  State<TaskFormScreen> createState() => _TaskFormScreenState();
}

class _TaskFormScreenState extends State<TaskFormScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  String _priority = 'medium';
  String _status = 'todo';
  DateTime? _startDate;
  DateTime? _dueDate;
  bool _saving = false;

  bool get _isEdit => widget.task != null;

  @override
  void initState() {
    super.initState();
    final t = widget.task;
    if (t != null) {
      _title.text = (t['title'] ?? '').toString();
      _description.text = (t['description'] ?? '').toString();
      _priority = (t['priority'] ?? 'medium').toString();
      _status = (t['status'] ?? 'todo').toString();
      _startDate = _parse(t['startDate']);
      _dueDate = _parse(t['dueDate']);
    }
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  DateTime? _parse(dynamic v) {
    if (v == null) return null;
    return DateTime.tryParse(v.toString())?.toLocal();
  }

  void _snack(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  Future<void> _pickDate(bool isStart) async {
    final current = isStart ? _startDate : _dueDate;
    final picked = await showDatePicker(
      context: context,
      initialDate: current ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
      } else {
        _dueDate = picked;
      }
    });
  }

  Future<void> _save() async {
    if (_title.text.trim().length < 2) {
      _snack('Tên công việc phải có ít nhất 2 ký tự');
      return;
    }
    if (_startDate != null && _dueDate != null && _dueDate!.isBefore(_startDate!)) {
      _snack('Hạn hoàn thành phải sau ngày bắt đầu');
      return;
    }

    setState(() => _saving = true);
    final body = {
      'title': _title.text.trim(),
      'description': _description.text.trim(),
      'priority': _priority,
      'status': _status,
      'startDate': _startDate?.toIso8601String(),
      'dueDate': _dueDate?.toIso8601String(),
    };

    try {
      if (_isEdit) {
        await ApiService.put('/tasks/${widget.task!['id']}', body);
      } else {
        await ApiService.post('/tasks', body);
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      if (mounted) _snack(e.message);
    } catch (_) {
      if (mounted) _snack('Không kết nối được máy chủ');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _dateTile(String label, DateTime? value, VoidCallback onTap) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      subtitle: Text(value == null ? 'Chưa chọn' : formatDate(value.toIso8601String())),
      trailing: const Icon(Icons.calendar_today),
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Sửa công việc' : 'Thêm công việc'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _title,
            decoration: const InputDecoration(
              labelText: 'Tên công việc',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _description,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Mô tả',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _priority,
            decoration: const InputDecoration(
              labelText: 'Mức độ ưu tiên',
              border: OutlineInputBorder(),
            ),
            items: const ['low', 'medium', 'high']
                .map((p) => DropdownMenuItem(value: p, child: Text(priorityLabel(p))))
                .toList(),
            onChanged: (v) => setState(() => _priority = v ?? 'medium'),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _status,
            decoration: const InputDecoration(
              labelText: 'Trạng thái',
              border: OutlineInputBorder(),
            ),
            items: const ['todo', 'in_progress', 'completed']
                .map((s) => DropdownMenuItem(value: s, child: Text(statusLabel(s))))
                .toList(),
            onChanged: (v) => setState(() => _status = v ?? 'todo'),
          ),
          const SizedBox(height: 8),
          _dateTile('Ngày bắt đầu', _startDate, () => _pickDate(true)),
          _dateTile('Hạn hoàn thành', _dueDate, () => _pickDate(false)),
          const SizedBox(height: 24),
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const CircularProgressIndicator(strokeWidth: 2)
                  : const Text('Lưu'),
            ),
          ),
        ],
      ),
    );
  }
}