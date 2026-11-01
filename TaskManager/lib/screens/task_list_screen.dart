import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/task_format.dart';
import 'login_screen.dart';
import 'notification_screen.dart';
import 'statistics_screen.dart';
import 'task_detail_screen.dart';
import 'task_form_screen.dart';

class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  final _search = TextEditingController();
  String _scope = 'all';
  String _status = '';
  String _priority = '';
  String _assignee = '';
  String _sortBy = 'dueDate';
  String _order = 'asc';
  int _unread = 0;
  final Map<String, String> _assignees = {'': 'Mọi người phụ trách'};
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
    _loadUnread();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<List<dynamic>> _fetch() async {
    final params = <String, String>{
      'scope': _scope,
      'sortBy': _sortBy,
      'order': _order,
    };
    if (_status.isNotEmpty) params['status'] = _status;
    if (_priority.isNotEmpty) params['priority'] = _priority;
    if (_assignee.isNotEmpty) params['assigneeId'] = _assignee;
    final q = _search.text.trim();
    if (q.isNotEmpty) params['q'] = q;

    final qs = Uri(queryParameters: params).query;
    try {
      final data = await ApiService.get('/tasks?$qs');
      final list = data['tasks'] as List<dynamic>;
      _collectAssignees(list);
      return list;
    } on ApiException catch (e) {
      if (e.statusCode == 401) {
        await ApiService.clearToken();
      }
      rethrow;
    }
  }

  void _collectAssignees(List<dynamic> tasks) {
    var changed = false;
    for (final t in tasks) {
      final task = t as Map<String, dynamic>;
      final people = <dynamic>[];
      final list = task['assignees'];
      if (list is List) people.addAll(list);
      final primary = task['primaryAssignee'];
      if (primary is Map) people.add(primary);

      for (final p in people) {
        if (p is! Map) continue;
        final id = (p['id'] ?? p['_id'] ?? '').toString();
        if (id.isNotEmpty && !_assignees.containsKey(id)) {
          _assignees[id] = (p['fullName'] ?? p['email'] ?? id).toString();
          changed = true;
        }
      }
    }
    if (changed && mounted) setState(() {});
  }

  Future<void> _loadUnread() async {
    try {
      final data = await ApiService.get('/notifications/unread-count');
      if (!mounted) return;
      setState(() => _unread = (data['count'] as num).toInt());
    } catch (_) {}
  }

  void _reload() {
    setState(() {
      _future = _fetch();
    });
    _loadUnread();
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

  Future<void> _openNotifications() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const NotificationScreen()),
    );
    _loadUnread();
  }

  Future<void> _openStatistics() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const StatisticsScreen()),
    );
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

  Widget _dropdown(String value, Map<String, String> options, void Function(String) onChanged) {
    return DropdownButton<String>(
      value: options.containsKey(value) ? value : options.keys.first,
      underline: const SizedBox.shrink(),
      items: options.entries
          .map((e) => DropdownMenuItem<String>(value: e.key, child: Text(e.value)))
          .toList(),
      onChanged: (v) {
        if (v != null) onChanged(v);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Công việc'),
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: 'Thông báo',
            onPressed: _openNotifications,
            icon: Badge(
              isLabelVisible: _unread > 0,
              label: Text('$_unread'),
              child: const Icon(Icons.notifications_outlined),
            ),
          ),
          IconButton(
            tooltip: 'Thống kê',
            onPressed: _openStatistics,
            icon: const Icon(Icons.bar_chart),
          ),
          IconButton(onPressed: _reload, icon: const Icon(Icons.refresh)),
          IconButton(onPressed: _logout, icon: const Icon(Icons.logout)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openCreate,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: TextField(
              controller: _search,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _reload(),
              decoration: InputDecoration(
                hintText: 'Tìm theo tên công việc',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _search.clear();
                    _reload();
                  },
                ),
                border: const OutlineInputBorder(),
                isDense: true,
              ),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Row(
              children: [
                _dropdown(_scope, const {
                  'all': 'Tất cả',
                  'created': 'Tôi tạo',
                  'assigned': 'Được giao',
                  'shared': 'Được chia sẻ',
                }, (v) {
                  _scope = v;
                  _reload();
                }),
                const SizedBox(width: 12),
                _dropdown(_status, const {
                  '': 'Mọi trạng thái',
                  'todo': 'Chưa thực hiện',
                  'in_progress': 'Đang thực hiện',
                  'completed': 'Đã hoàn thành',
                }, (v) {
                  _status = v;
                  _reload();
                }),
                const SizedBox(width: 12),
                _dropdown(_priority, const {
                  '': 'Mọi ưu tiên',
                  'low': 'Thấp',
                  'medium': 'Trung bình',
                  'high': 'Cao',
                }, (v) {
                  _priority = v;
                  _reload();
                }),
                const SizedBox(width: 12),
                _dropdown(_assignee, _assignees, (v) {
                  _assignee = v;
                  _reload();
                }),
                const SizedBox(width: 12),
                _dropdown(_sortBy, const {
                  'dueDate': 'Theo hạn',
                  'priority': 'Theo ưu tiên',
                  'createdAt': 'Theo ngày tạo',
                }, (v) {
                  _sortBy = v;
                  _reload();
                }),
                const SizedBox(width: 12),
                _dropdown(_order, const {
                  'asc': 'Tăng dần',
                  'desc': 'Giảm dần',
                }, (v) {
                  _order = v;
                  _reload();
                }),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<dynamic>>(
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
                  return const Center(child: Text('Không có công việc phù hợp'));
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
          ),
        ],
      ),
    );
  }
}
