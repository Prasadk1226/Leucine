
// lanciere/src/components/taskform.js

import React, { useState } from "react";
import { useTasks } from "./taskcontext"; // Make sure this path is correct

const TaskForm = function () {
  // Make sure you are only destructuring addTask, loading, and error
  // 'tasks' and 'setTasks' should NOT be here anymore.
  const { addTask, loading, error } = useTasks();

  // Set up state for the form inputs
  const [form, setForm] = useState({
    title: "",        // <--- Ensure this is 'title'
    description: "",
    dueDate: "",
    priority: "Low",
    status: "To Do"   // Ensure this matches your <option> below (To Do vs To_Do)
  });

  // --- Styling functions, these are fine ---
  function getPriorityClass(priority) {
    switch (priority) {
      case "High": return "priority-high";
      case "Medium": return "priority-medium";
      case "Low": default: return "priority-low";
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case "To Do": // This should be "To Do" to match your default state and option
        return "status-todo";
      case "In_Progress":
        return "status-inprogress";
      case "Completed":
        return "status-completed";
      default: return "status-todo";
    }
  }
  // --- End styling functions ---

  // Ensure this function is correct and updates the 'form' state
  function handleChange(event) {
    const name = event.target.name;  // This should be 'title', 'description', etc.
    const value = event.target.value;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value // This updates the correct property in the 'form' object
    }));
  }

  // Ensure handleSubmit is async and calls addTask correctly
  const handleSubmit = async (event) => {
    event.preventDefault(); // Stop the page from refreshing
  console.log("Submitting form with data:", form);
    // This check is good: it prevents sending empty title to backend
    if (!form.title.trim()) { // .trim() ensures it's not just spaces
      alert("Title is required");
      return;
    }

    // This is the CRITICAL part: Call addTask with the entire 'form' object
    const addedTask = await addTask(form); // Pass the 'form' state directly

    // If task was added successfully, clear the form
    if (addedTask) {
      setForm({
        title: "",
        description: "",
        dueDate: "",
        priority: "Low",
        status: "To Do"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <input
        name="title" // <--- IMPORTANT: This 'name' must be "title"
        placeholder="Title"
        value={form.title} // <--- IMPORTANT: This 'value' must be form.title
        onChange={handleChange}
        required
        disabled={loading}
      />

      <input
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        disabled={loading}
      />

      <input
        type="date"
        name="dueDate" // <--- IMPORTANT: This 'name' must be "dueDate"
        value={form.dueDate} // <--- IMPORTANT: This 'value' must be form.dueDate
        onChange={handleChange}
        required
        disabled={loading}
      />

      <select
        name="priority" // <--- IMPORTANT: This 'name' must be "priority"
        value={form.priority} // <--- IMPORTANT: This 'value' must be form.priority
        onChange={handleChange}
        className={getPriorityClass(form.priority)}
        disabled={loading}
      >
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>

      <select
        name="status" // <--- IMPORTANT: This 'name' must be "status"
        value={form.status} // <--- IMPORTANT: This 'value' must be form.status
        onChange={handleChange}
        className={getStatusClass(form.status)}
        disabled={loading}
      >
        <option>To Do</option> {/* Changed from To_Do to To Do */}
        <option>In_Progress</option>
        <option>Completed</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Task'}
      </button>
      {error && <p style={{ color: 'red', fontSize: '0.8em' }}>{error}</p>}
    </form>
  );
}

export default TaskForm;