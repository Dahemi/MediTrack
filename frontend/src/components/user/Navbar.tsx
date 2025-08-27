import React from "react";
import { Link } from "react-router-dom";
import Logo from "./logo";

const Navbar: React.FC = () => {
  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo />

          <div className="hidden md:flex space-x-8">
            <a
              href="#home"
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
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Login
            </Link>
          </div>

          <Link
            to="/register"
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Sign Up Free
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
