import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  isMobile,
}) => {
  const location = useLocation();

  const navigationItems = [
    {
      name: "Overview",
      href: "/admin/dashboard/overview",
      icon: HomeIcon,
    },
    {
      name: "User Management",
      href: "/admin/dashboard/users",
      icon: UsersIcon,
    },
    {
      name: "Appointments",
      href: "/admin/dashboard/appointments",
      icon: CalendarDaysIcon,
    },
    {
      name: "Reports",
      href: "/admin/dashboard/reports",
      icon: ChartBarIcon,
    },
  ];

  const sidebarClasses = `
    ${isMobile ? "fixed inset-y-0 left-0 z-40" : "relative"}
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    ${isMobile ? "w-64" : "w-64"}
    bg-white shadow-lg transition-transform duration-300 ease-in-out
    flex flex-col
  `;

  return (
    <div className={sidebarClasses}>
      {/* Sidebar header */}
      <div className="flex items-center justify-between h-16 px-6 bg-blue-600">
        <div className="flex items-center">
          <ShieldCheckIcon className="h-8 w-8 text-white" />
          <span className="ml-2 text-white font-semibold text-lg">
            Admin Panel
          </span>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? "text-blue-700" : "text-gray-400"
                }`}
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          MediTrack Admin v1.0
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
