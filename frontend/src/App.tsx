import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/Home";
import Register from "./pages/user/Register";
import Login from "./pages/user/Login";
import Verify from "./pages/user/Verify";
import CreateAppointment from "./components/user/CreateAppointment";
import AppointmentConfirmation from "./components/user/AppointmentConfirmation";
import AdminDashboard from "./components/admin/AdminDashboard";
import "./App.css";
import DoctorManagement from "./pages/admin/DoctorManagement";
import DoctorsDirectory from "./pages/user/DoctorsDirectory";
import AvailableSlots from "./pages/user/AvailableSlots";

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:token" element={<Verify />} />
        <Route path="/doctors" element={<DoctorManagement />} />
        <Route path="/admin/*" element={<AdminDashboard />} />

        {/* User Routes */}
        <Route path="/user/home" element={<HomePage />} />
        <Route path="/appointment/create" element={<CreateAppointment />} />
        <Route
          path="/appointment/confirmation"
          element={<AppointmentConfirmation />}
        />
        <Route path="/doctorsdir" element={<DoctorsDirectory />} />
        <Route path="/doctors/:id/slots" element={<AvailableSlots />} />
      </Routes>
    </Router>
  );
}

export default App;
