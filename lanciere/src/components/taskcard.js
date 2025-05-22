

import React, { useState } from "react";
import { useTasks } from "./taskcontext";
import Modal from "./modal";
import "./App.css";

function TaskCard({ task }) {
  const { updateTask, deleteTask, loading, error } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
console.log(task)
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
  });

  async function handleToggleComplete() {
    const newCompletedStatus = !task.completed;
    try {
      await updateTask(task.id, { completed: newCompletedStatus });
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  }

  async function handleDeleteTask() {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(task.id);
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
    }
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditedTask({ ...editedTask, [name]: value });
  }

  async function handleSaveEdit(updatedData) {
    try {
      const { title, description, dueDate, priority, status } = updatedData;
      await updateTask(task.id, { title, description, dueDate, priority, status });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save edits:", err);
    }
  }

  function getPriorityClass(priority) {
    switch (priority) {
      case "High":
        return "priority-high";
      case "Medium":
        return "priority-medium";
      case "Low":
      default:
        return "priority-low";
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case "To Do":
        return "status-todo";
      case "In_Progress":
        return "status-inprogress";
      case "Completed":
        return "status-completed";
      default:
        return "status-todo";
    }
  }

  return (
    <>
      <div
        className={`task-card ${getPriorityClass(task.priority)} ${getStatusClass(task.status)} ${task.completed ? "completed" : ""}`}
      >
        <h3>{task.title}</h3>
        <p>{task.description}</p>
        <p>Due: {task.dueDate}</p>
        <p className={getPriorityClass(task.priority)}>Priority: {task.priority}</p>
        <p className={getStatusClass(task.status)}>Status: {task.status}</p>
        <p>Created: {new Date(task.createdAt).toLocaleDateString()}</p>

        <div id="buttonCon">
          <button onClick={handleToggleComplete} disabled={loading}>
            {task.completed ? "Mark Incomplete" : "Mark Complete"}
          </button>
          <button onClick={() => setIsEditing(true)} disabled={task.completed || loading}>Edit</button>
          <button onClick={handleDeleteTask} disabled={loading}>Delete</button>
        </div>
      </div>

      {isEditing && (
        <Modal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          task={editedTask}
          onSave={handleSaveEdit}
          onChange={handleEditChange}
          isCompleted={task.completed}
        />
      )}
      {error && <p style={{ color: 'red', fontSize: '0.8em' }}>{error}</p>}
    </>
  );
}

export default React.memo(TaskCard);