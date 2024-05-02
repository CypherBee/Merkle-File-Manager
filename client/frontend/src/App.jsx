import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Table from "./components/Table";
import Profile from "./components/Profile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Drive */}
        <Route path="/" element={<Table />} />
        <Route path="/folder/:folderId" element={<Table />} />

        {/* Profile */}
        <Route path="/user" element={<Profile />} />

        {/* Auth -- Additional auth-related routes could be added here if needed in the future */}
      </Routes>
    </Router>
  );
}

export default App;
