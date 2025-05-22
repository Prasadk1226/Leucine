import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
// Import FaPlus for the "add note" button
import { FaPlus } from 'react-icons/fa';

// Corrected import paths to point to the 'components' subdirectory
import TaskForm from "./components/taskform";
import TaskList from "./components/tasklist";
import Filters from "./components/filters";
import { TaskProvider, useTasks } from "./components/taskcontext";
import './components/App.css'; // This path is used as per your provided file

function AppContent() {
  const { tasks, loading, error } = useTasks();
  const [summaryToast, setSummaryToast] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({ search: '', priority: 'All', status: 'All' });

  // --- START: Toast Timer and Progress Bar Functionality ---
  // useRef to store the timeout ID
  const timerRef = useRef(null);
  // useRef for the progress bar DOM element
  const progressBarRef = useRef(null);

  // Function to start the dismiss timer and progress bar animation
  const startDismissTimer = useCallback(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Set a new timer
    timerRef.current = setTimeout(() => {
      setSummaryToast(null); // Dismiss the toast
      timerRef.current = null; // Clear ref after timer completes
    }, 5000); // 5 seconds

    // Logic to start/resume progress bar animation
    if (progressBarRef.current) {
      // Reset animation to ensure it restarts from the beginning if toast is new
      progressBarRef.current.style.animation = 'none';
      // Force reflow to apply 'none' before restarting
      void progressBarRef.current.offsetWidth;
      // Apply the animation
      progressBarRef.current.style.animation = 'progressBarShrink 5s linear forwards';
      progressBarRef.current.style.animationPlayState = 'running'; // Ensure it's running
    }

  }, []); // Corrected: REMOVED 'summaryToast' from dependencies

  // Function to clear the dismiss timer and pause progress bar animation (on hover in)
  const clearDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null; // Clear ref as timer is stopped
    }
    // Pause progress bar animation
    if (progressBarRef.current) {
      progressBarRef.current.style.animationPlayState = 'paused';
    }
  }, []); // No dependencies, function is stable

  // Effect to manage the timer when toast appears/disappears
  useEffect(() => {
    if (summaryToast) { // If a toast is currently active, start its timer
      startDismissTimer();
    } else { // If toast is null, ensure any lingering timer is cleared
      clearDismissTimer(); // Ensure any old timer is stopped
    }
    // Cleanup function: clears the timer if component unmounts or toast goes away
    return () => clearDismissTimer();
  }, [summaryToast, startDismissTimer, clearDismissTimer]); // Re-run when summaryToast changes or timer functions change (stable)
  // --- END: Toast Timer and Progress Bar Functionality ---


  const handleFilter = useCallback(({ search, priority, status }) => {
    setFilterCriteria({ search, priority, status });
  }, []);

  const filteredTasks = useMemo(() => {
    let currentFiltered = [...tasks];

    if (filterCriteria.search) {
      currentFiltered = currentFiltered.filter((task) =>
        task.title.toLowerCase().includes(filterCriteria.search.toLowerCase())
      );
    }

    if (filterCriteria.priority !== "All") {
      currentFiltered = currentFiltered.filter((task) => task.priority === filterCriteria.priority);
    }

    if (filterCriteria.status === "Completed") {
      currentFiltered = currentFiltered.filter((task) => task.completed === true);
    } else if (filterCriteria.status === "Incomplete") {
      currentFiltered = currentFiltered.filter((task) => task.completed === false);
    }

    return currentFiltered;
  }, [tasks, filterCriteria]);

  const handleSummarizeAndSend = useCallback(async () => {
    setIsSummarizing(true);
    setSummaryToast(null); // Clear any existing toast/message before new action
    clearDismissTimer(); // Ensure any old timer is stopped immediately before a new request

    try {
      const response = await fetch('http://localhost:8080/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to summarize and send to Slack.');
      }

      // Set the summary content to be displayed in the toast
      setSummaryToast({ type: 'success', text: data.summary });
      console.log('Summary sent to Slack. Backend response:', data);

    } catch (err) {
      console.error("Error summarizing and sending to Slack:", err);
      // Set an error message for the toast
      setSummaryToast({ type: 'error', text: err.message || 'An unexpected error occurred while sending to Slack.' });
    } finally {
      setIsSummarizing(false);
    }
  }, [clearDismissTimer]); // No change here, still only clearDismissTimer

  return (
    <div className="App">
      <header className="App-header">
        <h1>Todo Summary Assistant</h1>
      </header>
      <main>
        {/* Filters and TaskForm remain above the main task content as before */}
        <Filters onFilter={handleFilter} />
        <TaskForm />

        {/* New container for the Sticky Wall (button + task grid) */}
        <div className="sticky-wall-container">
          {/* Summarize button positioned at the top right within this container */}
          <button
            onClick={handleSummarizeAndSend}
            disabled={isSummarizing || loading}
            className="summarize-button"
          >
            {isSummarizing ? "Summarizing..." : "Summarize & Send to Slack"}
          </button>

          {loading && <p>Loading tasks...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}

          {/* TaskList (the grid of sticky notes) */}
          {!loading && !error && (
            <TaskList tasks={filteredTasks}>
              {/* The plus sign placeholder for adding new notes */}
              {/* IMPORTANT: TaskList.js MUST render its 'children' prop for this to show up */}
              <div className="task-card add-note-button">
                <FaPlus />
              </div>
            </TaskList>
          )}
        </div> {/* End sticky-wall-container */}

        {/* Summary Toast Notification - position fixed (outside main flow) */}
        {summaryToast && (
          <div
            className={`summary-toast summary-toast-${summaryToast.type}`}
            onMouseEnter={clearDismissTimer}
            onMouseLeave={startDismissTimer}
          >
            {summaryToast.type === 'success' ? (
              <>
                <p>Summary sent to Slack. Here's what was sent:</p>
                <pre className="summary-toast-text">{summaryToast.text}</pre>
                {/* Progress bar div - THIS IS THE BAR TO SHOW THE TIMER */}
                <div className="summary-progress-bar-container">
                  <div ref={progressBarRef} className="summary-progress-bar"></div>
                </div>
              </>
            ) : (
              <p className="summary-toast-error-text">Error: {summaryToast.text}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}