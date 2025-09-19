import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AvailableSlots from "./pages/user/AvailableSlots";
import MyAppointments from "./pages/user/MyAppointments";

function App() {
  return (
    <AuthProvider>
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
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/appointment/confirmation" element={<AppointmentConfirmation />}/>
          <Route path="/doctorsdir" element={<DoctorsDirectory />} />
          <Route path="/doctors/:id/slots" element={<AvailableSlots />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
