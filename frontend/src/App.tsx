import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import "./App.css";
import DoctorManagement from "./pages/DoctorManagement";
import DoctorsDirectory from "./pages/DoctorsDirectory";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:token" element={<Verify />} />
        <Route path="/doctors" element={<DoctorManagement />} />
        <Route path="/doctorsdir" element={<DoctorsDirectory />} />
      </Routes>
    </Router>
  );
}

export default App;
