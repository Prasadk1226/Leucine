import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { FaPlus } from 'react-icons/fa';
import TaskForm from "./components/taskform";
import TaskList from "./components/tasklist";
import Filters from "./components/filters";
import { TaskProvider, useTasks } from "./components/taskcontext";
import './components/App.css';

function AppContent() {
  const { tasks, loading, error } = useTasks();
  const [summaryToast, setSummaryToast] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({ search: '', priority: 'All', status: 'All' });

  const timerRef = useRef(null);
  const progressBarRef = useRef(null);

  const startDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setSummaryToast(null);
      timerRef.current = null;
    }, 5000);

    if (progressBarRef.current) {
      progressBarRef.current.style.animation = 'none';
      void progressBarRef.current.offsetWidth;
      progressBarRef.current.style.animation = 'progressBarShrink 5s linear forwards';
      progressBarRef.current.style.animationPlayState = 'running';
    }
  }, []);

  const clearDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressBarRef.current) {
      progressBarRef.current.style.animationPlayState = 'paused';
    }
  }, []);

  useEffect(() => {
    if (summaryToast) {
      startDismissTimer();
    } else {
      clearDismissTimer();
    }
    return () => clearDismissTimer();
  }, [summaryToast, startDismissTimer, clearDismissTimer]);

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
    setSummaryToast(null);
    clearDismissTimer();

    try {
      const tasksToSummarize = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        completed: task.completed
      }));

      const SUMMARIZE_API_URL = 'https://leucine-y0ug.onrender.com/api/summarize';

      const response = await fetch(SUMMARIZE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todos: tasksToSummarize }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status} - Failed to summarize.`);
      }

      setSummaryToast({ type: 'success', text: data.summary || 'Summary generated successfully!' });
      console.log('Summary sent to Slack. Backend response:', data);

    } catch (err) {
      console.error("Error summarizing and sending to Slack:", err);
      setSummaryToast({ type: 'error', text: err.message || 'An unexpected error occurred while sending to Slack.' });
    } finally {
      setIsSummarizing(false);
    }
  }, [tasks, clearDismissTimer]);


  return (
    <div className="App">
      <header className="App-header">
        <h1>Todo Summary Assistant</h1>
      </header>
      <main>
        <Filters onFilter={handleFilter} />
        <TaskForm />

        <div className="sticky-wall-container">
          <button
            onClick={handleSummarizeAndSend}
            disabled={isSummarizing || loading || tasks.length === 0}
            className="summarize-button"
          >
            {isSummarizing ? "Summarizing..." : "Summarize & Send to Slack"}
          </button>

          {loading && <p>Loading tasks...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}

          {!loading && !error && (
            <TaskList tasks={filteredTasks}>
              <div className="task-card add-note-button">
                <FaPlus />
              </div>
            </TaskList>
          )}
        </div>

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