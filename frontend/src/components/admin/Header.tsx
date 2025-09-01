import React from 'react';
import { useLocation } from 'react-router-dom';
import BaseHeader from '../common/BaseHeader';
import type { UserData } from '../common/BaseHeader';

interface HeaderProps {
  user: UserData;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const location = useLocation();
  
  const getPageTitle = (path: string) => {
    if (path === '/admin') {
      return 'Dashboard';
    }
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    }
    return 'Dashboard';
  };

  return (
    <BaseHeader 
      user={user}
      pageTitle={getPageTitle(location.pathname)}
    />
  );
};

export default Header;