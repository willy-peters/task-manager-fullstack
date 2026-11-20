import { useCallback, useEffect, useState } from 'react';
import { createTask, deleteTask, fetchTasks, updateTask } from '../api/tasksApi.js';

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutatingId, setMutatingId] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Couldn't load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (payload) => {
    const created = await createTask(payload);
    setTasks((prev) => [created, ...prev]);
    return created;
  }, []);

  const editTask = useCallback(async (id, changes) => {
    setMutatingId(id);
    try {
      const updated = await updateTask(id, changes);
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      return updated;
    } finally {
      setMutatingId(null);
    }
  }, []);

  const toggleTaskComplete = useCallback(async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    const previousTasks = tasks;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
    );
    setMutatingId(task._id);

    try {
      const updated = await updateTask(task._id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
      return updated;
    } catch (err) {
      // Rollback on failure
      setTasks(previousTasks);
      throw err;
    } finally {
      setMutatingId(null);
    }
  }, [tasks]);

  const removeTask = useCallback(async (id) => {
    setMutatingId(id);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } finally {
      setMutatingId(null);
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    setError,
    mutatingId,
    refetch: loadTasks,
    addTask,
    editTask,
    toggleTaskComplete,
    removeTask,
  };
}
