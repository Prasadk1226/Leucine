// lanciere/src/components/TaskList.js

import React from 'react'; // Import React for React.memo
import TaskCard from "./taskcard";

// TaskList should receive 'tasks' as a prop from AppContent now,
// which will pass it the memoized 'filteredTasks'.
function TaskList({ tasks, loading, error }) { // Accept tasks, loading, error as props
  // The loading and error states are now passed down from AppContent,
  // where the primary data fetching and filtering logic resides.

  if (loading) {
    return <p>Loading tasks...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!tasks || tasks.length === 0) { // Check for !tasks as well, though `filteredTasks` should always be an array
    return <p>No tasks found. Add a new one!</p>;
  }

  return (
    <div className="task-list">
      {/* tasks is guaranteed to be an array here due to the checks above and how filteredTasks is derived */}
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

// OPTIMIZATION: Memoize TaskList
// This prevents TaskList from re-rendering if its 'tasks' prop (and loading/error) has not changed.
export default React.memo(TaskList);