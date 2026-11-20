import apiClient from './client.js';

export const TASK_STATUSES = ['pending', 'in-progress', 'completed'];

/** GET /tasks[?status=] → Task[] (newest first) */
export async function fetchTasks(status) {
  const params = status && TASK_STATUSES.includes(status) ? { status } : undefined;
  const { data } = await apiClient.get('/tasks', { params });
  return data.data;
}

/** GET /tasks/:id → Task */
export async function fetchTaskById(id) {
  const { data } = await apiClient.get(`/tasks/${id}`);
  return data.data;
}

/** POST /tasks → Task */
export async function createTask({ title, description = '', status = 'pending' }) {
  const { data } = await apiClient.post('/tasks', { title, description, status });
  return data.data;
}

/** PUT /tasks/:id (partial update, at least one field) → Task */
export async function updateTask(id, changes) {
  const payload = Object.fromEntries(
    Object.entries(changes).filter(
      ([key, value]) => ['title', 'description', 'status'].includes(key) && value !== undefined
    )
  );
  const { data } = await apiClient.put(`/tasks/${id}`, payload);
  return data.data;
}

/** DELETE /tasks/:id → { success, message } */
export async function deleteTask(id) {
  const { data } = await apiClient.delete(`/tasks/${id}`);
  return data;
}
