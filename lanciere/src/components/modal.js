// import React from "react";

// export default function Modal({ isOpen, onClose, task, onSave, onChange, isCompleted }) {
//   if (!isOpen) return null;

//   const handleSave = () => {
//     onSave(task);
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <h2>Edit Task</h2>
//         <button className="close-btn" onClick={onClose}>X</button>

//         <form className="form1">
//           <label>
//             Title:
//             <input
//               type="text"
//               name="title"
//               value={task.title}
//               onChange={onChange}
//               disabled={isCompleted} 
//             />
//           </label>
//           <label>
//             Description:
//             <textarea
//               name="description"
//               value={task.description}
//               onChange={onChange}
//               disabled={isCompleted} 
//             />
//           </label>
//           <label>
//             Due Date:
//             <input
//               type="date"
//               name="dueDate"
//               value={task.dueDate}
//               onChange={onChange}
//               disabled={isCompleted} 
//             />
//           </label>
//           <label>
//             Priority:
//             <select
//               name="priority"
//               value={task.priority}
//               onChange={onChange}
//               disabled={isCompleted} 
//             >
//               <option value="Low">Low</option>
//               <option value="Medium">Medium</option>
//               <option value="High">High</option>
//             </select>
//           </label>
//           <label>
//             Status:
//             <select
//               name="status"
//               value={task.status}
//               onChange={onChange}
//               disabled={isCompleted} 
//             >
//               <option value="Incomplete">Incomplete</option>
//               <option value="Completed">Completed</option>
//             </select>
//           </label>
//         </form>

//         <button onClick={handleSave} disabled={isCompleted}>Save</button>
//       </div>
//     </div>
//   );
// }


// lanciere/src/components/Modal.js

import React from "react";

export default function Modal({ isOpen, onClose, task, onSave, onChange, isCompleted }) {
  if (!isOpen) return null;

  // CORRECTED: Pass the 'editedTask' state to onSave, not the original 'task' prop
  const handleSave = () => {
    // Basic validation before saving, similar to TaskForm
    if (!task.title || task.title.trim() === '') {
        alert("Title cannot be empty.");
        return;
    }
    onSave(task); // 'task' prop here is already the 'editedTask' state from TaskCard
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Task</h2>
        <button className="close-btn" onClick={onClose}>X</button>

        <form className="form1">
          <label>
            Title:
            <input
              type="text"
              name="title"
              value={task.title || ''} // Add || '' to handle null/undefined safely
              onChange={onChange}
              disabled={isCompleted}
              required
            />
          </label>
          <label>
            Description:
            <textarea
              name="description"
              value={task.description || ''} // Add || '' for safety
              onChange={onChange}
              disabled={isCompleted}
            />
          </label>
          <label>
            Due Date:
            <input
              type="date"
              name="dueDate"
              value={task.dueDate || ''} // Add || '' for safety
              onChange={onChange}
              disabled={isCompleted}
            />
          </label>
          <label>
            Priority:
            <select
              name="priority"
              value={task.priority}
              onChange={onChange}
              disabled={isCompleted}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <label>
            Status:
            <select
              name="status"
              value={task.status}
              onChange={onChange}
              disabled={isCompleted}
            >
              {/* CORRECTED: Options to match backend/context values */}
              <option value="To Do">To Do</option>
              <option value="In_Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
        </form>

        <button onClick={handleSave} disabled={isCompleted}>Save</button>
      </div>
    </div>
  );
}