

// lanciere/src/components/taskcontext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TaskContext = createContext();

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:8080/api/todos';

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to format task data coming FROM the backend
  // UPDATED: No longer re-mapping 'text' to 'title' or 'due_date' to 'dueDate'
  // because the backend is already sending these in camelCase.
  const formatTaskFromBackend = (todo) => {
    if (!todo) return null;
    return {
      id: todo.id,
      title: todo.title, // Use todo.title directly from backend response
      description: todo.description,
      dueDate: todo.dueDate, // Use todo.dueDate directly from backend response
      priority: todo.priority,
      status: todo.status,
      completed: todo.completed,
      createdAt: todo.createdAt // Use todo.createdAt directly from backend response
    };
  };

  // Helper function to format task data going TO the backend
  // This mapping remains crucial as the database uses snake_case (text, due_date)
  const formatTaskForBackend = (task) => {
    if (!task) return null;
    return {
       title: task.title, // NEW: Send 'title' directly, as backend now expects 'title'
     description: task.description,
     due_date: task.dueDate, // Map 'dueDate' (frontend) to 'due_date' (DB)
     priority: task.priority,
     status: task.status,
     completed: task.completed // Keep this as it is
    };
  };

  // Fetch tasks from the backend
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure data is an array before setting
      if (Array.isArray(data)) {
        // Format each task before setting it in state
        setTasks(data.map(formatTaskFromBackend));
      } else {
        throw new Error('Data received is not an array.');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  // Add a new task to the backend
  const addTask = async (newTaskData) => {
    setLoading(true);
    setError(null);
    try {
      // Format the task data before sending to the backend
      const taskToSend = formatTaskForBackend(newTaskData);
      console.log('Task data being sent to backend:', taskToSend);
      // Backend automatically sets ID, completed, createdAt
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const addedTask = await response.json();
      // Add the newly returned (and formatted) task to the current tasks list
      setTasks((prevTasks) => [...prevTasks, formatTaskFromBackend(addedTask)]);
      return formatTaskFromBackend(addedTask); // Return the added task for component use
    } catch (err) {
      console.error('Error adding task:', err);
      setError(`Failed to add task: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing task on the backend
  const updateTask = async (id, updatedFields) => {
    setLoading(true);
    setError(null);
    try {
      // Prepare fields for backend, mapping camelCase to snake_case if needed
      const fieldsToSend = {};
      if (updatedFields.title !== undefined) fieldsToSend.text = updatedFields.title;
      if (updatedFields.description !== undefined) fieldsToSend.description = updatedFields.description;
      if (updatedFields.dueDate !== undefined) fieldsToSend.due_date = updatedFields.dueDate;
      if (updatedFields.priority !== undefined) fieldsToSend.priority = updatedFields.priority;
      if (updatedFields.status !== undefined) fieldsToSend.status = updatedFields.status;
      if (updatedFields.completed !== undefined) fieldsToSend.completed = updatedFields.completed;

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldsToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const updatedTask = await response.json();
      // Update the specific task in the local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? formatTaskFromBackend(updatedTask) : task
        )
      );
      return formatTaskFromBackend(updatedTask); // Return the updated task
    } catch (err) {
      console.error('Error updating task:', err);
      setError(`Failed to update task: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a task from the backend
  const deleteTask = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Filter out the deleted task from the local state
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      return true; // Indicate success
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(`Failed to delete task: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when the component mounts
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]); // fetchTasks is stable due to useCallback

  const contextValue = {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    fetchTasks // Expose fetchTasks if a component needs to manually refresh
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};