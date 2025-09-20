import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "./logo";

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo />

          <div className="hidden md:flex space-x-8">
            <a
              href="/"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Home
            </a>
            <a
              href="/doctorsdir"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Doctors
            </a>
            <a
              href="#features"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Features
            </a>
            <a
              href="#clinics"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              For Clinics
            </a>
            <a
              href="#pricing"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <img
                    src={
                      user.photoURL ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name
                      )}&background=3b82f6&color=fff`
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-100"
                  />
                  <span className="font-medium">{user.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      to="/doctorsdir"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      Book Appointment
                    </Link>
                    <Link
                      to="/my-appointments"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Appointments
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
