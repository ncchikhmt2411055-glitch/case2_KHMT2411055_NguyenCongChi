const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'completed'];

function parseDate(value) {
  if (value === null || value === '') return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

// partial = true: chỉ kiểm tra các trường có trong body (dùng cho PUT)
function validateTaskInput(body, partial = false) {
  const data = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? '').trim();
    if (title.length < 2) return { error: 'Tên công việc phải có ít nhất 2 ký tự' };
    data.title = title;
  }
  if (body.description !== undefined) {
    data.description = String(body.description ?? '').trim();
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) return { error: 'Mức độ ưu tiên không hợp lệ' };
    data.priority = body.priority;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return { error: 'Trạng thái không hợp lệ' };
    data.status = body.status;
  }
  if (body.startDate !== undefined) {
    const d = parseDate(body.startDate);
    if (d === undefined) return { error: 'Ngày bắt đầu không hợp lệ' };
    data.startDate = d;
  }
  if (body.dueDate !== undefined) {
    const d = parseDate(body.dueDate);
    if (d === undefined) return { error: 'Hạn hoàn thành không hợp lệ' };
    data.dueDate = d;
  }
  return { data };
}

module.exports = { validateTaskInput, STATUSES };