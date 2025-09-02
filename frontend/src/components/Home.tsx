import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./user/Navbar";
import HeroSection from "./user/HeroSection";
import { getCurrentUser } from "../services/api";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      // Redirect based on user role
      switch (currentUser.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'doctor':
        case 'patient':
          navigate('/dashboard');
          break;
        default:
          // Stay on homepage for unknown roles
          break;
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Navbar />
      <HeroSection />
    </div>
  );
};

export default HomePage;
