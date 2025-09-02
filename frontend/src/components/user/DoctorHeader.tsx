import React from 'react';
import { useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/api';
import BaseHeader from '../common/BaseHeader';
import type { UserData } from '../common/BaseHeader';

interface DoctorHeaderProps {
  doctor?: {
    fullName: string;
    specialization: string;
    isVerifiedDoctor?: boolean;
    profilePictureUrl?: string;
  };
}

const DoctorHeader: React.FC<DoctorHeaderProps> = ({ doctor }) => {
  const location = useLocation();
  const currentUser = getCurrentUser();
  
  const getPageTitle = (path: string) => {
    if (path === '/doctor/profile') {
      return 'Doctor Profile';
    }
    if (path === '/doctor/appointments') {
      return 'My Appointments';
    }
    if (path === '/doctor/dashboard') {
      return 'Doctor Dashboard';
    }
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    }
    return 'Doctor Dashboard';
  };

  const userName = doctor?.fullName || currentUser?.name || 'Doctor';
  const userEmail = currentUser?.email || 'Not provided';
  const userRole = 'Doctor';
  const userAvatar = doctor?.profilePictureUrl;

  // Create user data object for BaseHeader
  const userData: UserData = {
    name: userName,
    role: userRole,
    email: userEmail,
    avatar: userAvatar
  };

  // Extra elements for doctor verification badge
  const extraElements = doctor && doctor.isVerifiedDoctor !== undefined && (
    <div className="flex items-center">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        doctor.isVerifiedDoctor 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {doctor.isVerifiedDoctor ? '✅ Verified' : '⏳ Pending'}
      </span>
    </div>
  );

  return (
    <BaseHeader 
      user={userData}
      pageTitle={getPageTitle(location.pathname)}
      extraElements={extraElements}
    />
  );
};

export default DoctorHeader;
