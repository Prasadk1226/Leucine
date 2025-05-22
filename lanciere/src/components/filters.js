// components/Filters.jsx
import { useState } from "react";
// import { useTasks } from "./taskcontext";

export default function Filters({ onFilter }) {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");

  const handleFilter = () => {
    onFilter({ search, priority, status });
  };

  return (
    <div className="filters">
        <button> TASK MANAGER</button>
      <input
        type="text"
        placeholder="Search by title"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="All">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="All">All Status</option>
        <option value="Incomplete">Incomplete</option>
        <option value="Completed">Completed</option>
      </select>

      <button onClick={handleFilter}>Apply Filters</button>
    </div>
  );
}
