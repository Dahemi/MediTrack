import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:token" element={<Verify />} />

        {/* User Routes */}
        <Route path="/user/home" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
