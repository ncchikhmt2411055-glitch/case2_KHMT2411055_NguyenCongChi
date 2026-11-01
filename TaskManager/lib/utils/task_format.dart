String statusLabel(dynamic status) {
  switch (status) {
    case 'todo':
      return 'Chưa thực hiện';
    case 'in_progress':
      return 'Đang thực hiện';
    case 'completed':
      return 'Đã hoàn thành';
    default:
      return '—';
  }
}

String priorityLabel(dynamic priority) {
  switch (priority) {
    case 'low':
      return 'Thấp';
    case 'medium':
      return 'Trung bình';
    case 'high':
      return 'Cao';
    default:
      return '—';
  }
}

String roleLabel(dynamic role) {
  switch (role) {
    case 'creator':
      return 'Người tạo';
    case 'assignee':
      return 'Người được giao';
    case 'viewer':
      return 'Chỉ xem';
    case 'editor':
      return 'Được chỉnh sửa';
    default:
      return 'Không có quyền';
  }
}

String formatDate(dynamic value) {
  if (value == null) return 'Chưa có';
  final d = DateTime.tryParse(value.toString());
  if (d == null) return 'Chưa có';
  final local = d.toLocal();
  final dd = local.day.toString().padLeft(2, '0');
  final mm = local.month.toString().padLeft(2, '0');
  return '$dd/$mm/${local.year}';
}