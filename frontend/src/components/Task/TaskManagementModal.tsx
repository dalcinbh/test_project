import React, { useState, useEffect, useCallback } from 'react';
import useAppDispatch from '../../hooks/use-app.dispatch';
import useAppSelector from '../../hooks/use-app.selector';
import { getAllTasksAsync, taskSelector, reset } from '../../slices/task.slice';
import { getAllProjectsAsync } from '../../slices/project.slice';
import { Project } from '../../interfaces/project.interface';
import { TaskTable } from './TaskTable';
import AddTaskModal from './AddTaskModal';

/**
 * Props interface for the TaskManagementModal component
 */
interface TaskManagementModalProps {
  /** Controls whether the modal is visible or hidden */
  isOpen: boolean;
  /** Callback function executed when the modal should be closed */
  onClose: () => void;
  /** Project object containing information about the project whose tasks are being managed */
  project: Project;
  /** Optional callback function executed when project data needs to be refreshed */
  onProjectsUpdate?: () => void;
}

/**
 * Comprehensive task management modal for handling all task operations within a specific project.
 * Provides a full-featured interface for viewing, creating, editing, and deleting tasks.
 * Features task statistics display, responsive table with pagination, and integrated task creation modal.
 * Automatically refreshes task and project data after any CRUD operations to maintain consistency.
 * Includes loading states, empty state handling, and proper error management.
 * 
 * @param props - Configuration object containing modal state, project data, and callback functions
 * @returns JSX modal element with comprehensive task management interface
 */
const TaskManagementModal: React.FC<TaskManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  project,
  onProjectsUpdate
}) => {
  const dispatch = useAppDispatch();
  const { tasks, loading, insertSuccess, updateSuccess, deleteSuccess } = useAppSelector(taskSelector);
  
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  /**
   * Effect hook that loads tasks and resets state when modal opens.
   * Fetches all tasks for the current project and clears any previous Redux state.
   */
  useEffect(() => {
    if (isOpen) {
      dispatch(getAllTasksAsync(project.id));
      dispatch(reset());
    }
  }, [isOpen, project.id, dispatch]);

  /**
   * Effect hook that handles automatic data refresh after successful operations.
   * Monitors task operation success states and triggers appropriate data refreshes.
   * Ensures UI consistency by updating both task and project data after changes.
   */
  useEffect(() => {
    if (insertSuccess || updateSuccess || deleteSuccess) {
      /** Refresh tasks */
      dispatch(getAllTasksAsync(project.id));
      
      /** Refresh projects */
      dispatch(getAllProjectsAsync());
      if (onProjectsUpdate) {
        onProjectsUpdate();
      }
      dispatch(reset());
    }
  }, [insertSuccess, updateSuccess, deleteSuccess, project.id, dispatch, onProjectsUpdate]);

  /**
   * Opens the add task modal for creating new tasks.
   * Uses useCallback to prevent unnecessary re-renders.
   */
  const handleAddTask = useCallback(() => {
    setIsAddTaskModalOpen(true);
  }, []);

  /**
   * Closes the add task modal and resets modal state.
   * Uses useCallback to maintain reference stability.
   */
  const handleCloseAddTaskModal = useCallback(() => {
    setIsAddTaskModalOpen(false);
  }, []);

  /**
   * Handles successful task addition completion.
   * Data refresh is automatically handled by the useEffect hook above.
   * Uses useCallback for performance optimization.
   */
  const handleTaskAdded = useCallback(() => {
    /** Refresh is handled by useEffect above */
  }, []);

  /**
   * Handles task updates and triggers necessary data refreshes.
   * Refreshes both task list and project data to maintain consistency.
   * Uses useCallback to prevent unnecessary re-renders.
   */
  const handleTaskUpdate = useCallback(() => {
    /** Refresh tasks */
    dispatch(getAllTasksAsync(project.id));
    
    /** Refresh projects */
    dispatch(getAllProjectsAsync());
    if (onProjectsUpdate) {
      onProjectsUpdate();
    }
  }, [dispatch, project.id, onProjectsUpdate]);

  /** Sort tasks by creation date in descending order for better user experience */
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  /** Calculate task statistics for display in modal header */
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const totalTasks = tasks.length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 modal-backdrop overflow-y-auto h-full w-full z-50">
        <div className="relative top-4 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
          <div className="mt-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Tasks - {project.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    Total Tasks: {totalTasks}
                  </span>
                  <span className="text-sm text-gray-500">
                    Completed: {completedTasks}
                  </span>
                  <span className="text-sm text-gray-500">
                    Pending: {totalTasks - completedTasks}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Add Task Button */}
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-medium text-gray-900">Task Management</h4>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Add New Task
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading tasks...</span>
              </div>
            )}

            {/* Tasks Table */}
            {!loading && (
              <>
                {sortedTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                    <p className="text-gray-500 mb-4">Get started by creating a new task for this project.</p>
                    <button
                      onClick={handleAddTask}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add your first task
                    </button>
                  </div>
                ) : (
                  <TaskTable
                    data={sortedTasks}
                    projectId={project.id}
                    onUpdate={handleTaskUpdate}
                  />
                )}
              </>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-6 border-t mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={handleCloseAddTaskModal}
        onSuccess={handleTaskAdded}
        projectId={project.id}
      />
    </>
  );
};

export default TaskManagementModal; 