import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/Home";
import Register from "./pages/user/Register";
import Login from "./pages/user/Login";
import Verify from "./pages/user/Verify";
import CreateAppointment from "./components/user/CreateAppointment";
import AppointmentConfirmation from "./components/user/AppointmentConfirmation";
import AdminDashboard from "./components/admin/AdminDashboard";
import UserDashboard from "./components/user/UserDashboard";
import DoctorProfile from "./components/user/DoctorProfile";
import DoctorAppointments from "./components/user/DoctorAppointments";
import PatientAppointments from "./components/user/PatientAppointments";
import "./App.css";
import DoctorManagement from "./pages/admin/DoctorManagement";
import DoctorsDirectory from "./pages/user/DoctorsDirectory";
import UserManagement from "./pages/admin/UserManagement";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'doctor':
      case 'patient':
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

// Role-based redirect after login
const DashboardRedirect: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'doctor':
    case 'patient':
      return <Navigate to="/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:token" element={<Verify />} />

        {/* Protected User Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['patient', 'doctor']}>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/appointment/create" element={
          <ProtectedRoute allowedRoles={['patient', 'doctor']}>
            <CreateAppointment />
          </ProtectedRoute>
        } />
        <Route path="/appointment/confirmation" element={
          <ProtectedRoute allowedRoles={['patient', 'doctor']}>
            <AppointmentConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/doctor/profile" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorProfile />
          </ProtectedRoute>
        } />
        <Route path="/doctor/appointments" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorAppointments />
          </ProtectedRoute>
        } />
        <Route path="/patient/appointments" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientAppointments />
          </ProtectedRoute>
        } />
        <Route path="/doctorsdir" element={<DoctorsDirectory />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/doctors" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DoctorManagement />
          </ProtectedRoute>
        } />

        {/* Redirect to appropriate dashboard */}
        <Route path="/dashboard-redirect" element={<DashboardRedirect />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
