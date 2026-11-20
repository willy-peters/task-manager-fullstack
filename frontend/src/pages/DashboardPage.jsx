import { useCallback, useEffect, useMemo, useState } from 'react';
import ActiveFilterChips from '../components/dashboard/ActiveFilterChips.jsx';
import FilterToolbar from '../components/dashboard/FilterToolbar.jsx';
import StatsGrid from '../components/dashboard/StatsGrid.jsx';
import Toast from '../components/common/Toast.jsx';
import DashboardSkeleton from '../components/feedback/DashboardSkeleton.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorBanner from '../components/feedback/ErrorBanner.jsx';
import Footer from '../components/layout/Footer.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal.jsx';
import TaskCard from '../components/tasks/TaskCard.jsx';
import TaskListRow from '../components/tasks/TaskListRow.jsx';
import TaskModal from '../components/tasks/TaskModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useTasks from '../hooks/useTasks.js';
import { downloadCsv } from '../utils/formatters.js';

export default function DashboardPage() {
  const { user, logout, welcomeMessage, clearWelcomeMessage } = useAuth();
  const {
    tasks,
    loading,
    error,
    setError,
    mutatingId,
    refetch,
    addTask,
    editTask,
    toggleTaskComplete,
    removeTask,
  } = useTasks();

  // Search, filter, sort & view state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  // Modal & toast state
  const [taskModal, setTaskModal] = useState({
    isOpen: false,
    mode: 'add',
    task: null,
    initialTitle: '',
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  }, []);

  // Show "Welcome back, {username}" notification upon logging in
  useEffect(() => {
    if (welcomeMessage) {
      showToast(welcomeMessage, 'success');
      clearWelcomeMessage();
    }
  }, [welcomeMessage, clearWelcomeMessage, showToast]);

  const counts = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    for (const t of tasks) {
      if (t.status === 'pending') pending += 1;
      else if (t.status === 'in-progress') inProgress += 1;
      else if (t.status === 'completed') completed += 1;
    }
    return {
      all: tasks.length,
      pending,
      inProgress,
      completed,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!q) return true;
      const inTitle = (t.title ?? '').toLowerCase().includes(q);
      const inDesc = (t.description ?? '').toLowerCase().includes(q);
      return inTitle || inDesc;
    });

    const sorted = [...list];
    if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === 'title-asc') {
      sorted.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return sorted;
  }, [tasks, searchQuery, statusFilter, sortBy]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || statusFilter !== 'all' || sortBy !== 'newest';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('newest');
  };

  const openAddModal = (initialTitle = '') => {
    setTaskModal({ isOpen: true, mode: 'add', task: null, initialTitle });
  };

  const openEditModal = (task) => {
    setTaskModal({ isOpen: true, mode: 'edit', task, initialTitle: '' });
  };

  const closeTaskModal = () => {
    setTaskModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleModalSubmit = async (formValues) => {
    if (taskModal.mode === 'edit' && taskModal.task) {
      await editTask(taskModal.task._id, formValues);
      showToast('Task updated');
    } else {
      await addTask(formValues);
      showToast('Task created');
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updated = await toggleTaskComplete(task);
      showToast(
        updated.status === 'completed' ? 'Task marked complete' : 'Task reopened'
      );
    } catch (err) {
      showToast(err?.message || 'Could not update task status', 'error');
    }
  };

  const handleConfirmDelete = async (task) => {
    await removeTask(task._id);
    setDeleteTarget(null);
    showToast('Task deleted');
  };

  const handleExportCsv = () => {
    if (filteredTasks.length === 0) {
      showToast('No tasks to export', 'error');
      return;
    }
    downloadCsv(filteredTasks);
    showToast(`Exported ${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'} to CSV`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar user={user} onLogout={logout} />

      <main className="w-full pt-16 flex-grow max-w-7xl mx-auto px-margin-sm sm:px-6 lg:px-12 pb-16">
        {/* Top Command & Action Bar */}
        <section className="pt-6 md:pt-8 pb-5 md:pb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div>
            <h1 className="text-headline-lg text-on-surface tracking-tight">Overview &amp; Tasks</h1>
            <p className="text-body-md text-on-surface-variant mt-0.5">
              Organize your backlog, track progress, and filter tasks in real time.
            </p>
          </div>

          <div className="flex items-center gap-space-sm self-start lg:self-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-secondary shadow-sm"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">download</span>
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => openAddModal('')}
              className="btn-primary shadow-sm"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">add</span>
              <span>Add Task</span>
            </button>
          </div>
        </section>

        {/* Global Error Banner */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={refetch}
            isRetrying={loading}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Filter & Controls Toolbar */}
        <FilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          counts={counts}
          visibleCount={filteredTasks.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
        />

        <ActiveFilterChips
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          sortBy={sortBy}
          onClearSearch={() => setSearchQuery('')}
          onClearStatus={() => setStatusFilter('all')}
          onClearSort={() => setSortBy('newest')}
          onResetAll={clearAllFilters}
        />

        {/* Loading Skeletons vs Loaded Content */}
        {loading && tasks.length === 0 ? (
          <DashboardSkeleton />
        ) : (
          <>
            <StatsGrid tasks={tasks} />

            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-space-sm">
                <h2 className="text-headline-sm text-on-surface">Active Backlog</h2>
                <span className="bg-surface-container-high text-on-surface-variant text-label-sm px-2 py-0.5 rounded-full">
                  {filteredTasks.length} visible
                </span>
              </div>
            </div>

            {/* Task Grid / List / Empty States */}
            {tasks.length === 0 ? (
              <EmptyState variant="empty" onAddTask={() => openAddModal('')} />
            ) : filteredTasks.length === 0 ? (
              <EmptyState
                variant="filtered"
                searchQuery={searchQuery}
                onClearFilters={clearAllFilters}
                onCreateFromSearch={(title) => openAddModal(title)}
              />
            ) : viewMode === 'grid' ? (
              <section
                aria-label="Task list"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md md:gap-space-lg"
              >
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onEdit={openEditModal}
                    onDelete={setDeleteTarget}
                    isMutating={mutatingId === task._id}
                  />
                ))}
              </section>
            ) : (
              <section
                aria-label="Task list"
                className="card overflow-hidden divide-y divide-surface-container-low"
              >
                {filteredTasks.map((task) => (
                  <TaskListRow
                    key={task._id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onEdit={openEditModal}
                    onDelete={setDeleteTarget}
                    isMutating={mutatingId === task._id}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </main>

      {/* Mobile Sticky Thumb-Reach FAB */}
      <aside className="md:hidden fixed right-4 bottom-6 z-30 pb-safe">
        <button
          type="button"
          aria-label="Create new task"
          onClick={() => openAddModal('')}
          className="h-14 px-5 rounded-full bg-primary text-on-primary flex items-center gap-2 shadow-fab hover:bg-primary-container active:scale-95 transition-all text-label-lg font-semibold"
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
          <span>Add Task</span>
        </button>
      </aside>

      <Footer />

      {/* Add / Edit Task Modal (Centered Desktop / Bottom Sheet Mobile) */}
      <TaskModal
        isOpen={taskModal.isOpen}
        mode={taskModal.mode}
        task={taskModal.task}
        initialTitle={taskModal.initialTitle}
        onClose={closeTaskModal}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        task={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
