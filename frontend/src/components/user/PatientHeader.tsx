import React from 'react';
import { useLocation } from 'react-router-dom';
import BaseHeader from '../common/BaseHeader';
import type { UserData } from '../common/BaseHeader';

interface PatientHeaderProps {
  user?: UserData;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ user }) => {
  const location = useLocation();
  
  const getPageTitle = (path: string) => {
    if (path === '/dashboard') {
      return 'Patient Dashboard';
    }
    if (path === '/appointment/create') {
      return 'Book Appointment';
    }
    if (path === '/doctorsdir') {
      return 'Find Doctors';
    }
    if (path === '/patient/appointments') {
      return 'My Appointments';
    }
    if (path === '/patient/records') {
      return 'Medical Records';
    }
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    }
    return 'Patient Dashboard';
  };

  return (
    <BaseHeader 
      user={user}
      pageTitle={getPageTitle(location.pathname)}
    />
  );
};

export default PatientHeader;
