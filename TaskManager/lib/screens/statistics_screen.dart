import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/task_format.dart';

class StatisticsScreen extends StatefulWidget {
  const StatisticsScreen({super.key});

  @override
  State<StatisticsScreen> createState() => _StatisticsScreenState();
}

class _StatisticsScreenState extends State<StatisticsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() async {
    final tasks = await ApiService.get('/statistics/tasks');
    final assignments = await ApiService.get('/statistics/assignments');
    final deadlines = await ApiService.get('/statistics/deadlines');
    return {'tasks': tasks, 'assignments': assignments, 'deadlines': deadlines};
  }

  Widget _card(String title, List<Widget> rows) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...rows,
          ],
        ),
      ),
    );
  }

  Widget _stat(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Text('$value', style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Thống kê'), centerTitle: true),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('${snap.error}', textAlign: TextAlign.center));
          }

          final t = snap.data!['tasks'] as Map<String, dynamic>;
          final by = t['byStatus'] as Map<String, dynamic>;
          final a = snap.data!['assignments'] as Map<String, dynamic>;
          final d = snap.data!['deadlines'] as Map<String, dynamic>;
          final upcoming = (d['upcoming'] as List<dynamic>).cast<Map<String, dynamic>>();
          final overdue = (d['overdue'] as List<dynamic>).cast<Map<String, dynamic>>();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _card('Công việc theo trạng thái', [
                _stat('Tổng số', t['total']),
                _stat('Chưa thực hiện', by['todo']),
                _stat('Đang thực hiện', by['in_progress']),
                _stat('Đã hoàn thành', by['completed']),
              ]),
              _card('Giao việc', [
                _stat('Được giao cho tôi', a['assignedToMe']),
                _stat('Tôi là người phụ trách', a['primaryForMe']),
                _stat('Tôi đã tạo', a['createdByMe']),
              ]),
              _card('Hạn hoàn thành', [
                const Text('Sắp đến hạn trong 7 ngày:'),
                if (upcoming.isEmpty) const Text('• Không có'),
                for (final x in upcoming)
                  Text('• ${x['title']}, hạn ${formatDate(x['dueDate'])}'),
                const SizedBox(height: 8),
                const Text('Đã quá hạn:'),
                if (overdue.isEmpty) const Text('• Không có'),
                for (final x in overdue)
                  Text(
                    '• ${x['title']}, hạn ${formatDate(x['dueDate'])}',
                    style: const TextStyle(color: Colors.red),
                  ),
              ]),
            ],
          );
        },
      ),
    );
  }
}