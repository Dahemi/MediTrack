import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../user/logo';
import { logout } from '../../services/api';

export interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export interface BaseSidebarProps {
  navItems: NavItem[];
  isCollapsible?: boolean;
  customLogout?: () => void;
  customLogo?: React.ReactNode;
  customStyling?: string;
  useButtonNavigation?: boolean;
  onNavItemClick?: (path: string) => void;
}

const BaseSidebar: React.FC<BaseSidebarProps> = ({
  navItems,
  isCollapsible = true,
  customLogout,
  customLogo,
  customStyling = '',
  useButtonNavigation = false,
  onNavItemClick
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const handleLogout = () => {
    if (customLogout) {
      customLogout();
    } else {
      logout();
    }
  };

  return (
    <div className={`bg-white h-screen border-r border-gray-200 transition-all duration-300 flex flex-col ${
      isCollapsible && isOpen ? 'w-64' : isCollapsible ? 'w-20' : 'w-64'
    } ${customStyling}`}>
      <div className="flex items-center justify-between p-4">
        <div className={`${isCollapsible && !isOpen && 'hidden'}`}>
          {customLogo || <Logo />}
        </div>
        {isCollapsible && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          </button>
        )}
      </div>

      <nav className="mt-8 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          if (useButtonNavigation && onNavItemClick) {
            return (
              <button
                key={item.name}
                onClick={() => onNavItemClick(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className={`ml-3 font-medium ${isCollapsible && !isOpen && 'hidden'}`}>
                  {item.name}
                </span>
              </button>
            );
          }
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className={`ml-3 font-medium ${isCollapsible && !isOpen && 'hidden'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button at Bottom */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
            isCollapsible && !isOpen && 'justify-center'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className={`ml-3 font-medium ${isCollapsible && !isOpen && 'hidden'}`}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
};

export default BaseSidebar;
