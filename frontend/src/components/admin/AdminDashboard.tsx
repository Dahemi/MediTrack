import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AppointmentsPage from '../../pages/admin/appointment';

// Mock user data (replace with actual auth data)
const user = {
  name: 'Admin User',
  role: 'Administrator',
};

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Placeholder components (create separate files for these)
const Overview = () => <div>Overview Content</div>;
//const Appointments = () => <div>Appointments Content</div>;
const Doctors = () => <div>Doctors Content</div>;
const Settings = () => <div>Settings Content</div>;

export default AdminDashboard;