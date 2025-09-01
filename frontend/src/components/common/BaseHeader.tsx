import React, { useState, useRef, useEffect } from 'react';
import { logout } from '../../services/api';

export interface UserData {
  name: string;
  role: string;
  email?: string;
  avatar?: string;
}

export interface BaseHeaderProps {
  user?: UserData;
  pageTitle: string;
  extraElements?: React.ReactNode;
  customLogout?: () => void;
  customStyling?: string;
}

const BaseHeader: React.FC<BaseHeaderProps> = ({
  user,
  pageTitle,
  extraElements,
  customLogout,
  customStyling = ''
}) => {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    if (customLogout) {
      customLogout();
    } else {
      logout();
    }
  };

  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowProfilePopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={`bg-white border-b border-gray-200 ${customStyling}`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {pageTitle}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="ml-1 text-sm text-gray-500">Online</span>
          </div>
          
          {extraElements}
          
          {user && (
            <div className="relative" ref={popupRef}>
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={toggleProfilePopup}
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium">
                      {user.name.charAt(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Popup */}
              {showProfilePopup && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-medium text-lg">
                            {user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>

                    {/* Profile Summary */}
                    <div className="border-t border-gray-100 pt-3 mb-3">
                      <div className="text-sm text-gray-600">
                        <p><strong>Email:</strong> {user.email || 'Not provided'}</p>
                        <p><strong>Status:</strong> <span className="text-green-600">Active</span></p>
                        <p><strong>Last Login:</strong> {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <div className="border-t border-gray-100 pt-3">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default BaseHeader;
