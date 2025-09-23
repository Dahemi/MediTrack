import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ sidebarOpen, setSidebarOpen, isMobile }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const navigationItems = [
    {
      name: "Overview",
      href: "/admin/dashboard/overview",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2 7-7 7 7 2 2M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
        </svg>
      ),
    },
    {
      name: "Users",
      href: "/admin/dashboard/users",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19v-1a4 4 0 00-8 0v1m8 0H7m8 0h2a2 2 0 002-2v-1a6 6 0 00-12 0v1a2 2 0 002 2h2m0-10a4 4 0 110-8 4 4 0 010 8z" />
        </svg>
      ),
    },
    {
      name: "Appointments",
      href: "/admin/dashboard/appointments",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v11" />
        </svg>
      ),
    },
    {
      name: "Reports",
      href: "/admin/dashboard/reports",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19V10m4 9V7m4 12v-5M7 19v-2M4 7h16M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
        </svg>
      ),
    },
  ];

  const sidebarClasses = `
    ${isMobile ? "fixed inset-y-0 left-0 z-40" : "relative"}
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    ${isMobile ? "w-64" : isOpen ? "w-64" : "w-20"}
    bg-white border-r border-gray-200 shadow-sm transition-transform duration-300 ease-in-out flex flex-col
  `;

  return (
    <div className={sidebarClasses}>
      {/* Sidebar header */}
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">A</div>
          <span className={`ml-2 font-semibold text-gray-800 ${!isOpen && !isMobile ? "hidden" : "block"}`}>
            Admin Panel
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {!isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Collapse sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          )}
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Close sidebar">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                isActive ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              <span className={`ml-3 ${!isOpen && !isMobile ? "hidden" : "block"}`}>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className={`flex items-center ${!isOpen && !isMobile ? "justify-center" : "justify-between"}`}>
          <span className={`text-xs text-gray-500 ${!isOpen && !isMobile ? "hidden" : "block"}`}>MediTrack Admin v1.0</span>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className={`ml-1 text-xs text-gray-500 ${!isOpen && !isMobile ? "hidden" : "block"}`}>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
